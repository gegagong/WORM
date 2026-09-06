/* Shared keyboard/touch input. Kept dependency-free for the browser prototype. */
(function (root) {
  "use strict";

  const STICK_RULES = Object.freeze({
    deadZone: 0.16,
    reverseNoTurnHalfAngle: 15 * Math.PI / 180,
    movementEpsilon: 0.5,
  });
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const angleDifference = (target, current) => {
    const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
    // Equivalent headings across the ±π wrap must settle to a true zero.
    return Math.abs(difference) < 1e-10 ? 0 : difference;
  };

  function sampleStick(rawX, rawY, heading = 0, velocityX = 0, velocityY = 0) {
    const x = Number.isFinite(rawX) ? rawX : 0;
    const y = Number.isFinite(rawY) ? rawY : 0;
    const length = Math.hypot(x, y);
    const radius = Math.min(1, length);
    const strength = Math.max(0, (radius - STICK_RULES.deadZone) / (1 - STICK_RULES.deadZone));
    const active = strength > 0;
    const facing = Number.isFinite(heading) ? heading : 0;
    const moving = Number.isFinite(velocityX) && Number.isFinite(velocityY) &&
      Math.hypot(velocityX, velocityY) > STICK_RULES.movementEpsilon;
    // At rest, retain the facing reference so holding straight back stays a
    // brake instead of unexpectedly becoming a command to reverse.
    const movementAngle = moving ? Math.atan2(velocityY, velocityX) : facing;
    const aimAngle = active ? Math.atan2(y, x) : facing;
    const motionOffset = Math.abs(angleDifference(aimAngle, movementAngle));
    // Negative projection onto velocity means the stick is behind the
    // perpendicular dividing line. The boundary itself is not braking.
    const braking = active && motionOffset > Math.PI / 2 + 1e-10;
    const turnAllowed = active &&
      motionOffset < Math.PI - STICK_RULES.reverseNoTurnHalfAngle - 1e-10;
    return {
      active,
      strength,
      aimAngle,
      movementAngle,
      turnAllowed,
      steer: turnAllowed ? clamp(angleDifference(aimAngle, facing) / (Math.PI / 2), -1, 1) * strength : 0,
      throttle: active && !braking ? strength : 0,
      brake: braking ? strength : 0,
      x: length ? x / length * radius : 0,
      y: length ? y / length * radius : 0,
    };
  }

  function createInput() {
    const keyboard = { left: false, right: false, up: false, down: false, boost: false };
    const state = { steer: 0, throttle: 0, brake: 0, boostHeld: false };
    let stick = sampleStick(0, 0);
    let buttonBoost = false;
    let heading = 0;
    let velocityX = 0;
    let velocityY = 0;

    function sync() {
      stick = sampleStick(stick.x, stick.y, heading, velocityX, velocityY);
      state.steer = clamp(Number(keyboard.right) - Number(keyboard.left) + stick.steer, -1, 1);
      state.throttle = Math.max(Number(keyboard.up), stick.throttle);
      state.brake = Math.max(Number(keyboard.down), stick.brake);
      state.boostHeld = keyboard.boost || buttonBoost;
    }

    return {
      state,
      get stick() { return stick; },
      setMotion(nextHeading, nextVelocityX, nextVelocityY) {
        heading = nextHeading;
        velocityX = nextVelocityX;
        velocityY = nextVelocityY;
        sync();
      },
      turnDelta(currentAngle, maximumTurn) {
        const limit = Math.max(0, maximumTurn);
        const keyboardTurn = (Number(keyboard.right) - Number(keyboard.left)) * limit;
        const stickLimit = limit * stick.strength;
        const stickTurn = stick.turnAllowed
          ? clamp(angleDifference(stick.aimAngle, currentAngle), -stickLimit, stickLimit)
          : 0;
        return clamp(keyboardTurn + stickTurn, -limit, limit);
      },
      setKey(key, held) {
        if (!Object.prototype.hasOwnProperty.call(keyboard, key)) return;
        keyboard[key] = Boolean(held);
        sync();
      },
      setStick(x, y) {
        stick = sampleStick(x, y, heading, velocityX, velocityY);
        sync();
        return stick;
      },
      setBoost(held) {
        buttonBoost = Boolean(held);
        sync();
      },
      resetTouch() {
        stick = sampleStick(0, 0);
        buttonBoost = false;
        sync();
      },
      reset() {
        Object.keys(keyboard).forEach((key) => { keyboard[key] = false; });
        this.resetTouch();
      },
    };
  }

  function mountTouchControls({ shell, input, canPlay, onPortrait, onLayoutChange }) {
    const joystick = shell.querySelector("#touch-stick");
    const stickStatus = shell.querySelector("#touch-stick-status");
    const boostButton = shell.querySelector("#touch-boost");
    const rotateNotice = shell.querySelector("#rotate-notice");
    const coarsePointer = window.matchMedia("(any-pointer: coarse)");
    const forceTouch = new URLSearchParams(window.location.search).get("touch") === "1";
    let enabled = forceTouch || coarsePointer.matches || navigator.maxTouchPoints > 0;
    let portrait = false;
    let stickPointer = null;
    let boostPointer = null;
    let stickBounds = null;
    let lastStickX = "";
    let lastStickY = "";
    let lastMovementAngle = "";
    let brakingAvailable = true;

    function releaseCapture(element, pointerId) {
      if (pointerId !== null && element.hasPointerCapture?.(pointerId)) {
        element.releasePointerCapture(pointerId);
      }
    }

    function paintStick(stick) {
      // Translate relative to the pad size without a layout read on every move.
      const radius = stickBounds ? Math.min(stickBounds.width, stickBounds.height) / 2 : 0;
      const stickX = `${stick.x * radius}px`;
      const stickY = `${stick.y * radius}px`;
      const movementAngle = `${Math.round((stick.movementAngle + Math.PI / 2) * 180 / Math.PI)}deg`;
      if (stickX !== lastStickX) joystick.style.setProperty("--stick-x", lastStickX = stickX);
      if (stickY !== lastStickY) joystick.style.setProperty("--stick-y", lastStickY = stickY);
      if (movementAngle !== lastMovementAngle) joystick.style.setProperty("--movement-angle", lastMovementAngle = movementAngle);
      const braking = brakingAvailable && stick.brake > 0;
      joystick.classList.toggle("airborne", !brakingAvailable);
      joystick.classList.toggle("braking", braking);
      const label = braking ? stick.turnAllowed ? "Brake · Turn" : "Brake" : "Aim";
      if (stickStatus.textContent !== label) stickStatus.textContent = label;
    }

    function releaseStick() {
      const previous = stickPointer;
      stickPointer = null;
      joystick.classList.remove("active");
      paintStick(input.setStick(0, 0));
      stickBounds = null;
      releaseCapture(joystick, previous);
    }

    function releaseBoost() {
      const previous = boostPointer;
      boostPointer = null;
      input.setBoost(false);
      boostButton.classList.remove("active");
      boostButton.setAttribute("aria-pressed", "false");
      releaseCapture(boostButton, previous);
    }

    function reset() {
      releaseStick();
      releaseBoost();
    }

    function syncLayout() {
      const wasPortrait = portrait;
      portrait = enabled && window.innerHeight > window.innerWidth;
      shell.classList.toggle("touch-mode", enabled);
      shell.classList.toggle("touch-portrait", portrait);
      rotateNotice.hidden = !portrait;
      // Prevent keyboard/focus navigation into the covered game as well.
      for (const child of shell.children) {
        if (child !== rotateNotice) child.inert = portrait;
      }
      reset();
      if (portrait && !wasPortrait) onPortrait();
      onLayoutChange();
    }

    function updateStick(event) {
      const radius = Math.max(1, Math.min(stickBounds.width, stickBounds.height) / 2);
      paintStick(input.setStick(
        (event.clientX - stickBounds.left - stickBounds.width / 2) / radius,
        (event.clientY - stickBounds.top - stickBounds.height / 2) / radius,
      ));
    }

    const usable = (event) => enabled && !portrait && canPlay() &&
      (event.pointerType !== "mouse" || event.button === 0);

    joystick.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (!usable(event) || stickPointer !== null) return;
      stickPointer = event.pointerId;
      stickBounds = joystick.getBoundingClientRect();
      joystick.setPointerCapture(event.pointerId);
      joystick.classList.add("active");
      updateStick(event);
    });
    joystick.addEventListener("pointermove", (event) => {
      if (event.pointerId !== stickPointer) return;
      event.preventDefault();
      if (!canPlay()) { releaseStick(); return; }
      updateStick(event);
    });
    boostButton.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (!usable(event) || boostPointer !== null) return;
      boostPointer = event.pointerId;
      boostButton.setPointerCapture(event.pointerId);
      input.setBoost(true);
      boostButton.classList.add("active");
      boostButton.setAttribute("aria-pressed", "true");
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
      joystick.addEventListener(type, (event) => {
        if (event.pointerId !== stickPointer) return;
        event.preventDefault();
        releaseStick();
      });
      boostButton.addEventListener(type, (event) => {
        if (event.pointerId !== boostPointer) return;
        event.preventDefault();
        releaseBoost();
      });
    }
    boostButton.addEventListener("keydown", (event) => {
      if (event.code !== "Enter" || !canPlay()) return;
      event.preventDefault();
      input.setBoost(true);
      boostButton.classList.add("active");
      boostButton.setAttribute("aria-pressed", "true");
    });
    boostButton.addEventListener("keyup", (event) => {
      if (event.code !== "Enter" || boostPointer !== null) return;
      event.preventDefault();
      releaseBoost();
    });
    boostButton.addEventListener("blur", () => {
      if (boostPointer === null) releaseBoost();
    });

    window.addEventListener("resize", syncLayout);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) reset();
    });
    coarsePointer.addEventListener("change", () => {
      enabled = forceTouch || coarsePointer.matches || navigator.maxTouchPoints > 0;
      syncLayout();
    });
    document.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch" && !enabled) {
        enabled = true;
        syncLayout();
      }
    }, { capture: true, passive: true });
    syncLayout();

    return {
      reset,
      refresh(canBrake = true) {
        brakingAvailable = canBrake;
        if (enabled && !portrait) paintStick(input.stick);
      },
      get portrait() { return portrait; },
      ownsPointer(id) { return id === stickPointer || id === boostPointer; },
    };
  }

  const api = { STICK_RULES, sampleStick, createInput, mountTouchControls };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.WormControls = api;
})(globalThis);
