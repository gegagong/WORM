const test = require("node:test");
const assert = require("node:assert/strict");
const { createInput, sampleStick } = require("../mobile-controls.js");
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≠ ${expected}`);

test("center dead zone is neutral and strength is analog outside it", () => {
  for (const [x, y] of [[0, 0], [0.1, -0.1], [0, -0.16]]) {
    const value = sampleStick(x, y);
    near(value.steer, 0);
    near(value.throttle, 0);
    near(value.brake, 0);
    assert.equal(value.boostHeld, false);
  }
  near(sampleStick(0.58, 0).throttle, 0.5);
  near(sampleStick(-0.58, 0).brake, 0.5);
  near(sampleStick(0, -0.58).steer, -0.5);
  near(sampleStick(0.37, 0).throttle, 0.25);
});

test("diagonal movement is bounded and never presses throttle and brake together", () => {
  const value = sampleStick(2, -2);
  near(value.steer, -0.5);
  near(value.throttle, 1);
  assert.equal(value.brake, 0);
  near(Math.hypot(value.x, value.y), 1);
  const neutral = sampleStick(NaN, Infinity);
  near(neutral.steer, 0);
  near(neutral.throttle, 0);
});

test("Boost ring has radial hysteresis and only works in the forward arc", () => {
  const input = createInput();
  input.setStick(0.87, 0);
  assert.equal(input.state.boostHeld, false);
  input.setStick(0.88, 0);
  assert.equal(input.state.boostHeld, true);
  input.setStick(0.79, 0);
  assert.equal(input.state.boostHeld, true);
  input.setStick(0.77, 0);
  assert.equal(input.state.boostHeld, false);
  assert.equal(sampleStick(0.7, -0.7).boostHeld, true);
  assert.equal(sampleStick(0.1, -1, true).boostHeld, false);
  assert.equal(sampleStick(0, 1, true).boostHeld, false);
  input.setMotion(Math.PI / 2, 0, 100);
  input.setStick(0, 1);
  assert.equal(input.state.boostHeld, true, "the Boost arc rotates with movement");
});

test("releasing one Boost source leaves the other held sources active", () => {
  const input = createInput();
  input.setStick(1, 0);
  input.setBoost(true);
  input.setStick(0, 0);
  assert.equal(input.state.boostHeld, true);
  input.setKey("boost", true);
  input.setBoost(false);
  assert.equal(input.state.boostHeld, true);
  input.setKey("boost", false);
  assert.equal(input.state.boostHeld, false);
});

test("touch cancellation preserves keyboard holds; complete reset clears everything", () => {
  const input = createInput();
  input.setKey("up", true);
  input.setKey("left", true);
  input.setStick(0.5, -1);
  input.resetTouch();
  assert.deepEqual(input.state, { steer: -1, throttle: 1, brake: 0, boostHeld: false });
  input.setKey("right", true);
  near(input.state.steer, 0);
  input.setKey("down", true);
  near(input.state.brake, 1);
  input.setBoost(true);
  input.reset();
  assert.deepEqual(input.state, { steer: 0, throttle: 0, brake: 0, boostHeld: false });
});

const radians = (degrees) => degrees * Math.PI / 180;
const aimAt = (degrees, heading = 0, vx = 100, vy = 0) => {
  const angle = radians(degrees);
  return sampleStick(Math.cos(angle) * 0.75, Math.sin(angle) * 0.75, false, heading, vx, vy);
};

test("the entire rear half-plane brakes; the perpendicular boundary does not", () => {
  for (const degrees of [0, 45, -45, 89.99, -89.99, 90, -90]) {
    assert.equal(aimAt(degrees).brake, 0, `${degrees}° should not brake`);
    assert.ok(aimAt(degrees).throttle > 0);
  }
  for (const degrees of [90.01, -90.01, 120, -120, 180]) {
    assert.ok(aimAt(degrees).brake > 0, `${degrees}° must brake`);
    assert.equal(aimAt(degrees).throttle, 0);
  }
});

test("rearward aim keeps turning except in the full 30° brake-only cone", () => {
  for (const degrees of [120, 164.99]) {
    assert.ok(aimAt(degrees).steer > 0);
    assert.ok(aimAt(-degrees).steer < 0);
  }
  for (const degrees of [165, -165, 175, -175, 180]) {
    const stick = aimAt(degrees);
    assert.ok(stick.brake > 0);
    assert.equal(stick.turnAllowed, false, `${degrees}° should only brake`);
    assert.equal(stick.steer, 0);
  }
});

test("braking and its no-turn cone follow velocity rather than facing", () => {
  const backward = sampleStick(-0.8, 0, false, Math.PI, 100, 0);
  assert.ok(backward.brake > 0, "facing left does not override rightward momentum");
  assert.equal(backward.turnAllowed, false);
  const forward = sampleStick(0.8, 0, false, Math.PI, 100, 0);
  assert.equal(forward.brake, 0);
  assert.ok(forward.throttle > 0);
  for (const headingDegrees of [0, 45, 90, 175, 210, 270]) {
    const heading = radians(headingDegrees);
    const vx = Math.cos(heading) * 100;
    const vy = Math.sin(heading) * 100;
    const angleBrake = aimAt(headingDegrees + 130, heading, vx, vy);
    assert.ok(angleBrake.brake > 0 && angleBrake.turnAllowed);
    assert.equal(aimAt(headingDegrees + 180, heading, vx, vy).turnAllowed, false);
  }
});

test("a held stick is re-resolved when momentum changes without a pointermove", () => {
  const input = createInput();
  input.setMotion(0, 100, 0);
  input.setStick(0.75, 0);
  assert.ok(input.state.throttle > 0);
  input.setMotion(Math.PI, -100, 0);
  assert.ok(input.state.brake > 0);
  assert.equal(input.state.steer, 0);
  assert.equal(input.state.throttle, 0);
  input.setMotion(Math.PI / 2, 0, 100);
  assert.equal(input.state.brake, 0);
  assert.ok(input.state.steer < 0);
});

test("aimed turning takes the shortest path and cannot overshoot or oscillate", () => {
  const input = createInput();
  let heading = radians(175);
  const target = radians(-175);
  input.setMotion(heading, Math.cos(heading) * 100, Math.sin(heading) * 100);
  input.setStick(Math.cos(target) * 0.75, Math.sin(target) * 0.75);
  assert.ok(input.turnDelta(heading, 0.1) > 0, "cross the angle wrap along the short path");
  for (let i = 0; i < 12; i++) {
    const step = input.turnDelta(heading, 0.1);
    assert.ok(step >= 0 && step <= 0.1);
    heading += step;
    input.setMotion(heading, Math.cos(heading) * 100, Math.sin(heading) * 100);
  }
  near(Math.sin(heading - target), 0);
  near(input.turnDelta(heading, 0.1), 0);
  input.reset();
  input.setKey("right", true);
  near(input.turnDelta(heading, 0.1), 0.1);
});

test("at rest angled braking can still turn, but straight back remains a stop", () => {
  const input = createInput();
  input.setMotion(0, 0, 0);
  input.setStick(-0.75, 0);
  assert.ok(input.state.brake > 0);
  near(input.turnDelta(0, 0.1), 0);
  input.setStick(-0.5, -0.5);
  assert.ok(input.state.brake > 0);
  assert.ok(input.turnDelta(0, 0.1) < 0);
});
