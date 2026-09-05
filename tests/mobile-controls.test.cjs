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
  near(sampleStick(0, -0.58).throttle, 0.5);
  near(sampleStick(0, 0.58).brake, 0.5);
  near(sampleStick(-0.58, 0).steer, -0.5);
  near(sampleStick(0, -0.37).throttle, 0.25);
});

test("diagonal movement is bounded and never presses throttle and brake together", () => {
  const value = sampleStick(2, -2);
  near(value.steer, Math.SQRT1_2);
  near(value.throttle, Math.SQRT1_2);
  assert.equal(value.brake, 0);
  near(Math.hypot(value.x, value.y), 1);
  const neutral = sampleStick(NaN, Infinity);
  near(neutral.steer, 0);
  near(neutral.throttle, 0);
});

test("Boost ring has radial hysteresis and only works in the forward arc", () => {
  const input = createInput();
  input.setStick(0, -0.87);
  assert.equal(input.state.boostHeld, false);
  input.setStick(0, -0.88);
  assert.equal(input.state.boostHeld, true);
  input.setStick(0, -0.79);
  assert.equal(input.state.boostHeld, true);
  input.setStick(0, -0.77);
  assert.equal(input.state.boostHeld, false);
  assert.equal(sampleStick(0.7, -0.7).boostHeld, true);
  assert.equal(sampleStick(1, -0.1, true).boostHeld, false);
  assert.equal(sampleStick(0, 1, true).boostHeld, false);
});

test("releasing one Boost source leaves the other held sources active", () => {
  const input = createInput();
  input.setStick(0, -1);
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
