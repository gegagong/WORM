// Run with geckodriver on port 4444. Instrumentation stays in this test server.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, extname, sep } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const driver = process.env.WORM_WEBDRIVER_URL || "http://127.0.0.1:4444";
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".webp": "image/webp" };
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    const path = resolve(root, `.${decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname)}`);
    if (!path.startsWith(root.endsWith(sep) ? root : root + sep)) throw new Error("Outside root");
    let body = await readFile(path);
    if (path.endsWith("index.html")) {
      body = body.toString().replace("<head>", `<head><script>
        window.__qaErrors = [];
        addEventListener('error', e => __qaErrors.push(e.message));
        addEventListener('unhandledrejection', e => __qaErrors.push(String(e.reason)));
      </script>`);
    } else if (path.endsWith("game.js")) {
      body = body.toString()
        .replace("function loop(time) {", "function loop(time) { return;")
        .replace("  initialize();\n})();", `
          const counts = {};
          const count = (name, target) => {
            const key = name + ':' + target.id;
            counts[key] = (counts[key] || 0) + 1;
          };
          const wrap = (name, fn) => (...args) => { count(name, args[0]); return fn(...args); };
          refreshTristarBehavior = wrap('decision', refreshTristarBehavior);
          tristarSteeringAngle = wrap('route', tristarSteeringAngle);
          chooseOffMinimapTristarSteeringAngle = wrap('remoteRoute', chooseOffMinimapTristarSteeringAngle);
          refreshTristarHunt = wrap('preySearch', refreshTristarHunt);
          nearestOffMinimapTristarPrey = wrap('remoteSearch', nearestOffMinimapTristarPrey);
          updateTristarFreeArms = wrap('arms', updateTristarFreeArms);
          updateTristarWormReach = wrap('reach', updateTristarWormReach);
          const originalClock = updateEnemyBehaviorClock;
          updateEnemyBehaviorClock = (target, dt) => {
            originalClock(target, dt);
            if (target.behaviorDue) count('clock', target);
          };
          window.__wormQA = { game, counts, startSelectedWorld, reset, updateTargets,
            updatePhysics, updateCamera, render, createEnemyTarget, beginTristarWormReach,
            getTristarArmPoints, ENEMY_TYPES, BLOCK_TYPES, MATERIAL_TILE_VALUES };
          window.__wormQAReady = initialize();
        })();`);
    }
    response.writeHead(200, { "Content-Type": mime[extname(path)] || "application/octet-stream", "Cache-Control": "no-store" });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end();
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
let session;
async function call(path, body, method = "POST") {
  const result = await fetch(`${driver}${path}`, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await result.json();
  if (!result.ok || data.value?.error) throw new Error(JSON.stringify(data.value));
  return data.value;
}
const js = (script, ...args) => call(`/session/${session}/execute/sync`, { script, args });
const asyncJs = (script) => call(`/session/${session}/execute/async`, { script, args: [] });

try {
  const created = await call("/session", { capabilities: { alwaysMatch: { browserName: "firefox", "moz:firefoxOptions": { args: ["-headless"] } } } });
  session = created.sessionId;
  await call(`/session/${session}/timeouts`, { script: 60000 });
  await call(`/session/${session}/window/rect`, { width: 1280, height: 900 });
  await call(`/session/${session}/url`, { url: `http://127.0.0.1:${server.address().port}/` });
  await asyncJs("const done=arguments[arguments.length-1]; __wormQAReady.then(()=>done(true));");
  await js(`
    const q = __wormQA;
    q.startSelectedWorld();
    q.setup = () => {
      const g = q.game;
      g.targets = []; g.targetById.clear(); g.targetByIdReady = false;
      g.tongues = []; g.tristarWormCapture = null; g.latchAttack = null;
      g.elapsed = 0; g.health = 100; g.wormDefeated = true;
      g.tristarWormDamageInvulnerability = 0;
      g.head.x = g.width / 2; g.head.y = g.groundY + 1200;
      g.segments.forEach((s, i) => { s.x = g.head.x - i * 10; s.y = g.head.y; });
      q.updateCamera(0);
      g.map.tiles.fill(q.MATERIAL_TILE_VALUES[q.BLOCK_TYPES.GROUND]);
      g.map.tiles.fill(q.MATERIAL_TILE_VALUES[q.BLOCK_TYPES.AIR], 0,
        Math.floor(g.groundY / g.map.cellSize) * g.map.columns);
      Object.keys(q.counts).forEach(key => delete q.counts[key]);
      return g;
    };
    q.spawn = (kind, dx = 0, dy = 0) => {
      const g = q.game;
      const target = q.createEnemyTarget(kind, g.head.x + dx, g.head.y + dy,
        q.BLOCK_TYPES.GROUND, () => 0.37);
      g.targets.push(target);
      return target;
    };
    q.step = dt => { q.game.elapsed += dt; q.updateTargets(dt); };
  `);

  for (const fps of [30, 60, 120, 144, 180]) {
    const result = await js(`
      const q = __wormQA, g = q.setup(), fps = arguments[0], e = q.ENEMY_TYPES;
      const beetle = q.spawn(e.BEETLE, 4000);
      Object.assign(beetle, { movementMode:'moving', moveRemaining:100000, angle:0 });
      q.spawn(e.MOLE, 4200); q.spawn(e.RABBIT, 4300);
      q.spawn(e.DRAGONFLY, 4400); q.spawn(e.VULTURE, 4500);
      const near = q.spawn(e.TRISTAR, 100), remote = q.spawn(e.TRISTAR, -7000);
      const targets = [...g.targets];
      let movedWithoutDecision = 0, badSnapshot = false;
      for (let frame = 0; frame < fps * 2; frame++) {
        const previousX = beetle.x;
        q.step(1 / fps);
        badSnapshot ||= Math.abs(beetle.acidPreviousX - previousX) > 1e-8;
        if (!beetle.behaviorDue && beetle.x > previousX) movedWithoutDecision++;
      }
      return { checks:targets.map(t=>q.counts['clock:'+t.id]||0),
        decisions:q.counts['decision:'+near.id]||0, routes:q.counts['route:'+near.id]||0,
        remoteRoutes:q.counts['remoteRoute:'+remote.id]||0,
        searches:q.counts['preySearch:'+near.id]||0,
        remoteSearches:q.counts['remoteSearch:'+remote.id]||0,
        arms:q.counts['arms:'+near.id]||0, reaches:q.counts['reach:'+near.id]||0,
        movedWithoutDecision, badSnapshot,
        finite:targets.every(t=>[t.x,t.y,t.vx,t.vy,t.angle].every(Number.isFinite)) };
    `, fps);
    assert.ok(result.finite && !result.badSnapshot, JSON.stringify(result));
    assert.ok(result.checks.every(n => n >= 57 && n <= 60), JSON.stringify(result));
    for (const key of ["decisions", "routes", "remoteRoutes"]) {
      assert.ok(result[key] > 0 && result[key] <= 60, `${key}: ${JSON.stringify(result)}`);
    }
    assert.ok(result.searches > 0 && result.searches <= 14);
    assert.ok(result.remoteSearches > 0 && result.remoteSearches <= 4);
    assert.equal(result.arms, fps * 2);
    assert.equal(result.reaches, fps * 2);
    if (fps > 30) assert.ok(result.movedWithoutDecision > 0);
    console.log(`PASS ${fps} FPS: ${result.decisions / 2} AI checks/sec; arms and contacts ${fps}/sec; slower prey timers retained`);
  }

  const reaction = await js(`
    const q=__wormQA,g=q.setup(),fly=q.spawn(q.ENEMY_TYPES.DRAGONFLY);
    g.targets=[fly];g.wormDefeated=false;
    g.head.x=fly.x+1000;g.head.y=fly.y;
    fly.behaviorCooldown=0;q.step(1/180);
    g.head.x=fly.x;g.head.y=fly.y;
    let waited=0,early=false;
    do {
      q.step(1/180);waited++;
      if(!fly.behaviorDue && fly.movementMode==='dragonfly-panicking') early=true;
    } while(fly.movementMode!=='dragonfly-panicking' && waited<8);
    return {waited,early,mode:fly.movementMode};
  `);
  assert.equal(reaction.early, false);
  assert.equal(reaction.mode, "dragonfly-panicking");
  assert.equal(reaction.waited, 6);

  const rabbit = await js(`
    const q=__wormQA,g=q.setup(),r=q.spawn(q.ENEMY_TYPES.RABBIT);
    g.targets=[r];r.rabbitRestRemaining=0.05;r.behaviorCooldown=0;
    let waited=0;
    do {q.step(1/180);waited++;} while(r.movementMode!=='rabbit-jumping'&&waited<30);
    const jumped=r.movementMode==='rabbit-jumping';
    r.y=g.groundY-r.radius-0.1;r.vx=0;r.vy=100;r.behaviorCooldown=1/30;
    q.step(1/180);
    return {jumped,waited,landed:r.movementMode==='rabbit-resting',due:r.behaviorDue};
  `);
  assert.ok(rabbit.jumped && rabbit.waited >= 9 && rabbit.waited <= 15);
  assert.ok(rabbit.landed && !rabbit.due, JSON.stringify(rabbit));
  console.log("PASS: reactions wait for AI; rabbit timers and landing collisions retain real simulation time");

  const capture = await js(`
    const q=__wormQA,g=q.setup(),t=q.spawn(q.ENEMY_TYPES.TRISTAR);
    g.targets=[t];g.wormDefeated=false;t.tristarDetailedTerrainAvoidance=true;
    const points=q.getTristarArmPoints(t,0),tip=points[points.length-1];
    g.head.x=tip.x;g.head.y=tip.y;
    g.segments.forEach(s=>{s.x=tip.x;s.y=tip.y;});q.updateCamera(0);
    const started=q.beginTristarWormReach(t,{x:tip.x,y:tip.y,radius:20,segmentIndex:0});
    t.behaviorCooldown=1/30;q.step(1/180);
    return {started,captured:!!g.tristarWormCapture,due:t.behaviorDue,mode:t.movementMode};
  `);
  assert.ok(capture.started && capture.captured && !capture.due, JSON.stringify(capture));
  assert.equal(capture.mode, "tristar-eating-worm");
  console.log("PASS: a Tri-Star arm captures the worm on a frame without an AI decision");

  const remoteSafety = await js(`
    const q=__wormQA,g=q.setup(),t=q.spawn(q.ENEMY_TYPES.TRISTAR,-6000);
    const prey=q.spawn(q.ENEMY_TYPES.MOLE,-4000);
    t.behaviorCooldown=0;t.tristarOffMinimapSearchCooldown=0;q.step(1/180);
    const acquired=t.tristarOffMinimapTarget===prey;
    g.targets=g.targets.filter(target=>target!==prey);q.step(1/180);
    const released=!t.tristarOffMinimapTarget&&t.vx===0&&!t.behaviorDue;
    g.targets.push(prey);
    for(let frame=0;frame<6;frame++)q.step(1/180);
    t.x=Math.ceil(t.x/g.map.cellSize)*g.map.cellSize-1;
    const column=Math.floor((t.x+600/180)/g.map.cellSize),row=Math.floor(t.y/g.map.cellSize);
    g.map.tiles[row*g.map.columns+column]=q.MATERIAL_TILE_VALUES[q.BLOCK_TYPES.AIR];
    const x=t.x;q.step(1/180);
    return {acquired,released,stopped:t.x===x&&t.vx===0&&!t.behaviorDue};
  `);
  assert.ok(remoteSafety.acquired && remoteSafety.released && remoteSafety.stopped,
    JSON.stringify(remoteSafety));
  console.log("PASS: remote Tri-Stars immediately stop for removed prey or newly blocked terrain between decisions");

  await js(`
    const q=__wormQA;
    q.reset();
    for(let frame=0;frame<60;frame++) {q.game.elapsed+=1/120;q.updatePhysics(1/120);}
    q.updateCamera(1/120);q.render();
  `);
  assert.deepEqual(await js("return __qaErrors;"), []);
  console.log("PASS: normal-world physics/render smoke check; no browser errors");
} finally {
  if (session) await call(`/session/${session}`, undefined, "DELETE").catch(() => {});
  await new Promise((done) => server.close(done));
}
