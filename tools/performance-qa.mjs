// Run with geckodriver --port 4444. All state access stays in this test server.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdtemp, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, extname, sep } from "node:path";
import { tmpdir } from "node:os";

const root = fileURLToPath(new URL("../", import.meta.url));
const driver = process.env.WORM_WEBDRIVER_URL || "http://127.0.0.1:4444";
const artifacts = await mkdtemp(resolve(tmpdir(), "worm-performance-qa-"));
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".webp": "image/webp" };
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    const path = resolve(root, `.${decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname)}`);
    if (!path.startsWith(root.endsWith(sep) ? root : root + sep)) throw new Error("Outside root");
    let body = await readFile(path);
    if (path.endsWith("index.html")) {
      body = body.toString().replace("<head>", `<head><script>
        window.__qaErrors=[];
        addEventListener('error',e=>__qaErrors.push(e.message));
        addEventListener('unhandledrejection',e=>__qaErrors.push(String(e.reason)));
      </script>`);
    } else if (path.endsWith("game.js")) {
      body = body.toString().replace("function loop(time) {", "function loop(time) { return;")
        .replace("  initialize();\n})();", `
          const metrics={exactChecks:0,depthDraws:0,particleAcquisitions:0};
          const exact=targetOverlapsEatConeAtPose,depth=drawTerrainContourPaths;
          const cachedDepth=cachedTerrainDepthLayer,acquire=acquireParticle;
          targetOverlapsEatConeAtPose=(...args)=>{metrics.exactChecks++;return exact(...args);};
          drawTerrainContourPaths=(...args)=>{metrics.depthDraws++;return depth(...args);};
          acquireParticle=()=>{metrics.particleAcquisitions++;return acquire();};
          window.__perfQA={game,canvas,ctx,metrics,exact,terrainDepthCache,
            startSelectedWorld,reset,setEffectiveWormLevel,setActiveWormType,controlInput,
            getEatHitboxSweep,getEatConeGeometry,getEatConeWorldPoints,eatHitboxPoseAlongSweep,
            targetTouchesEatCone,createEnemyTarget,refillRoundTargetsTimeSliced,
            clearParticles,spawnParticles,spawnBiteSplatter,spawnWormChunkSplash,updateParticles,
            updatePhysics,updateCamera,render,rebuildTerrainLayer,tunnelGroundBlocksAlongPath,
            ENEMY_TYPES,BLOCK_TYPES,MATERIAL_TILE_VALUES,TERRAIN_DEPTH_CACHE_RULES,
            setCaching:enabled=>{cachedTerrainDepthLayer=enabled?cachedDepth:()=>null;},
            setDpr:value=>{game.dpr=value;canvas.width=Math.round(game.viewport.width*value);
              canvas.height=Math.round(game.viewport.height*value);ctx.setTransform(value,0,0,value,0,0);},
            renderMap:()=>{ctx.clearRect(0,0,game.viewport.width,game.viewport.height);
              ctx.save();ctx.scale(cameraZoom(),cameraZoom());ctx.translate(-game.camera.x,-game.camera.y);
              drawMap();ctx.restore();},
            warm:()=>{for(let i=0;i<40;i++)render();},
          };
          window.__qaReady=initialize();
        })();`);
    }
    response.writeHead(200, { "Content-Type": mime[extname(path)] || "application/octet-stream", "Cache-Control": "no-store" });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end();
  }
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
let session;
async function call(path, body, method = "POST") {
  const response = await fetch(driver + path, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const json = await response.json();
  if (!response.ok || json.value?.error) throw new Error(JSON.stringify(json.value));
  return json.value;
}
const js = (script, ...args) => call(`/session/${session}/execute/sync`, { script, args });
const results = {};
try {
  const created = await call("/session", { capabilities: { alwaysMatch: { browserName: "firefox", "moz:firefoxOptions": {
    args: ["-headless"], prefs: { "privacy.reduceTimerPrecision": false },
  } } } });
  session = created.sessionId;
  await call(`/session/${session}/timeouts`, { script: 60000 });
  await call(`/session/${session}/window/rect`, { width: 1280, height: 900 });
  await call(`/session/${session}/url`, { url: `http://127.0.0.1:${server.address().port}/` });
  await js("return __qaReady.then(()=>{__perfQA.startSelectedWorld();return true;});");

  results.mouth = await js(`
    const q=__perfQA,g=q.game;q.reset();g.targets=[];
    const pose=q.getEatHitboxSweep().current;
    const sweep={previous:{...pose,angle:pose.angle-Math.PI},current:pose,angleDelta:Math.PI,steps:40};
    const cone=q.getEatConeGeometry();
    const target=q.createEnemyTarget(q.ENEMY_TYPES.BEETLE,g.head.x+5000,g.head.y,q.BLOCK_TYPES.GROUND,()=>0.4);
    const targets=Array.from({length:10000},(_,id)=>({...target,id}));
    let start=performance.now();q.metrics.exactChecks=0;
    for(const t of targets)q.targetTouchesEatCone(t,sweep,cone);
    const filtered=performance.now()-start,exactChecks=q.metrics.exactChecks;
    start=performance.now();let referenceHits=0;
    for(const t of targets){for(let step=0;step<=sweep.steps;step++){
      if(q.exact(t,q.eatHitboxPoseAlongSweep(sweep,step),cone)){referenceHits++;break;}
    }}
    return {filteredMs:filtered,referenceMs:performance.now()-start,exactChecks,referenceHits};
  `);
  assert.equal(results.mouth.exactChecks, 0);
  assert.equal(results.mouth.referenceHits, 0);
  console.log("PASS: 10,000 distant mouth candidates skip exact geometry", results.mouth);

  for (const type of ["licker", "spitter", "sprinter"]) {
    const capture = await js(`return __perfQA.setActiveWormType(arguments[0]).then(()=>{
      const q=__perfQA,g=q.game;q.reset();g.growthLevelOverride=50;q.setEffectiveWormLevel(50);
      g.targets=[];g.capturedTargets=[];g.meatTargetCount=0;g.roundUnspawnedPoints=0;
      const cone=q.getEatConeWorldPoints();
      const prey=q.createEnemyTarget(q.ENEMY_TYPES.BEETLE,(cone.pivotX+cone.wideX)/2,
        (cone.pivotY+cone.wideY)/2,q.BLOCK_TYPES.GROUND,()=>0.4);
      prey.turnRemaining=100;prey.vx=prey.vy=0;g.targets.push(prey);
      q.updatePhysics(1/120);
      return g.capturedTargets.includes(prey)&&!g.targets.includes(prey);
    });`, type);
    assert.ok(capture, `${type} mouth capture`);
  }
  console.log("PASS: real mouth captures remain active for all three worm types");

  results.refill = await js(`
    const q=__perfQA,g=q.game;q.reset();g.targets.splice(0,300);
    const initialId=g.nextTargetId,initialPoints=g.roundUnspawnedPoints;
    let pendingFrames=0,frames=0,maxSpawns=0;const times=[];
    for(;frames<1200&&g.targets.length<1000;frames++){
      const before=g.targets.length,start=performance.now();
      q.refillRoundTargetsTimeSliced();times.push(performance.now()-start);
      maxSpawns=Math.max(maxSpawns,g.targets.length-before);
      pendingFrames+=!!g.roundSpawnPending;g.elapsed+=1/120;
    }
    const added=g.targets.filter(t=>t.id>=initialId);
    const counts=g.targets.reduce((o,t)=>(o[t.kind]=(o[t.kind]||0)+1,o),{});
    times.sort((a,b)=>a-b);
    return {frames,pendingFrames,maxSpawns,count:g.targets.length,unique:new Set(g.targets.map(t=>t.id)).size,
      pointsSpent:initialPoints-g.roundUnspawnedPoints,addedPoints:added.reduce((n,t)=>n+t.scoreValue,0),
      counts,finite:added.every(t=>[t.x,t.y,t.radius,t.vx,t.vy].every(Number.isFinite)),
      armsReady:added.filter(t=>t.kind==='tristar').every(t=>t.tristarArms?.length===3),
      medianMs:times[Math.floor(times.length/2)],p95Ms:times[Math.floor(times.length*.95)],maxMs:times.at(-1)};
  `);
  assert.equal(results.refill.count, 1000);
  assert.equal(results.refill.unique, 1000);
  assert.equal(results.refill.pointsSpent, results.refill.addedPoints);
  assert.ok(results.refill.maxSpawns <= 4 && results.refill.finite && results.refill.armsReady);
  assert.ok(Object.values(results.refill.counts).every(count => count <= 500));
  console.log("PASS: replacement searches refill without losing points, IDs, or quotas", results.refill);

  results.particles = await js(`
    const q=__perfQA,g=q.game;q.clearParticles();q.metrics.particleAcquisitions=0;
    for(let i=0;i<300;i++){q.spawnParticles(0,0,21,'beetle',3);q.spawnBiteSplatter(0,0,0,3,30);}
    const first=new Set(g.particles),acquired=q.metrics.particleAcquisitions;
    q.updateParticles(10);g.particleSpawnsRemaining=280;
    q.spawnWormChunkSplash(0,0,0,2,10000);
    return {acquired,live:g.particles.length,reused:g.particles.every(p=>first.has(p)),
      total:g.particles.length+g.particlePool.length};
  `);
  assert.equal(results.particles.acquired, 280);
  assert.equal(results.particles.live, 280);
  assert.equal(results.particles.total, 280);
  assert.ok(results.particles.reused);
  console.log("PASS: mass meals allocate at most the particle allowance and reuse the pool");

  await js(`
    const q=__perfQA;q.clearParticles();q.reset();
    q.compareTerrain=()=>{
      q.setCaching(false);q.renderMap();
      const a=q.ctx.getImageData(0,0,q.canvas.width,q.canvas.height).data;
      q.setCaching(true);for(let i=0;i<4;i++)q.renderMap();
      const b=q.ctx.getImageData(0,0,q.canvas.width,q.canvas.height).data;
      let difference=0,alphaDifference=0;
      for(let i=0;i<a.length;i++){
        const delta=Math.abs(a[i]-b[i]);difference+=delta;
        if(i%4===3)alphaDifference+=delta;
      }
      return {mean:difference/a.length,alphaMean:alphaDifference/(a.length/4),
        pixels:[...q.terrainDepthCache.layers.values()].reduce((n,c)=>n+c.canvas.width*c.canvas.height,0)};
    };
  `);
  results.terrain = [];
  for (const level of [0, 20, 50, 100]) {
    for (const custom of [false, true]) {
      const samples = await js(`
        const q=__perfQA,g=q.game,level=arguments[0],custom=arguments[1];
        const saved=g.map.tiles.slice();
        g.growthLevelOverride=level;q.setEffectiveWormLevel(level);q.updateCamera(0);
        if(custom){
          const middle=Math.floor(g.head.x/g.map.cellSize),top=Math.floor(g.groundY/g.map.cellSize);
          for(let row=top+3;row<top+34;row++){
            for(let column=middle-70;column<middle+70;column++){
              const offset=column-middle+70;
              g.map.tiles[row*g.map.columns+column]=offset%24<9
                ? q.MATERIAL_TILE_VALUES[q.BLOCK_TYPES.AIR]
                : q.MATERIAL_TILE_VALUES[q.BLOCK_TYPES.STONE];
            }
          }
          q.rebuildTerrainLayer();
        }
        q.warm();const samples=[];
        for(const dx of [0,20,90,-110]){
          g.camera.x+=dx;g.camera.centerX+=dx;
          samples.push({level,custom,dx,...q.compareTerrain()});
        }
        q.metrics.depthDraws=0;q.renderMap();
        const redraws=q.metrics.depthDraws;
        g.map.tiles.set(saved);q.rebuildTerrainLayer();
        return {samples,redraws};
      `, level, custom);
      for (const sample of samples.samples) {
        assert.ok(sample.mean < 1.5 && sample.alphaMean < 0.5, JSON.stringify(sample));
        assert.ok(sample.pixels <= 8 * 1024 * 1024);
      }
      assert.equal(samples.redraws, 0, "warm, unchanged terrain should not restroke paths");
      results.terrain.push(...samples.samples);
    }
  }
  console.log("PASS: cached terrain matches direct rendering across zoom, moving cameras, and custom caves");

  results.tunnel = await js(`
    const q=__perfQA,g=q.game;g.growthLevelOverride=50;q.setEffectiveWormLevel(50);q.updateCamera(0);q.warm();
    q.tunnelGroundBlocksAlongPath(g.head.x,g.head.y,g.head.x+200,g.head.y);
    q.metrics.depthDraws=0;q.renderMap();const redraws=q.metrics.depthDraws;
    return {redraws,...q.compareTerrain()};
  `);
  assert.equal(results.tunnel.redraws, 0);
  assert.ok(results.tunnel.mean < 1.5 && results.tunnel.alphaMean < 0.5);
  console.log("PASS: digging updates foreground paint without invalidating static depth");

  await call(`/session/${session}/window/rect`, { width: 900, height: 700 });
  results.resize = await js(`
    const q=__perfQA;q.setDpr(2);q.updateCamera(0);q.warm();
    return q.compareTerrain();
  `);
  assert.ok(results.resize.mean < 1.5 && results.resize.alphaMean < 0.5);
  assert.ok(results.resize.pixels <= 8 * 1024 * 1024);
  await writeFile(resolve(artifacts, "terrain.png"), Buffer.from(
    await js("__perfQA.render();return __perfQA.canvas.toDataURL('image/png').split(',')[1];"), "base64",
  ));
  console.log("PASS: resized high-DPI viewport stays within the bitmap budget");
  assert.deepEqual(await js("return __qaErrors;"), []);
  await writeFile(resolve(artifacts, "results.json"), JSON.stringify(results, null, 2));
  console.log(`Performance QA artifacts: ${artifacts}`);
} finally {
  if (session) await call(`/session/${session}`, undefined, "DELETE").catch(() => {});
  await new Promise(done => server.close(done));
}
