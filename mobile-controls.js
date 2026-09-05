/* Shared keyboard/touch input. Kept dependency-free for the browser prototype. */
(function (root) {
  "use strict";

  const STICK_RULES = Object.freeze({
    deadZone: 0.16,
    boostEnter: 0.88,
    boostExit: 0.78,
    boostHalfAngle: 50 * Math.PI / 180,
  });
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

  function sampleStick(rawX, rawY, wasBoosting = false) {
    const x = Number.isFinite(rawX) ? rawX : 0;
    const y = Number.isFinite(rawY) ? rawY : 0;
    const length = Math.hypot(x, y);
    const radius = Math.min(1, length);
    const strength = Math.max(0, (radius - STICK_RULES.deadZone) / (1 - STICK_RULES.deadZone));
    const steer = length ? x / length * strength : 0;
    const forward = length ? -y / length * strength : 0;
    const angle = Math.abs(Math.atan2(x, -y));
    return {
      steer,
      throttle: Math.max(0, forward),
      brake: Math.max(0, -forward),
      boostHeld: radius >= (wasBoosting ? STICK_RULES.boostExit : STICK_RULES.boostEnter) &&
        angle <= STICK_RULES.boostHalfAngle,
      x: length ? x / length * radius : 0,
      y: length ? y / length * radius : 0,
    };
  }

  function createInput() {
    const keyboard = { left: false, right: false, up: false, down: false, boost: false };
    const state = { steer: 0, throttle: 0, brake: 0, boostHeld: false };
    let stick = sampleStick(0, 0);
    let buttonBoost = false;

    function sync() {
      state.steer = clamp(Number(keyboard.right) - Number(keyboard.left) + stick.steer, -1, 1);
      state.throttle = Math.max(Number(keyboard.up), stick.throttle);
      state.brake = Math.max(Number(keyboard.down), stick.brake);
      state.boostHeld = keyboard.boost || stick.boostHeld || buttonBoost;
    }

    return {
      state,
      setKey(key, held) {
        if (!Object.prototype.hasOwnProperty.call(keyboard, key)) return;
        keyboard[key] = Boolean(held);
        sync();
      },
      setStick(x, y) {
        stick = sampleStick(x, y, stick.boostHeld);
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

    function releaseCapture(element, pointerId) {
      if (pointerId !== null && element.hasPointerCapture?.(pointerId)) {
        element.releasePointerCapture(pointerId);
      }
    }

    function paintStick(stick) {
      // Translate relative to the pad size without a layout read on every move.
      const radius = stickBounds ? Math.min(stickBounds.width, stickBounds.height) / 2 : 0;
      joystick.style.setProperty("--stick-x", `${stick.x * radius}px`);
      joystick.style.setProperty("--stick-y", `${stick.y * radius}px`);
      joystick.classList.toggle("boosting", stick.boostHeld);
      joystick.classList.toggle("braking", stick.brake > 0);
      const label = stick.boostHeld ? "Boost" : stick.brake > 0 ? "Brake" : stickPointer !== null ? "Move" : "Steer";
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
      get portrait() { return portrait; },
      ownsPointer(id) { return id === stickPointer || id === boostPointer; },
    };
  }

  const api = { STICK_RULES, sampleStick, createInput, mountTouchControls };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.WormControls = api;
})(globalThis);
