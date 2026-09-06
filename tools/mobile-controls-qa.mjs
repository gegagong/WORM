// Run with a local geckodriver on port 4444. Uses a disposable Firefox profile.
// Test-only state access is injected by this loopback server, never shipped.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdtemp, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, extname, sep } from "node:path";
import { tmpdir } from "node:os";

const root = fileURLToPath(new URL("../", import.meta.url));
const driver = process.env.WORM_WEBDRIVER_URL || "http://127.0.0.1:4444";
const artifacts = await mkdtemp(resolve(tmpdir(), "worm-mobile-qa-"));
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".webp": "image/webp" };
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    const path = resolve(root, `.${decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname)}`);
    if (!path.startsWith(root.endsWith(sep) ? root : root + sep)) throw new Error("Outside root");
    let body = await readFile(path);
    if (path.endsWith("index.html")) {
      body = body.toString().replace("<head>", `<head><script>
        window.__pauseQALoop = true;
        window.__qaErrors = [];
        addEventListener('error', e => __qaErrors.push(e.message));
        addEventListener('unhandledrejection', e => __qaErrors.push(String(e.reason)));
        window.__qaTouches = [];
        addEventListener('pointerdown', e => __qaTouches.push({id:e.pointerId,primary:e.isPrimary,target:e.target.id}), true);
      </script>`);
    } else if (path.endsWith("game.js")) {
      body = body.toString()
        .replace("function loop(time) {", "function loop(time) { if (window.__pauseQALoop) { requestAnimationFrame(loop); return; }")
        .replace("  initialize();\n})();", `
          window.__wormQA = { game, motion, controls, controlInput, abilityPointer, spitterPointer,
            tonguePointer, startSelectedWorld, setActiveWormType, updatePhysics, reset,
            clearControlKeys, updateMovementInput, openMainMenu, closeMainMenu, render, updateHud,
            canvasWorldPointFromClient, showDeathScreen, showHomeScreen };
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
const base = `http://127.0.0.1:${server.address().port}`;
let session;
async function call(path, body, method = "POST") {
  const result = await fetch(`${driver}${path}`, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await result.json();
  if (!result.ok || data.value?.error) throw new Error(JSON.stringify(data.value));
  return data.value;
}
const js = (script, ...args) => call(`/session/${session}/execute/sync`, { script, args });
const asyncJs = (script, ...args) => call(`/session/${session}/execute/async`, { script, args });
const actions = (sources) => call(`/session/${session}/actions`, { actions: sources });
const touch = (id, steps) => ({ type: "pointer", id, parameters: { pointerType: "touch" }, actions: steps });
const move = (x, y) => ({ type: "pointerMove", x: Math.round(x), y: Math.round(y), duration: 0, origin: "viewport" });
const down = { type: "pointerDown", button: 0 };
const up = { type: "pointerUp", button: 0 };
const pause = { type: "pause", duration: 0 };
async function viewport(width, height) {
  const chrome = await js("return {w:outerWidth-innerWidth,h:outerHeight-innerHeight}");
  await call(`/session/${session}/window/rect`, { width: width + chrome.w, height: height + chrome.h });
  await asyncJs("const done=arguments[arguments.length-1]; requestAnimationFrame(()=>requestAnimationFrame(()=>done(true)));");
}
async function capture(name) {
  await asyncJs("const done=arguments[arguments.length-1]; Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{}))).then(()=>done(true));");
  await js("__wormQA.render(); __wormQA.updateHud();");
  const data = await call(`/session/${session}/screenshot`, undefined, "GET");
  await writeFile(resolve(artifacts, name + ".png"), Buffer.from(data, "base64"));
}
async function neutral() {
  await call(`/session/${session}/actions`, undefined, "DELETE");
  await js("__wormQA.clearControlKeys();");
}
async function geometry() {
  return js(`const r = id => { const b=document.getElementById(id).getBoundingClientRect(); return {x:b.x+b.width/2,y:b.y+b.height/2,r:b.width/2,left:b.left,right:b.right,top:b.top,bottom:b.bottom}; }; return {stick:r('touch-stick'),boost:r('touch-boost'),health:r('worm-health-hud'),radar:r('minimap'),menu:r('main-menu-button'),w:innerWidth,h:innerHeight};`);
}
try {
  const created = await call("/session", { capabilities: { alwaysMatch: { browserName: "firefox", "moz:firefoxOptions": { args: ["-headless"], prefs: { "dom.w3c_touch_events.enabled": 1 } } } } });
  session = created.sessionId;
  await call(`/session/${session}/timeouts`, { script: 60000 });
  await call(`/session/${session}/url`, { url: base + "/?touch=1" });
  await asyncJs("const done=arguments[arguments.length-1]; __wormQAReady.then(()=>done(true));");
  await viewport(844, 390);
  await capture("home-landscape");
  await js("__wormQA.startSelectedWorld(); __wormQA.render();");
  for (const [w, h] of [[568, 320], [667, 375], [844, 390], [1024, 768]]) {
    await viewport(w, h);
    const g = await geometry();
    for (const key of ["stick", "boost", "health", "radar", "menu"]) {
      const b = g[key];
      assert.ok(b.left >= 0 && b.top >= 0 && b.right <= g.w && b.bottom <= g.h, `${key} outside ${w}x${h}`);
    }
    assert.ok(g.stick.top > g.radar.bottom, "radar overlaps joystick");
    assert.ok(g.boost.top > g.menu.bottom, "menu overlaps Boost");
    assert.equal(await js("return getComputedStyle(document.querySelector('.dev-menu')).display;"), "none", "closed developer panel should not paint scrollbars");
    const telemetry = await js("return document.querySelector('.telemetry').getBoundingClientRect().left;");
    assert.ok(g.health.right < telemetry, "health overlaps telemetry");
    await capture(`play-${w}x${h}`);
  }
  console.log("PASS: landscape layout at 568×320, 667×375, 844×390, and 1024×768");
  await viewport(844, 390);
  const g = await geometry();
  await actions([touch("stick", [move(g.stick.x, g.stick.y), down, move(g.stick.x, g.stick.y - g.stick.r * 0.65)])]);
  let state = await js("return {...__wormQA.controls};");
  assert.ok(state.throttle > 0.5 && state.throttle < 0.7 && !state.boostHeld);
  await actions([touch("button", [move(g.boost.x, g.boost.y), down])]);
  assert.equal(await js("return __wormQA.controls.boostHeld;"), true);
  await actions([touch("stick", [up])]);
  state = await js("return {...__wormQA.controls};");
  assert.equal(state.throttle, 0);
  assert.equal(state.boostHeld, true);
  await neutral();
  console.log("PASS: independent joystick and Boost pointer capture/release");

  for (const type of ["licker", "spitter", "sprinter"]) {
    await asyncJs("const done=arguments[arguments.length-1]; __wormQA.setActiveWormType(arguments[0]).then(()=>{__wormQA.reset();done(true)});", type);
    await actions([
      touch("stick", [move(g.stick.x, g.stick.y), down, move(g.stick.x, g.stick.y-g.stick.r*0.65), pause]),
      touch("ability", [pause, pause, move(500, 220), down]),
    ]);
    const active = await js("return {control:{...__wormQA.controls},id:__wormQA.abilityPointer.pointerId,spit:__wormQA.spitterPointer.pointerId,hunt:!!__wormQA.game.sprinterAreaTarget,tongues:__wormQA.game.tongues.length,touches:__qaTouches.slice(-2)};");
    assert.ok(active.control.throttle > 0);
    assert.notEqual(active.id, null);
    assert.equal(active.touches.at(-1).primary, false);
    if (type === "licker") assert.ok(active.tongues > 0, "tap must actually launch a tongue");
    if (type === "spitter") assert.equal(active.spit, active.id);
    if (type === "sprinter") assert.equal(active.hunt, true);
    await actions([touch("extra", [move(550,220),down,up])]);
    assert.equal(await js("return __wormQA.abilityPointer.pointerId;"), active.id, "extra finger cannot replace or release the ability owner");
    if (type === "spitter") {
      await actions([touch("ability", [move(560,240)])]);
      assert.equal(await js("return Math.round(__wormQA.spitterPointer.clientX);"), 560);
    }
    const live = await asyncJs(`const done=arguments[arguments.length-1];
      const q=__wormQA; q.game.lastTime=performance.now(); q.game.lastRenderTime=q.game.lastTime;
      window.__pauseQALoop=false; let frames=0;
      const tick=()=>{if(++frames<12){requestAnimationFrame(tick);return;}
        window.__pauseQALoop=true;
        done({elapsed:q.game.elapsed,finite:Number.isFinite(q.game.head.x)&&Number.isFinite(q.game.head.y)&&Number.isFinite(q.game.speed),errors:__qaErrors});
      };requestAnimationFrame(tick);`);
    assert.ok(live.elapsed > 0 && live.finite, `${type} live simulation must advance without invalid movement`);
    assert.deepEqual(live.errors, []);
    await actions([touch("ability", [up])]);
    assert.equal(await js("return __wormQA.abilityPointer.pointerId;"), null);
    assert.equal(await js("return __wormQA.spitterPointer.pointerId;"), null);
    assert.ok(await js("return __wormQA.controlInput.stick.active;"));
    await neutral();
  }
  console.log("PASS: all three worms accept a non-primary ability touch while steering and run live frames without errors");

  await asyncJs("const done=arguments[arguments.length-1]; __wormQA.setActiveWormType('licker').then(()=>{__wormQA.reset();done(true)});");
  const directional = await js(`const q=__wormQA;
    const sample=(degrees,speed=200,air=false)=>{
      q.reset();q.game.heading=0;q.game.speed=speed;q.game.velocity.x=speed;q.game.velocity.y=0;
      if(air)q.game.inGround=false;
      const a=degrees*Math.PI/180;q.controlInput.setStick(Math.cos(a)*0.75,Math.sin(a)*0.75);
      q.updatePhysics(1/120);
      return {heading:q.game.heading,speed:q.game.speed,input:{...q.controls}};
    };
    const gravity=q.motion.airGravity;q.motion.airGravity=0;
    const result={north:sample(-90),angledBrake:sample(130),straightBrake:sample(175),
      nearAim:sample(0.05),restTurn:sample(130,0),restStop:sample(180,0),
      airAim:sample(-60,200,true),airBrake:sample(130,200,true),airStop:sample(180,200,true)};
    q.motion.airGravity=gravity;q.reset();return result;`);
  assert.ok(directional.north.heading < 0 && directional.north.input.brake === 0);
  assert.ok(directional.angledBrake.heading > 0 && directional.angledBrake.speed < 200);
  assert.ok(directional.straightBrake.input.brake > 0 && directional.straightBrake.speed < 200);
  assert.ok(Math.abs(directional.straightBrake.heading) < 1e-9);
  assert.ok(Math.abs(directional.nearAim.heading - 0.05*Math.PI/180) < 1e-9, "small aim changes must not overshoot");
  assert.ok(directional.restTurn.heading > 0 && directional.restTurn.speed === 0);
  assert.ok(directional.restStop.heading === 0 && directional.restStop.speed === 0);
  assert.ok(directional.airAim.heading < 0 && Math.abs(directional.airAim.speed-200) < 1e-8);
  assert.ok(directional.airBrake.heading > 0 && directional.airBrake.speed < 200);
  assert.ok(Math.abs(directional.airStop.heading) < 1e-9 && directional.airStop.speed < 200);
  console.log("PASS: ground/air aim, angled braking, brake-only cone, at-rest turns, and no aerial thrust");

  await js("const q=__wormQA;q.game.heading=0;q.game.speed=200;q.game.velocity.x=200;q.game.velocity.y=0;q.updateMovementInput();");
  await actions([touch("stick",[move(g.stick.x,g.stick.y),down,move(g.stick.x+g.stick.r*0.75,g.stick.y)])]);
  assert.ok(await js("return __wormQA.controls.throttle > 0;"));
  await js("const q=__wormQA;q.game.heading=Math.PI;q.game.velocity.x=-200;q.updatePhysics(1/120);");
  assert.ok(await js("return __wormQA.controls.brake > 0 && __wormQA.controlInput.stick.active;"));
  assert.equal(await js("return document.getElementById('touch-stick-status').textContent;"), "Brake");
  await capture("held-stick-after-bounce");
  await neutral();
  await js("__wormQA.reset();");
  console.log("PASS: a stationary held touch and joystick markings react to reversed momentum");

  const forwardAngle = await js("return __wormQA.controlInput.stick.movementAngle;");
  const forwardX = g.stick.x + Math.cos(forwardAngle) * g.stick.r;
  const forwardY = g.stick.y + Math.sin(forwardAngle) * g.stick.r;
  await actions([touch("stick", [move(g.stick.x,g.stick.y),down,move(forwardX,forwardY)])]);
  await js("const p=__qaTouches.at(-1).id; document.getElementById('touch-stick').dispatchEvent(new PointerEvent('pointercancel',{pointerId:p,bubbles:true}));");
  assert.equal(await js("return __wormQA.controls.throttle;"), 0);
  await neutral();
  console.log("PASS: pointer cancellation releases the joystick");

  await actions([touch("stick", [move(g.stick.x,g.stick.y),down,move(forwardX,forwardY)])]);
  assert.equal(await js("return __wormQA.controls.boostHeld;"), true);
  await js("__wormQA.openMainMenu();");
  assert.deepEqual(await js("return {...__wormQA.controls};"), { steer:0, throttle:0, brake:0, boostHeld:false });
  await neutral();
  await js("__wormQA.closeMainMenu();");
  await viewport(390, 844);
  assert.equal(await js("return !document.getElementById('rotate-notice').hidden && __wormQA.game.paused;"), true);
  await capture("portrait-paused");
  await viewport(844,390);
  assert.equal(await js("return document.getElementById('rotate-notice').hidden && __wormQA.game.paused;"), true);
  await js("__wormQA.closeMainMenu();");
  console.log("PASS: pause clears inputs; portrait pauses and requires explicit Continue");

  const speeds = await js(`const q=__wormQA;
    q.reset();q.controlInput.setKey('up',true);q.updatePhysics(1/120);const full=q.game.speed;
    q.reset();q.controlInput.setStick(0,-0.58);q.updatePhysics(1/120);const half=q.game.speed;
    q.reset();return {full,half};`);
  assert.ok(speeds.full > 0);
  assert.ok(Math.abs(speeds.half/speeds.full - 0.5) < 0.01, JSON.stringify(speeds));
  console.log("PASS: half throttle produces half ground acceleration");
  await js("window.dispatchEvent(new Event('blur'));");
  assert.equal(await js("return __wormQA.game.paused;"), true);
  await js("__wormQA.closeMainMenu(); __wormQA.game.wormDefeated=true; __wormQA.showDeathScreen();");
  assert.equal(await js("return getComputedStyle(document.querySelector('.touch-controls')).display;"), "none");
  assert.equal(await js("return __wormQA.controls.boostHeld;"), false);
  assert.deepEqual(await js("return __qaErrors;"), []);

  await call(`/session/${session}/url`, { url:base+"/" });
  await asyncJs("const done=arguments[arguments.length-1]; __wormQAReady.then(()=>done(true));");
  await viewport(1280,800);
  await asyncJs("const done=arguments[arguments.length-1]; __wormQA.setActiveWormType('licker').then(()=>done(true));");
  await js("__wormQA.startSelectedWorld();");
  assert.equal(await js("return getComputedStyle(document.querySelector('.touch-controls')).display;"), "none");
  await actions([{type:"key",id:"keyboard",actions:[{type:"keyDown",value:"w"},{type:"keyDown",value:"d"},{type:"keyDown",value:" "}]}]);
  assert.deepEqual(await js("return {...__wormQA.controls};"), {steer:1,throttle:1,brake:0,boostHeld:true});
  await neutral();
  await actions([{type:"pointer",id:"mouse",parameters:{pointerType:"mouse"},actions:[move(720,430),down,up]}]);
  assert.ok(await js("return __wormQA.game.tongues.length > 0;"));
  console.log("PASS: desktop WASD/Space and mouse targeting remain available");
  assert.deepEqual(await js("return __qaErrors;"), []);
  console.log(`PASS: no browser errors. Screenshots: ${artifacts}`);
} finally {
  if (session) await call(`/session/${session}`, undefined, "DELETE").catch(() => {});
  server.close();
}
