const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// Exercise the shipped scheduler without bootstrapping the game's DOM/canvas.
const source = fs.readFileSync(path.join(__dirname, "../game.js"), "utf8");
const rules = source.match(/  const ENEMY_BEHAVIOR_RULES = Object\.freeze\(\{[\s\S]*?\n  \}\);/)[0];
const start = source.indexOf("  function updateEnemyBehaviorClock(");
const end = source.indexOf("\n  }", start) + "\n  }".length;
const scheduler = vm.createContext({});
vm.runInContext(`${rules}\n${source.slice(start, end)}`, scheduler);
const update = scheduler.updateEnemyBehaviorClock;

for (const fps of [20, 30, 60, 120, 144, 165, 180, 240]) {
  test(`behavior never exceeds 30 Hz at ${fps} FPS`, () => {
    const target = { behaviorCooldown: 0.017 };
    let elapsed = 0;
    let accountedTime = 0;
    let previousCheck = -Infinity;
    let checks = 0;
    for (let frame = 0; frame < fps * 10; frame += 1) {
      const dt = 1 / fps;
      elapsed += dt;
      update(target, dt);
      if (!target.behaviorDue) {
        assert.equal(target.behaviorDt, 0);
        continue;
      }
      assert.ok(elapsed - previousCheck >= 1 / 30 - 1e-9);
      previousCheck = elapsed;
      accountedTime += target.behaviorDt;
      checks += 1;
    }
    assert.ok(checks <= Math.min(fps, 30) * 10);
    assert.ok(checks >= 10 / (1 / 30 + 1 / fps) - 1);
    assert.ok(Math.abs(accountedTime + target.behaviorElapsed - elapsed) < 1e-9,
      "throttling must not slow behavior timers");
  });
}

test("slow frames produce one decision and never a catch-up burst", () => {
  const target = {};
  update(target, 0.4);
  assert.equal(target.behaviorDue, true);
  assert.equal(target.behaviorDt, 0.4);
  for (let frame = 0; frame < 5; frame += 1) {
    update(target, 1 / 180);
    assert.equal(target.behaviorDue, false);
  }
  update(target, 1 / 180);
  assert.equal(target.behaviorDue, true);
  assert.ok(Math.abs(target.behaviorDt - 1 / 30) < 1e-9);
});

test("zero-time updates do not poll or consume the next decision", () => {
  const target = { behaviorCooldown: 0, behaviorElapsed: 0.01 };
  update(target, 0);
  assert.equal(target.behaviorDue, false);
  assert.equal(target.behaviorElapsed, 0.01);
  update(target, 1 / 120);
  assert.equal(target.behaviorDue, true);
});

test("each enemy keeps its own staggered schedule", () => {
  const first = { behaviorCooldown: 0.002 };
  const second = { behaviorCooldown: 0.022 };
  update(first, 1 / 120);
  update(second, 1 / 120);
  assert.equal(first.behaviorDue, true);
  assert.equal(second.behaviorDue, false);
  for (let frame = 0; frame < 2; frame += 1) {
    update(first, 1 / 120);
    update(second, 1 / 120);
  }
  assert.equal(first.behaviorDue, false);
  assert.equal(second.behaviorDue, true);
});

test("irregular frame pacing still enforces the minimum decision interval", () => {
  const target = {};
  let elapsed = 0;
  let previousCheck = -Infinity;
  for (let frame = 0; frame < 1000; frame += 1) {
    const dt = [1 / 180, 1 / 144, 1 / 60, 0.04, 0.001][frame % 5];
    elapsed += dt;
    update(target, dt);
    if (!target.behaviorDue) continue;
    assert.ok(elapsed - previousCheck >= 1 / 30 - 1e-9);
    previousCheck = elapsed;
  }
});
