(() => {
  "use strict";

  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const gameShell = document.querySelector(".game-shell");

  function ensureMinimapCanvas() {
    const existingCanvas = document.querySelector("#minimap-canvas");
    if (existingCanvas) return existingCanvas;

    const minimap = document.createElement("section");
    minimap.className = "minimap";
    minimap.id = "minimap";
    minimap.setAttribute("aria-label", "Local area map");
    minimap.innerHTML = `
      <canvas id="minimap-canvas" width="184" height="132"></canvas>
      <span class="minimap-label">Local map</span>
    `;
    const legacyBrand = document.querySelector(".brand");
    const masthead = document.querySelector(".masthead");
    if (legacyBrand) legacyBrand.replaceWith(minimap);
    else masthead?.prepend(minimap);
    return minimap.querySelector("#minimap-canvas");
  }

  const minimapCanvas = ensureMinimapCanvas();
  const minimapContext = minimapCanvas.getContext("2d", { alpha: false });
  const speedReadout = document.querySelector("#speed");
  const targetReadout = document.querySelector("#target-count");
  const targetMetric = document.querySelector("#target-metric");
  const scoreReadout = document.querySelector("#score");
  const sizeLevelReadout = document.querySelector("#size-level");
  const growthProgressReadout = document.querySelector("#growth-progress");
  const growthCostReadout = document.querySelector("#growth-cost");
  const boostMetric = document.querySelector("#boost-metric");
  const boostMeter = document.querySelector("#boost-meter");
  const boostMeterFill = document.querySelector("#boost-meter-fill");
  const boostTimeReadout = document.querySelector("#boost-time");
  const boostCapacityReadout = document.querySelector("#boost-capacity");
  const stateReadout = document.querySelector("#state");
  const statePill = document.querySelector("#state-pill");
  const homeScreen = document.querySelector("#home-screen");
  const homePlayButton = document.querySelector("#home-play-button");
  const homeWorldButton = document.querySelector("#home-world-select");
  const homeWormButton = document.querySelector("#home-worm-select");
  const homeWormEditButton = document.querySelector("#home-worm-edit");
  const resetButton = document.querySelector("#reset-button");
  const currentWorldName = document.querySelector("#current-world-name");
  const currentWormName = document.querySelector("#current-worm-name");
  const wormTypeSelect = document.querySelector("#worm-type-select");
  const wormTypeCloseButton = document.querySelector("#worm-type-close");
  const wormTypeList = document.querySelector("#worm-type-list");
  const worldSelect = document.querySelector("#world-select");
  const worldSelectClose = document.querySelector("#world-select-close");
  const worldList = document.querySelector("#world-list");
  const newWorldButton = document.querySelector("#new-world-button");
  const worldEditor = document.querySelector("#world-editor");
  const worldNameInput = document.querySelector("#world-name-input");
  const editorCancelButton = document.querySelector("#editor-cancel");
  const editorSaveButton = document.querySelector("#editor-save");
  const editorFitButton = document.querySelector("#editor-fit");
  const brushShapeInput = document.querySelector("#brush-shape");
  const brushSizeInput = document.querySelector("#brush-size");
  const editorCanvasWrap = document.querySelector("#editor-canvas-wrap");
  const editorCanvas = document.querySelector("#editor-canvas");
  const editorContext = editorCanvas.getContext("2d");
  const editorStatus = document.querySelector("#editor-status");
  const wormEditorElement = document.querySelector("#worm-editor");
  const wormEditorTypeName = document.querySelector("#worm-editor-type-name");
  const wormEditorCancelButton = document.querySelector("#worm-editor-cancel");
  const wormEditorSaveButton = document.querySelector("#worm-editor-save");
  const wormLoadDefaultsButton = document.querySelector("#worm-load-defaults");
  const wormPackageImportButton = document.querySelector(
    "#worm-package-import-button",
  );
  const wormPackageImportInput = document.querySelector(
    "#worm-package-import",
  );
  const wormPackageExportButton = document.querySelector(
    "#worm-package-export",
  );
  const wormBrushColorInput = document.querySelector("#worm-brush-color");
  const wormBrushSizeInput = document.querySelector("#worm-brush-size");
  const wormSymmetryModeInput = document.querySelector("#worm-symmetry-mode");
  const wormReflectionToggle = document.querySelector(
    "#worm-reflection-toggle",
  );
  const wormMirrorPairToggle = document.querySelector("#worm-mirror-pair-toggle");
  const wormMouthJawOverlayToggle = document.querySelector(
    "#worm-mouth-jaw-overlay-toggle",
  );
  const wormImportLayerInput = document.querySelector("#worm-import-layer");
  const wormClearLayerButton = document.querySelector("#worm-clear-layer");
  const wormLayerCanvas = document.querySelector("#worm-layer-canvas");
  const wormLayerContext = wormLayerCanvas.getContext("2d");
  const wormPreviewCanvas = document.querySelector("#worm-preview-canvas");
  const wormPreviewContext = wormPreviewCanvas.getContext("2d");
  const wormPaintStatus = document.querySelector("#worm-paint-status");
  const mainMenuButton = document.querySelector("#main-menu-button");
  const gameMenu = document.querySelector("#game-menu");
  const mainMenuCloseButton = document.querySelector("#main-menu-close");
  const menuContinueButton = document.querySelector("#menu-continue");
  const menuDevToolsButton = document.querySelector("#menu-dev-tools");
  const menuReturnHomeButton = document.querySelector("#menu-return-home");
  const enemyInfoButton = document.querySelector("#enemy-info-button");
  const enemyInfo = document.querySelector("#enemy-info");
  const enemyInfoCloseButton = document.querySelector("#enemy-info-close");
  const enemyInfoList = document.querySelector("#enemy-info-list");

  // Keep the dev controls usable if a server or browser combines a newer
  // script with an older cached copy of the page markup or stylesheet.
  function ensureRuntimeStyles() {
    const styleUrl = "./styles.css?v=20260811-tongue-click-hit-test";
    const existingStylesheet = document.querySelector(
      "link[data-worm-runtime-styles]",
    );
    if (existingStylesheet) {
      if (!existingStylesheet.href.endsWith(styleUrl.slice(1))) {
        existingStylesheet.href = styleUrl;
      }
      return;
    }

    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = styleUrl;
    stylesheet.dataset.wormRuntimeStyles = "";
    document.head.appendChild(stylesheet);
  }

  function ensureDevMenu() {
    let menu = document.querySelector("#dev-menu");
    if (
      menu?.querySelector("#reveal-vectors") &&
      menu.querySelector("#reveal-steering") &&
      menu.querySelector("#reveal-hitboxes") &&
      menu.querySelector("#reveal-combat-stats") &&
      menu.querySelector("#swarm-mode") &&
      menu.querySelector("#dev-fps") &&
      menu.querySelector("#fps-limit") &&
      menu.querySelector(".dev-menu-close")
    ) {
      return menu;
    }
    if (menu) menu.remove();

    menu = document.createElement("aside");
    menu.className = "dev-menu";
    menu.id = "dev-menu";
    menu.innerHTML = `
      <div class="dev-menu-panel">
        <div class="dev-menu-heading">
          <span>Developer controls</span>
          <button class="dev-menu-close" id="dev-menu-toggle" type="button" aria-label="Close developer tools">×</button>
        </div>
        <div class="dev-performance">
          <span>Frame rate</span>
          <strong><span id="dev-fps">000</span> FPS</strong>
        </div>
        <label class="dev-setting" for="fps-limit">
          <span class="dev-option-copy">
            <strong>FPS limit</strong>
            <small>Maximum rendered frames</small>
          </span>
          <select id="fps-limit">
            <option value="0">Uncapped</option>
            <option value="30">30 FPS</option>
            <option value="60">60 FPS</option>
            <option value="120">120 FPS</option>
          </select>
        </label>
        <label class="dev-option" for="reveal-grid">
          <input id="reveal-grid" type="checkbox" />
          <span class="dev-checkbox" aria-hidden="true"></span>
          <span class="dev-option-copy">
            <strong>Reveal grid</strong>
            <small>Show block boundaries</small>
          </span>
        </label>
        <label class="dev-option" for="reveal-vectors">
          <input id="reveal-vectors" type="checkbox" />
          <span class="dev-checkbox" aria-hidden="true"></span>
          <span class="dev-option-copy">
            <strong>Direction vectors</strong>
            <small>Velocity + acceleration</small>
          </span>
        </label>
        <label class="dev-option" for="reveal-steering">
          <input id="reveal-steering" type="checkbox" />
          <span class="dev-checkbox" aria-hidden="true"></span>
          <span class="dev-option-copy">
            <strong>Steering math</strong>
            <small>Facing + turn input</small>
          </span>
        </label>
          <label class="dev-option" for="reveal-hitboxes">
          <input id="reveal-hitboxes" type="checkbox" />
          <span class="dev-checkbox" aria-hidden="true"></span>
            <span class="dev-option-copy">
              <strong>Hitboxes / hurtboxes</strong>
              <small>Eating, acid, targets + tongue avoidance</small>
            </span>
          </label>
        <label class="dev-option" for="reveal-combat-stats">
          <input id="reveal-combat-stats" type="checkbox" />
          <span class="dev-checkbox" aria-hidden="true"></span>
          <span class="dev-option-copy">
            <strong>Combat stats</strong>
            <small>Enemy HP, prey class + bite force</small>
          </span>
        </label>
        <label class="dev-option" for="swarm-mode">
          <input id="swarm-mode" type="checkbox" />
          <span class="dev-checkbox" aria-hidden="true"></span>
          <span class="dev-option-copy">
            <strong>Swarm</strong>
            <small>Eaten enemies spawn two of the same kind</small>
          </span>
        </label>
      </div>
    `;
    (document.querySelector(".game-shell") || document.body).appendChild(menu);
    return menu;
  }

  function ensureDevGameplayPanel(menu) {
    let panel = menu.querySelector("#dev-gameplay-panel");
    if (
      panel?.querySelector("#dev-worm-level") &&
      panel.querySelector("#dev-worm-level-mode") &&
      panel.querySelector("#dev-enemy-buttons")
    ) {
      return panel;
    }
    if (panel) panel.remove();

    panel = document.createElement("div");
    panel.className = "dev-gameplay-panel";
    panel.id = "dev-gameplay-panel";
    panel.innerHTML = `
      <div class="dev-menu-heading">
        <span>Gameplay controls</span>
      </div>
      <label class="dev-setting" for="dev-worm-level">
        <span class="dev-option-copy">
          <strong>Worm level</strong>
          <small id="dev-worm-level-mode">Following score</small>
        </span>
        <input id="dev-worm-level" type="number" min="0" max="100" step="1" placeholder="Auto" inputmode="numeric" />
      </label>
      <section class="dev-enemy-spawner" aria-labelledby="dev-enemy-heading">
        <span class="dev-option-copy" id="dev-enemy-heading">
          <strong>Place enemy</strong>
          <small>Add an enemy inside the current view</small>
        </span>
        <div class="dev-enemy-buttons" id="dev-enemy-buttons"></div>
      </section>
    `;
    menu.appendChild(panel);
    return panel;
  }

  function ensureDevProfilerPanel(menu) {
    let panel = menu.querySelector("#dev-profiler-panel");
    if (
      panel?.querySelector("#dev-profiler-gate") &&
      panel.querySelector("#dev-profiler-frame") &&
      panel.querySelector("#dev-profiler-chunks") &&
      panel.querySelector("#dev-profiler-cache")
    ) {
      return panel;
    }
    if (panel) panel.remove();

    panel = document.createElement("section");
    panel.className = "dev-profiler-panel";
    panel.id = "dev-profiler-panel";
    panel.setAttribute("aria-labelledby", "dev-profiler-heading");
    panel.innerHTML = `
      <div class="dev-menu-heading">
        <span id="dev-profiler-heading">Performance gate</span>
        <small>Heuristic</small>
      </div>
      <div class="dev-profiler-gate" id="dev-profiler-gate" data-gate="idle">
        <span>Likely limit</span>
        <strong id="dev-profiler-label">Collecting</strong>
        <small id="dev-profiler-detail">Move through the world to sample frame pressure.</small>
      </div>
      <div class="dev-profiler-budget" aria-hidden="true">
        <span class="update" id="dev-profiler-update-bar"></span>
        <span class="render" id="dev-profiler-render-bar"></span>
      </div>
      <div class="dev-profiler-legend" aria-hidden="true">
        <span><i class="update"></i>Update</span>
        <span><i class="render"></i>Canvas</span>
        <span><i class="available"></i>Available</span>
      </div>
      <dl class="dev-profiler-stats">
        <div><dt>Frame</dt><dd><span id="dev-profiler-frame">0.0</span> ms</dd></div>
        <div><dt>Budget</dt><dd><span id="dev-profiler-budget">16.7</span> ms</dd></div>
        <div><dt>Update</dt><dd><span id="dev-profiler-update">0.0</span> ms</dd></div>
        <div><dt>Canvas</dt><dd><span id="dev-profiler-render">0.0</span> ms</dd></div>
        <div><dt>Peak</dt><dd><span id="dev-profiler-peak">0.0</span> ms</dd></div>
        <div><dt>Frames lost</dt><dd id="dev-profiler-dropped">0</dd></div>
        <div class="wide"><dt>Terrain builds</dt><dd><span id="dev-profiler-chunks">0</span> · <span id="dev-profiler-chunk-time">0.0</span> ms</dd></div>
        <div class="wide"><dt>Terrain cache</dt><dd><span id="dev-profiler-cache">0 / 0</span> · <span id="dev-profiler-memory">0.0</span> MB</dd></div>
        <div class="wide"><dt>Evictions</dt><dd id="dev-profiler-evictions">0</dd></div>
      </dl>
      <p class="dev-profiler-note">GPU is suspected only when frame presentation is late while measured main-thread work remains below budget.</p>
    `;
    menu.appendChild(panel);
    return panel;
  }

  ensureRuntimeStyles();
  const devMenu = ensureDevMenu();
  const devGameplayPanel = ensureDevGameplayPanel(devMenu);
  const devProfilerPanel = ensureDevProfilerPanel(devMenu);
  const devMenuToggle = devMenu.querySelector("#dev-menu-toggle");
  const devFpsReadout = devMenu.querySelector("#dev-fps");
  const fpsLimitInput = devMenu.querySelector("#fps-limit");
  const revealGridInput = devMenu.querySelector("#reveal-grid");
  const revealVectorsInput = devMenu.querySelector("#reveal-vectors");
  const revealSteeringInput = devMenu.querySelector("#reveal-steering");
  const revealHitboxesInput = devMenu.querySelector("#reveal-hitboxes");
  const revealCombatStatsInput = devMenu.querySelector(
    "#reveal-combat-stats",
  );
  const swarmModeInput = devMenu.querySelector("#swarm-mode");
  const devWormLevelInput = devGameplayPanel.querySelector("#dev-worm-level");
  const devWormLevelMode = devGameplayPanel.querySelector(
    "#dev-worm-level-mode",
  );
  const devEnemyButtons = devGameplayPanel.querySelector(
    "#dev-enemy-buttons",
  );
  const devProfilerGate = devProfilerPanel.querySelector(
    "#dev-profiler-gate",
  );
  const devProfilerLabel = devProfilerPanel.querySelector(
    "#dev-profiler-label",
  );
  const devProfilerDetail = devProfilerPanel.querySelector(
    "#dev-profiler-detail",
  );
  const devProfilerFrame = devProfilerPanel.querySelector(
    "#dev-profiler-frame",
  );
  const devProfilerBudget = devProfilerPanel.querySelector(
    "#dev-profiler-budget",
  );
  const devProfilerUpdate = devProfilerPanel.querySelector(
    "#dev-profiler-update",
  );
  const devProfilerRender = devProfilerPanel.querySelector(
    "#dev-profiler-render",
  );
  const devProfilerPeak = devProfilerPanel.querySelector(
    "#dev-profiler-peak",
  );
  const devProfilerDropped = devProfilerPanel.querySelector(
    "#dev-profiler-dropped",
  );
  const devProfilerChunks = devProfilerPanel.querySelector(
    "#dev-profiler-chunks",
  );
  const devProfilerChunkTime = devProfilerPanel.querySelector(
    "#dev-profiler-chunk-time",
  );
  const devProfilerCache = devProfilerPanel.querySelector(
    "#dev-profiler-cache",
  );
  const devProfilerMemory = devProfilerPanel.querySelector(
    "#dev-profiler-memory",
  );
  const devProfilerEvictions = devProfilerPanel.querySelector(
    "#dev-profiler-evictions",
  );
  const devProfilerUpdateBar = devProfilerPanel.querySelector(
    "#dev-profiler-update-bar",
  );
  const devProfilerRenderBar = devProfilerPanel.querySelector(
    "#dev-profiler-render-bar",
  );

  const TAU = Math.PI * 2;
  const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    boost: false,
  };
  const tonguePointer = {
    pointerId: null,
  };
  const spitterPointer = {
    pointerId: null,
    clientX: 0,
    clientY: 0,
    screenX: 0,
    screenY: 0,
  };
  const palette = {
    ink: "#73210c",
    cream: "#fff7ef",
    sky: "#742019",
    skyDark: "#270a11",
    skyLight: "#a84927",
    skyHorizon: "#8f2c1d",
    cloud: "#321017",
    cloudDark: "#17070b",
    cloudLight: "#5c221c",
    sun: "#b65d32",
    sunGlow: "#dc8a4f",
    acid: "#ff4d00",
    debugFacing: "#55d6e5",
    debugTurn: "#f06491",
    worm: "#ec6f51",
    wormDark: "#750000",
    tongue: "#cf020c",
    tongueHighlight: "#ff8b83",
    acidFluid: "#a9cf35",
    acidHighlight: "#e5ff7a",
    beetle: "#750000",
    beetleShell: "#ec6f51",
    beetleHighlight: "#fff7ef",
    mole: "#4a2018",
    moleHighlight: "#df722a",
    rabbit: "#57271f",
    rabbitHighlight: "#ec6f51",
    vulture: "#4a2018",
    vultureHighlight: "#fff7ef",
    splatter: "#760018",
    splatterBright: "#dc143c",
    soil: "#74412d",
    soilDark: "#4a2a22",
    soilLight: "#df722a",
    stone: "#6f5357",
    stoneDark: "#43262e",
    stoneLight: "#b87972",
    tunneledSoil: "#35231d",
  };

  const DEFAULT_AIR_GRAVITY = 775;
  const motion = {
    acceleration: 520,
    maximumSpeed: 780,
    boostMultiplier: 1.5,
    coastDeceleration: 260,
    brakeDeceleration: 900,
    groundTurnSpeed: 4.4,
    airTurnForce: 420,
    airGravity: DEFAULT_AIR_GRAVITY,
  };
  function worldGravityAcceleration() {
    const configuredGravity = Number(motion.airGravity);
    return Number.isFinite(configuredGravity)
      ? Math.max(0, configuredGravity)
      : DEFAULT_AIR_GRAVITY;
  }
  const SPEED_DISPLAY_SCALE = 0.72;
  const BOOST_RULES = Object.freeze({
    levelOneDuration: 3,
    secondsPerLevel: 1,
    rechargeRate: 1,
  });
  const STONE_RULES = Object.freeze({
    bounceRetention: 0.34,
    tangentialRetention: 0.58,
    collisionInset: 0.08,
    surfaceTargetSpeed: 195,
    surfaceAcceleration: 950,
    surfaceCoastDeceleration: 340,
    surfaceBrakeDeceleration: 680,
    surfaceWheelRadiusMultiplier: 1.25,
    surfaceCaptureRadiusMultiplier: 1.85,
    surfaceReleaseRadiusMultiplier: 2.55,
    surfaceRestitution: 0.035,
    surfaceNormalDamping: 0.82,
    surfaceHeadSpring: 72,
    surfaceHeadDamping: 15,
    surfaceHeadTurnSpeed: 3.2,
    surfaceHeadMaximumAcceleration: 2100,
    surfaceHeadMaximumLagMultiplier: 0.25,
    surfaceApproachSideTolerance: 0.5,
    surfaceSmoothingPasses: 2,
    surfaceMinimumUpwardNormal: 0.08,
    surfaceNeutralBridgeBlocks: 3,
    surfaceMinimumStandaloneBlocks: 1,
  });
  // Global gameplay-entity scale. World units, tiles, terrain, stone contours,
  // camera framing, and decorative environment details remain unchanged.
  const ENTITY_SCALE = 0.625;
  const WORM_SHAPE = Object.freeze({
    segmentCount: 16,
    segmentSpacing: 14,
    tailRadius: 1.7,
    bodyRadius: 11.5,
    bodyOutline: 3.4,
    headOffset: 30,
    headLength: 25,
    headRadius: 18,
    headOutline: 3.4,
    eyeForward: 11.5,
    eyeSpread: 8,
    eyeRadius: 5.5,
    pupilForward: 14,
    pupilRadius: 2.5,
    wakeOffset: 30,
    collisionRadius: 18,
  });
  const GROWTH_RULES = Object.freeze({
    initialCost: 5,
    costMultiplier: 1.3,
    scalePerLevel: 0.12,
    segmentsPerLevel: 1,
    maximumSpeedPerLevel: 30,
  });
  const SPITTER_GROWTH_RULES = Object.freeze({
    // Spitter gains the same approximate overall body length with fewer,
    // substantially larger sections, giving it a heavier silhouette.
    scalePerLevel: 0.18,
    segmentsPerLevel: 0.5,
  });
  const CAMERA_RULES = Object.freeze({
    levelsPerZoomStep: 5,
    zoomPerStep: 0.9,
    minimumZoom: 0.4,
  });
  const COMBAT_RULES = Object.freeze({
    baseBiteDamage: 2,
    biteDamagePerLevel: 1.25,
    hardPreyHealthMultiplier: 2,
    bounceSpeedRetention: 0.62,
    minimumBounceSpeed: 120,
    bounceCooldown: 0.28,
  });
  const WORM_TYPE_STORAGE_KEY = "worm.selected-type.v1";
  const WORM_TYPE_IDS = Object.freeze({
    LICKER: "licker",
    SPITTER: "spitter",
  });
  const WORM_ABILITIES = Object.freeze({
    TONGUE: "tongue",
    ACID: "acid",
  });
  const WORM_TYPES = Object.freeze({
    [WORM_TYPE_IDS.LICKER]: Object.freeze({
      id: WORM_TYPE_IDS.LICKER,
      label: "Licker",
      ability: WORM_ABILITIES.TONGUE,
      abilityLabel: "Tongue",
      description:
        "Launches articulated tongues to capture edible prey and grapple onto hard prey.",
      scaling: Object.freeze({
        baseEntityScale: ENTITY_SCALE,
        scalePerLevel: GROWTH_RULES.scalePerLevel,
        baseSegmentCount: WORM_SHAPE.segmentCount,
        segmentsPerLevel: GROWTH_RULES.segmentsPerLevel,
        baseMaximumSpeed: motion.maximumSpeed,
        maximumSpeedPerLevel: GROWTH_RULES.maximumSpeedPerLevel,
        stoneLocomotionScalePerLevel: GROWTH_RULES.scalePerLevel,
        initialGrowthCost: GROWTH_RULES.initialCost,
        growthCostMultiplier: GROWTH_RULES.costMultiplier,
        baseBiteDamage: COMBAT_RULES.baseBiteDamage,
        biteDamagePerLevel: COMBAT_RULES.biteDamagePerLevel,
        levelOneBoostDuration: BOOST_RULES.levelOneDuration,
        boostSecondsPerLevel: BOOST_RULES.secondsPerLevel,
      }),
    }),
    [WORM_TYPE_IDS.SPITTER]: Object.freeze({
      id: WORM_TYPE_IDS.SPITTER,
      label: "Spitter",
      ability: WORM_ABILITIES.ACID,
      abilityLabel: "Acid hose",
      description:
        "Cranes toward the pointer and pours a persistent stream of damaging acid.",
      scaling: Object.freeze({
        baseEntityScale: ENTITY_SCALE,
        scalePerLevel: SPITTER_GROWTH_RULES.scalePerLevel,
        baseSegmentCount: WORM_SHAPE.segmentCount,
        segmentsPerLevel: SPITTER_GROWTH_RULES.segmentsPerLevel,
        baseMaximumSpeed: motion.maximumSpeed,
        maximumSpeedPerLevel: GROWTH_RULES.maximumSpeedPerLevel,
        stoneLocomotionScalePerLevel: GROWTH_RULES.scalePerLevel,
        initialGrowthCost: GROWTH_RULES.initialCost,
        growthCostMultiplier: GROWTH_RULES.costMultiplier,
        baseBiteDamage: COMBAT_RULES.baseBiteDamage,
        biteDamagePerLevel: COMBAT_RULES.biteDamagePerLevel,
        levelOneBoostDuration: BOOST_RULES.levelOneDuration,
        boostSecondsPerLevel: BOOST_RULES.secondsPerLevel,
      }),
    }),
  });
  const PREY_CLASSES = Object.freeze({
    EASY: "easy",
    NORMAL: "normal",
    HARD: "hard",
  });
  const BOOST_LATCH_RULES = Object.freeze({
    bitesPerAttack: 4,
    approachSpeedMultiplier: 1.25,
    approachAccelerationMultiplier: 7,
    approachTurnSpeedMultiplier: 3.25,
    approachArrivalDistance: 1.5,
    approachSubstep: 1 / 120,
    scurryAnimationMultiplier: 5,
    bodyMotionRetention: 0.075,
    bodyConstraintIterations: 5,
    survivingTargetBounceDistanceBlocks: 20,
    survivingTargetBounceVelocityMultiplier: 1.5,
    bounceCoastPredictionStep: 0.04,
    meatScatterVelocityMultiplier: 5,
    meatMinimumPieces: 3,
    meatMaximumPieces: 6,
  });
  const ENEMY_HEALTH_BAR = Object.freeze({
    duration: 2.4,
    fadeDuration: 0.4,
    minimumScreenWidth: 46,
    maximumScreenWidth: 160,
    widthScale: 0.82,
    screenHeight: 8,
    screenBorder: 2,
    screenGap: 9,
  });
  const ENEMY_TYPES = Object.freeze({
    BEETLE: "beetle",
    DRAGONFLY: "dragonfly",
    VULTURE: "vulture",
    MOLE: "mole",
    RABBIT: "rabbit",
    MEAT: "meat",
  });
  const ENEMY_DEFINITIONS = Object.freeze({
    [ENEMY_TYPES.BEETLE]: Object.freeze({
      label: "Beetle",
      score: 1,
      health: 2,
      sizeScale: 2,
      radius: 22 * ENTITY_SCALE,
      spriteSize: 64 * ENTITY_SCALE,
      spriteFrames: Object.freeze(["beetle", "beetleScurry"]),
    }),
    [ENEMY_TYPES.DRAGONFLY]: Object.freeze({
      label: "Dragonfly",
      score: 4,
      health: 4,
      sizeScale: 2.25,
      radius: 24 * ENTITY_SCALE,
      spriteSize: 72 * ENTITY_SCALE,
      spriteFrames: Object.freeze(["dragonfly", "dragonflyFlap"]),
      sideProfile: true,
      flying: true,
      flightBehavior: "dragonfly",
    }),
    [ENEMY_TYPES.VULTURE]: Object.freeze({
      label: "Vulture",
      score: 160,
      health: 160,
      sizeScale: 11.25,
      radius: 123.75 * ENTITY_SCALE,
      spriteSize: 360 * ENTITY_SCALE,
      spriteFrames: Object.freeze(["vulture", "vultureFlap"]),
      sideProfile: true,
      flying: true,
      flightBehavior: "vulture",
    }),
    [ENEMY_TYPES.MOLE]: Object.freeze({
      label: "Mole",
      score: 10,
      health: 10,
      sizeScale: 3.75,
      radius: 41.25 * ENTITY_SCALE,
      spriteSize: 120 * ENTITY_SCALE,
      spriteFrames: Object.freeze(["mole", "moleScurry"]),
    }),
    [ENEMY_TYPES.RABBIT]: Object.freeze({
      label: "Rabbit",
      score: 10,
      health: 12,
      sizeScale: 4.5,
      radius: 49.5 * ENTITY_SCALE,
      spriteSize: 144 * ENTITY_SCALE,
      spriteFrames: Object.freeze(["rabbit", "rabbitJump"]),
      sideProfile: true,
    }),
    [ENEMY_TYPES.MEAT]: Object.freeze({
      label: "Meat",
      score: 1,
      health: 1,
      sizeScale: 1.5,
      radius: 16 * ENTITY_SCALE,
      spriteSize: 56 * ENTITY_SCALE,
      spriteFrames: Object.freeze(["meat"]),
      devSpawnable: false,
    }),
  });
  const ENEMY_SPAWN_RULES = Object.freeze({
    candidateDivisor: 2250,
    minimumCount: 16,
    maximumCount: 72,
    nearbyCount: 6,
    weights: Object.freeze([
      Object.freeze({ kind: ENEMY_TYPES.BEETLE, weight: 0.6 }),
      Object.freeze({ kind: ENEMY_TYPES.DRAGONFLY, weight: 0.25 }),
      Object.freeze({ kind: ENEMY_TYPES.MOLE, weight: 0.08 }),
      Object.freeze({ kind: ENEMY_TYPES.RABBIT, weight: 0.05 }),
      Object.freeze({ kind: ENEMY_TYPES.VULTURE, weight: 0.02 }),
    ]),
  });
  const MAXIMUM_ENEMY_HURTBOX_RADIUS = Math.max(
    ...Object.values(ENEMY_DEFINITIONS).map((definition) => definition.radius),
  );
  const MAXIMUM_ENEMY_SPRITE_RADIUS = Math.max(
    ...Object.values(ENEMY_DEFINITIONS).map(
      (definition) => definition.spriteSize * 0.5,
    ),
  );
  const ENEMY_SPRITE_FILES = Object.freeze({
    beetle: "./assets/enemies/beetle-handdrawn.png?v=20260803-new-default-art",
    beetleScurry:
      "./assets/enemies/beetle-scurry-handdrawn.png?v=20260803-new-default-art",
    dragonfly:
      "./assets/enemies/dragonfly-handdrawn.png?v=20260804-side-profile",
    dragonflyFlap:
      "./assets/enemies/dragonfly-flap-handdrawn.png?v=20260804-side-profile",
    vulture:
      "./assets/enemies/vulture-handdrawn.png?v=20260804-vulture",
    vultureFlap:
      "./assets/enemies/vulture-flap-handdrawn.png?v=20260804-vulture",
    mole: "./assets/enemies/mole-handdrawn.png?v=20260803-new-default-art",
    moleScurry:
      "./assets/enemies/mole-scurry-handdrawn.png?v=20260803-new-default-art",
    rabbit:
      "./assets/enemies/rabbit-handdrawn.png?v=20260805-side-profile",
    rabbitJump:
      "./assets/enemies/rabbit-jump-handdrawn.png?v=20260805-side-profile",
    meat: "./assets/enemies/meat-handdrawn.png?v=20260803-new-default-art",
  });
  const ENEMY_MOTION = Object.freeze({
    moveSpeed: 6.25,
    turnSpeed: 0.52,
    maximumTurnAngle: Math.PI,
    moveToTurnDurationRatio: 0.5,
    movingScurryFps: 6,
    turningScurryFps: 3,
    maximumFallSpeed: 480,
    airDrag: 0.8,
    burrowSpeed: 30,
    burrowDistanceBlocks: 0.8,
  });
  const MEAT_MOTION = Object.freeze({
    maximumFallSpeed: 900,
    airDrag: 0.72,
    embeddedDrag: 0.025,
    surfaceFriction: 0.72,
    surfaceRestitution: 0.28,
    restingImpactSpeed: 18,
    collisionInset: 0.05,
    maximumCollisionsPerFrame: 4,
    impactSpinRetention: 0.58,
  });
  const RABBIT_MOTION = Object.freeze({
    minimumRestDuration: 1.25,
    maximumRestDuration: 3,
    horizontalSpeed: 78,
    jumpSpeed: 165,
    maximumFallSpeed: 650,
    wallBounceRetention: 0.38,
    ceilingBounceRetention: 0.18,
    collisionInset: 0.08,
    maximumCollisionsPerFrame: 4,
  });
  const DRAGONFLY_MOTION = Object.freeze({
    moveSpeed: 260,
    minimumMoveDuration: 0.32,
    maximumMoveDuration: 0.68,
    minimumHoverDuration: 2.25,
    maximumHoverDuration: 4,
    hoverClearanceBlocks: 10,
    hoverBobAmplitude: 3,
    hoverBobAngularSpeed: TAU * 1.35,
    verticalAcceleration: 420,
    maximumVerticalSpeed: 220,
    verticalResponse: 4,
    movingWingFps: 18,
    hoveringWingFps: 12,
    wormSenseRadius: 260,
    wormReleaseRadius: 320,
    minimumPanicOrbitRadius: 24,
    maximumPanicOrbitRadius: 50,
    minimumPanicAngularSpeed: 4.5,
    maximumPanicAngularSpeed: 8,
    minimumPanicRetargetDuration: 0.45,
    maximumPanicRetargetDuration: 0.95,
    maximumPanicDriftSpeed: 42,
    panicWingFps: 24,
  });
  const VULTURE_MOTION = Object.freeze({
    moveSpeed: 105,
    minimumTravelBlocks: 16,
    maximumTravelBlocks: 48,
    hoverClearanceBlocks: DRAGONFLY_MOTION.hoverClearanceBlocks * 8,
    bobAmplitude: 30,
    bobAngularSpeed: TAU * 0.42,
    verticalFollowSpeed: 150,
    wingFps: 4,
  });
  const DEV_WORM_LEVEL_MAX = 100;
  const DEV_ENEMY_SPAWN_POSITIONS = Object.freeze([
    Object.freeze([0.76, 0.38]),
    Object.freeze([0.76, 0.62]),
    Object.freeze([0.62, 0.24]),
    Object.freeze([0.88, 0.5]),
    Object.freeze([0.62, 0.76]),
  ]);
  const MOUTH_BEHAVIOR = Object.freeze({
    proximityRadius: 170,
    maxJawAngle: 0.38,
    openRate: 6.5,
    closeRate: 14,
    biteHold: 0.14,
    chewLoopDuration: 1 / 14 + 0.14 + 1 / 6.5,
  });
  const BITE_SPLATTER_RULES = Object.freeze({
    baseCount: 24,
    minimumSpeed: 95,
    maximumSpeed: 320,
    sideAngle: Math.PI * 0.5,
    angleSpread: 0.72,
    velocityCarry: 0.12,
    minimumLife: 0.32,
    maximumLife: 0.68,
    gravity: 410,
    particleLimit: 280,
  });
  const BODY_RENDER_RULES = Object.freeze({
    // Simulation points still follow the full body path. Only the overlapping
    // body/outline artwork is thinned; rings retain their original cadence.
    visualSegmentStride: 3,
    longitudinalOverlap: 1.08,
  });
  const BODY_PATH_RULES = Object.freeze({
    compactDiscardedPrefixAt: 2048,
    minimumSampleSpacing: 3,
    samplesPerSegment: 8,
  });
  const EAT_ANIMATION_CONE = Object.freeze({
    rangeMultiplier: 1.325,
    halfAngleMultiplier: 0.55,
  });
  const TONGUE_RULES = Object.freeze({
    lengthMultiplier: 1,
    extendRate: 8.5,
    holdDuration: 0.32,
    retractRate: 6.5,
    firstSegmentTurnLimit: Math.PI / 18,
    lastSegmentTurnLimit: Math.PI / 6,
    rearAimThreshold: Math.PI * 0.5,
    targetingRadiusBlocks: 15,
    capturedRetractRate: 1.2,
    retractAvoidanceLookahead: 0.075,
    retractAvoidanceTurnAcceleration: 21600,
    retractAvoidanceMaximumSpeed: 1040,
    retractAvoidancePadding: 1.5,
    retractAvoidanceMaximumCorrection: 5,
    retractAvoidanceHitboxScale: 2,
    retractAvoidanceFrontBias: 1.5,
    retractAvoidanceTailBias: 0.5,
    freefallGravity: 280,
    freefallDrag: 0.9,
    freefallMaximumSpeed: 520,
    freefallConstraintIterations: 8,
    renderLineSamples: 4,
    outerBaseWidth: 11,
    innerBaseWidth: 7,
    highlightBaseWidth: 2.2,
    taperExponent: 0.85,
    segmentSpacingMultiplier: 2,
  });
  const TONGUE_GRAPPLE_RULES = Object.freeze({
    springAccelerationPerPixel: 30,
    radialDamping: 6.5,
    maximumStretchRatio: 0.985,
    endStretchResistance: 6,
    reboundRetention: 0.72,
    reelSpeed: 620,
    reelBoostMultiplier: 1.8,
    maximumSpeedMultiplier: 3.5,
    bodyConstraintIterations: 8,
    bodyDrag: 0.94,
    bodyMaximumSpeedMultiplier: 3.5,
  });
  const ACID_RULES = Object.freeze({
    particlesPerSecond: 78,
    particlesPerSecondSqrtLevelScale: 0.05,
    maximumParticlesPerSecond: 120,
    // Keep enough pooled capacity for a continuous hose even if a developer
    // changes levels while older, longer-lived particles are still active.
    maximumParticles: 1152,
    maximumEmissionsPerFrame: 4,
    particleRadius: 3.6,
    particleRadiusVariance: 0.42,
    baseVisualDropletsPerParticle: 4,
    minimumVisualDensityMultiplier: 0.5,
    maximumVisualDensityMultiplier: 10,
    visualDensityTiers: Object.freeze([2, 4, 8, 16, 24, 32, 40]),
    visualDropletMinimumRadiusScale: 0.68,
    visualDropletMaximumRadiusScale: 0.94,
    visualDropletMaximumOffset: 1.16,
    visualClusterVariants: 16,
    visualClusterAtlasColumns: 4,
    visualClusterTileSize: 96,
    visualClusterExtent: 2.62,
    maximumClusterHighlights: 5,
    minimumNozzleSpeed: 650,
    maximumNozzleSpeed: 920,
    maximumScalingLevel: 100,
    nozzleSpeedVariance: 0.24,
    nozzleJitter: 4.2,
    spreadAngle: 0.13,
    flowWobbleAngle: 0.06,
    flowWobbleFrequency: 12.5,
    lateralSpeedJitter: 70,
    minimumLife: 0.8,
    maximumLife: 1.1,
    maximumLifeBonus: 3.5,
    fadeDuration: 0.16,
    damageReferenceDuration: 0.25,
    latchedDamageDivisor: 33,
    soilSpeedMultiplier: 0.5,
    soilVelocityRetentionPerSecond: 0.78,
    maximumTunneledTilesPerFrame: 32,
    maximumTunnelDecayEntriesPerFrame: 256,
    maximumTunnelRestorationsPerFrame: 64,
    maximumMovementSubsteps: 48,
    gravity: 680,
    airDrag: 0.985,
    surfaceFriction: 0.82,
    restitution: 0.045,
    collisionInset: 0.08,
    maximumCollisionsPerFrame: 2,
    craneBodyFraction: 1 / 3,
    aimTurnSpeed: 11,
    sprayJawAngleMultiplier: 1.18,
    linkDistanceMultiplier: 4.5,
    linkCoreRadiusScale: 1.2,
  });
  // Both worm types share the current player-edited appearance by default.
  // Their abilities and scaling remain independent of these sprite sources.
  const SHARED_WORM_SPRITE_FILES = Object.freeze({
    headUpper:
      "./assets/worm/shared-default-head-upper.png?v=20260815-shared-current-default",
    headLower:
      "./assets/worm/shared-default-head-lower.png?v=20260815-shared-current-default",
    mouthUpper:
      "./assets/worm/shared-default-mouth-upper.png?v=20260815-shared-current-default",
    mouthLower:
      "./assets/worm/shared-default-mouth-lower.png?v=20260815-shared-current-default",
    segment:
      "./assets/worm/shared-default-segment.png?v=20260815-shared-current-default",
    segmentBand:
      "./assets/worm/shared-default-segment-band.png?v=20260815-shared-current-default",
    segmentOutline:
      "./assets/worm/shared-default-segment-outline.png?v=20260815-shared-current-default",
    tongue:
      "./assets/worm/shared-default-tongue.png?v=20260815-shared-current-default",
    tongueRing:
      "./assets/worm/shared-default-tongue-ring.png?v=20260815-shared-current-default",
  });
  const WORM_TYPE_DEFAULT_SPRITE_FILES = Object.freeze({
    [WORM_TYPE_IDS.LICKER]: SHARED_WORM_SPRITE_FILES,
    [WORM_TYPE_IDS.SPITTER]: SHARED_WORM_SPRITE_FILES,
  });
  function defaultWormSpriteFiles(typeId) {
    return (
      WORM_TYPE_DEFAULT_SPRITE_FILES[typeId] ||
      WORM_TYPE_DEFAULT_SPRITE_FILES[WORM_TYPE_IDS.LICKER]
    );
  }
  function activeDefaultWormSpriteFiles() {
    return defaultWormSpriteFiles(game.activeWormTypeId);
  }
  const DEFAULT_WORM_MIRRORING = Object.freeze({
    mirroredJawSource: "headUpper",
    mirroredMouthSource: "mouthUpper",
  });
  const WORM_TYPE_APPEARANCE_STORAGE_PREFIX = "worm.type-appearance.v1";
  // Retained as a one-time migration source for existing Licker designs.
  const WORM_APPEARANCE_STORAGE_KEY = "worm.custom-appearance.v6";
  const WORM_PACKAGE_FORMAT = "worm-appearance";
  const WORM_PACKAGE_VERSION = 1;
  const WORM_PACKAGE_MAX_BYTES = 12 * 1024 * 1024;
  const PREVIOUS_WORM_APPEARANCE_STORAGE_KEY = "worm.custom-appearance.v5";
  const SINGLE_JAW_WORM_APPEARANCE_STORAGE_KEY = "worm.custom-appearance.v4";
  const OLDER_WORM_APPEARANCE_STORAGE_KEY = "worm.custom-appearance.v3";
  const SPLIT_JAW_WORM_APPEARANCE_STORAGE_KEY = "worm.custom-appearance.v2";
  const LEGACY_WORM_APPEARANCE_STORAGE_KEY = "worm.custom-appearance.v1";
  const WORM_LAYER_DEFINITIONS = Object.freeze({
    headUpper: Object.freeze({ label: "Upper jaw", width: 128, height: 96 }),
    headLower: Object.freeze({ label: "Lower jaw", width: 128, height: 96 }),
    mouthUpper: Object.freeze({ label: "Upper mouth", width: 128, height: 96 }),
    mouthLower: Object.freeze({ label: "Lower mouth", width: 128, height: 96 }),
    segment: Object.freeze({ label: "Body", width: 80, height: 80 }),
    segmentBand: Object.freeze({ label: "Rings", width: 80, height: 80 }),
    segmentOutline: Object.freeze({ label: "Outline", width: 80, height: 80 }),
    tongue: Object.freeze({ label: "Tongue", width: 80, height: 80 }),
    tongueRing: Object.freeze({ label: "Tongue rings", width: 80, height: 80 }),
  });
  const CORE_WORM_LAYER_NAMES = Object.freeze(
    Object.keys(WORM_LAYER_DEFINITIONS).filter(
      (name) => name !== "tongue" && name !== "tongueRing",
    ),
  );
  const HALF_WORM_LAYER_SIDES = Object.freeze({
    headUpper: "upper",
    headLower: "lower",
    mouthUpper: "upper",
    mouthLower: "lower",
  });
  const JAW_LAYER_NAMES = new Set(["headUpper", "headLower"]);
  const MOUTH_LAYER_NAMES = new Set(["mouthUpper", "mouthLower"]);
  const HALF_SPRITE_SEAM_OVERLAP = 0.75;
  const WORM_SPRITE_METRICS = Object.freeze({
    headWidth: 64,
    headHeight: 48,
    jawHingeX: -20,
    segmentCanvasSize: 40,
    segmentFillRadius: WORM_SHAPE.tailRadius + WORM_SHAPE.bodyRadius,
    segmentOutlineRadius:
      WORM_SHAPE.tailRadius + WORM_SHAPE.bodyRadius + WORM_SHAPE.bodyOutline,
  });
  const WORM_PREVIEW_MOTION = Object.freeze({
    groundY: 0,
    minimumDepth: -210,
    maximumDepth: 185,
    minimumSpeed: 55,
    maximumSpeed: 380,
    acceleration: 235,
    coastDeceleration: 72,
    brakeDeceleration: 330,
    groundTurnSpeed: 2.15,
    airTurnForce: 170,
    gravity: 235,
    forcedBreachInterval: 6.5,
  });
  const WORM_PREVIEW_TONGUE = Object.freeze({
    minimumWaitDuration: 0.45,
    maximumWaitDuration: 1.3,
    extendRate: 2.35,
    minimumSwingDuration: 1.15,
    maximumSwingDuration: 2.45,
    retractRate: 1.65,
    minimumAimOffset: -0.78,
    maximumAimOffset: 0.78,
    minimumSwingTarget: -0.38,
    maximumSwingTarget: 0.38,
    minimumSwingTargetDuration: 0.18,
    maximumSwingTargetDuration: 0.52,
    swingAcceleration: 22,
    swingDamping: 7.5,
    maximumSwingSpeed: 3.2,
  });

  function loadSpriteImage(source) {
    const image = new Image();
    image.decoding = "async";
    image.addEventListener("load", () => render());
    image.src = source;
    return image;
  }

  const wormSprites = Object.freeze(
    Object.fromEntries(
      Object.entries(defaultWormSpriteFiles(WORM_TYPE_IDS.LICKER)).map(([name, source]) => [
        name,
        loadSpriteImage(source),
      ]),
    ),
  );
  let wormBodySpriteRevision = 0;
  const wormBodyCompositeCache = {
    revision: -1,
    segmentCount: 0,
    sprites: [],
  };
  const gameplayBodyLayoutCache = {
    segmentCount: 0,
    scale: Number.NaN,
    renderIndices: [],
    cumulativeDistances: new Float32Array(0),
    minimumRenderedWidths: new Float32Array(0),
    fillRadii: new Float32Array(0),
    outlineRadii: new Float32Array(0),
    segmentAngles: new Float32Array(0),
  };
  const enemySprites = Object.freeze(
    Object.fromEntries(
      Object.entries(ENEMY_SPRITE_FILES).map(([name, source]) => [
        name,
        loadSpriteImage(source),
      ]),
    ),
  );

  // The 12 px grid preserves the 16× tile density introduced for the original
  // map area. World depth is expanded separately below the fixed surface row.
  const BLOCK_SIZE = 12;
  const LEGACY_WORLD_COLUMNS = 640;
  const LEGACY_WORLD_ROWS = 360;
  const WORLD_COLUMNS = LEGACY_WORLD_COLUMNS * 4;
  const WORLD_GROUND_ROW = 144;
  const LEGACY_UNDERGROUND_ROWS = LEGACY_WORLD_ROWS - WORLD_GROUND_ROW;
  const WORLD_DEPTH_MULTIPLIER = 10;
  const WORLD_ROWS =
    WORLD_GROUND_ROW + LEGACY_UNDERGROUND_ROWS * WORLD_DEPTH_MULTIPLIER;
  const WORLD_WIDTH = WORLD_COLUMNS * BLOCK_SIZE;
  const WORLD_HEIGHT = WORLD_ROWS * BLOCK_SIZE;
  // The camera is substantially wider than it is tall. Rectangular chunks
  // halve horizontal Canvas submissions at minimum zoom without increasing
  // the cache's approximate pixel budget.
  const TERRAIN_CHUNK_WIDTH = BLOCK_SIZE * 128;
  const TERRAIN_CHUNK_HEIGHT = BLOCK_SIZE * 64;
  const TERRAIN_CHUNK_LOW_DETAIL_ZOOM = 0.6;
  const TERRAIN_CHUNK_LOW_DETAIL_SCALE = 0.5;
  const TERRAIN_CHUNK_RENDER_SCALES = Object.freeze([
    1,
    TERRAIN_CHUNK_LOW_DETAIL_SCALE,
  ]);
  const TERRAIN_CHUNK_BLEED = 2;
  const TERRAIN_TEXTURE_PATTERN_SIZE = BLOCK_SIZE * 32;
  const TERRAIN_TEXTURE_PATTERN_VARIANTS = 4;
  const MIN_TERRAIN_CHUNKS = 16;
  const TERRAIN_PREFETCH_MINIMUM_SPEED = 20;
  const TERRAIN_PREFETCH_FRAME_RESERVE = 2.5;
  const DEFAULT_WORLD_ID = "default-flat";
  const WORLD_STORAGE_KEY = "worm.custom-worlds.v1";
  const SELECTED_WORLD_STORAGE_KEY = "worm.selected-world.v1";
  const WORLD_FORMAT_VERSION = 5;
  const DEFAULT_WORLD = Object.freeze({
    id: DEFAULT_WORLD_ID,
    name: "Flat World",
    builtin: true,
    spawn: Object.freeze({ column: Math.floor(WORLD_COLUMNS / 2), row: 156 }),
  });
  const BLOCK_TYPES = Object.freeze({
    AIR: "air",
    GROUND: "ground",
    STONE: "stone",
  });
  // Terrain depth is a visual extrusion of solid-to-air boundaries. The
  // increasingly distant layers contract toward the head-centered vanishing
  // point and use wider strokes, leaving three textured bands visible behind
  // the normal terrain without introducing additional simulated tile maps.
  const TERRAIN_DEPTH_LAYERS = Object.freeze([
    Object.freeze({
      id: "far",
      perspectiveScale: 0.96,
      visibleDepthPixels: 58,
    }),
    Object.freeze({
      id: "middle",
      perspectiveScale: 0.978,
      visibleDepthPixels: 30,
    }),
    Object.freeze({
      id: "near",
      perspectiveScale: 0.992,
      visibleDepthPixels: 14,
    }),
  ]);
  const TERRAIN_DEPTH_SKY_BLEND = Object.freeze({
    far: 0.72,
    middle: 0.48,
    near: 0.22,
  });
  const MATERIAL_TILE_VALUES = Object.freeze({
    [BLOCK_TYPES.GROUND]: 1,
    [BLOCK_TYPES.STONE]: 2,
  });
  const TERRAIN_MATERIALS = Object.freeze(Object.keys(MATERIAL_TILE_VALUES));
  // Runtime-only tunneled soil is a distinct, non-diggable tile state. It is
  // intentionally omitted from MATERIAL_TILE_VALUES so world saves and editor
  // material tools continue to expose only authored terrain materials.
  const TUNNELED_GROUND_TILE_VALUE = 3;
  const ACID_TUNNEL_TEXTURE_OPACITY = 0.5;
  // Old tunnel paint closes only after it is far beyond both the camera and
  // minimap. One-second buckets stagger restoration without per-tile timers.
  const TUNNEL_DECAY_RULES = Object.freeze({
    minimumLifetime: 60,
    lifetimeVariation: 14,
    visibleDeferral: 5,
    maximumTilesPerFrame: 256,
    horizontalProtectionPadding: TERRAIN_CHUNK_WIDTH,
    verticalProtectionPadding: TERRAIN_CHUNK_HEIGHT,
  });
  const TILE_VALUE_MATERIALS = Object.freeze({
    [MATERIAL_TILE_VALUES[BLOCK_TYPES.GROUND]]: BLOCK_TYPES.GROUND,
    [MATERIAL_TILE_VALUES[BLOCK_TYPES.STONE]]: BLOCK_TYPES.STONE,
    [TUNNELED_GROUND_TILE_VALUE]: BLOCK_TYPES.GROUND,
  });
  const BLOCK_TEXTURES = Object.freeze({
    SOIL: "soil",
    TUNNELED_SOIL: "tunneled-soil",
    ACID_TUNNELED_SOIL: "acid-tunneled-soil",
    STONE: "stone",
  });
  const CARDINAL_BLOCK_OFFSETS = Object.freeze([
    Object.freeze([-1, 0]),
    Object.freeze([1, 0]),
    Object.freeze([0, -1]),
    Object.freeze([0, 1]),
  ]);

  const game = {
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    dpr: 1,
    groundY: 0,
    viewport: { width: 0, height: 0 },
    camera: { x: 0, y: 0 },
    selectedWorldId: DEFAULT_WORLD_ID,
    selectedWorldName: DEFAULT_WORLD.name,
    activeWorldId: null,
    activeWorldName: "",
    activeWormTypeId: WORM_TYPE_IDS.LICKER,
    levelLoaded: false,
    homeOpen: true,
    spawn: { x: 0, y: 0, heading: -0.48 },
    menuOpen: false,
    started: false,
    paused: false,
    lastTime: 0,
    lastRenderTime: 0,
    fps: 0,
    fpsFrames: 0,
    fpsSampleStart: 0,
    fpsLastFrameTime: 0,
    fpsLimit: 0,
    elapsed: 0,
    shake: 0,
    transitionEffectCooldown: 0,
    mouthOpen: 0,
    mouthBitePhase: "idle",
    mouthBiteHoldTimer: 0,
    mouthChewTimer: 0,
    tongues: [],
    acidParticles: [],
    acidParticlePool: [],
    acidEmissionAccumulator: 0,
    acidParticleGeneration: 0,
    acidLastEmittedParticle: null,
    spitterAimAngle: null,
    latchAttack: null,
    boostLatchReady: true,
    showGrid: false,
    showVectors: false,
    showSteeringVectors: false,
    showHitboxes: false,
    showCombatStats: false,
    swarmMode: false,
    terrainChunks: new Map(),
    terrainPlaceholderChunks: new Map(),
    visibleTerrainFrame: 0,
    terrainCacheLimit: MIN_TERRAIN_CHUNKS,
    terrainPrefetchCandidates: [],
    terrainPrefetchDirectionalCount: 0,
    terrainChunkColumnCount: 0,
    terrainChunkBuildEstimateMs: 4,
    lastFrameWorkDuration: 0,
    minimapMapRevision: 0,
    minimapTerrainRevision: 0,
    head: { x: 0, y: 0 },
    previous: { x: 0, y: 0 },
    previousEatHitbox: null,
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    heading: -0.55,
    speed: 250,
    inGround: true,
    wasInGround: true,
    onStoneSurface: false,
    stoneSurfaceContact: null,
    excludedStoneSurfacePath: null,
    stoneSurfaceRelockTimer: 0,
    stoneCollisionGraceClusterId: null,
    stoneCollisionGraceTimer: 0,
    stoneSurfaceDirection: 1,
    segments: [],
    bodyPath: [],
    bodyPathStartIndex: 0,
    particles: [],
    clouds: [],
    targets: [],
    capturedTargets: [],
    nextTargetId: 0,
    targetsEaten: 0,
    totalTargets: 0,
    score: 0,
    scoreGrowthLevel: 0,
    growthLevel: 0,
    growthLevelOverride: null,
    growthProgress: 0,
    growthCost: GROWTH_RULES.initialCost,
    devEnemySpawnIndex: 0,
    boostCharge:
      BOOST_RULES.levelOneDuration - BOOST_RULES.secondsPerLevel,
    boosting: false,
    map: {
      cellSize: BLOCK_SIZE,
      columns: 0,
      rows: 0,
      tiles: new Uint8Array(0),
      tunnelExpiryBuckets: new Map(),
      nextTunnelExpiryTick: Infinity,
      acidTunnelDecayRecords: new Map(),
      stoneClusterIds: null,
      stoneClusters: [],
      stoneSurfacePaths: [],
      stoneSurfaceSegmentsByColumn: [],
      targetCandidateSummaries: new Map(),
    },
  };

  const terrainLayerRenderState = {
    drawItems: [],
    zoom: 1,
  };

  const spitterCraneRenderState = {
    segments: [],
    outputSegments: [],
    headPose: { x: 0, y: 0, angle: 0 },
  };
  // Frame-local particle-seconds accumulated by acid carriers that are stuck
  // to each target. Reusing this Map keeps dense, high-level sprays from
  // allocating a damage record for every carrier on every frame.
  const acidLatchedTargetSeconds = new Map();
  const acidActiveTargets = new Set();
  const acidTargetContactScratch = {
    time: 0,
    normalX: 1,
    normalY: 0,
    centerDistanceSquared: 0,
  };
  const acidClusterAtlasCache = new Map();
  let acidTunnelTilesRemaining = 0;
  let acidTunnelTilesChanged = 0;
  const tunnelDecayChunkKeys = new Set();
  const tunnelDecayPlaceholderKeys = new Set();

  const MINIMAP_RULES = Object.freeze({
    width: 184,
    height: 132,
    refreshInterval: 100,
    viewPadding: 1.65,
  });
  const MINIMAP_COLORS = Object.freeze({
    outside: Object.freeze([115, 33, 12]),
    air: Object.freeze([116, 32, 25]),
    ground: Object.freeze([116, 65, 45]),
    acidTunneled: Object.freeze([85, 50, 37]),
    tunneled: Object.freeze([53, 35, 29]),
    stone: Object.freeze([111, 83, 87]),
  });
  const minimapSceneCanvas = document.createElement("canvas");
  minimapSceneCanvas.width = MINIMAP_RULES.width;
  minimapSceneCanvas.height = MINIMAP_RULES.height;
  const minimapSceneContext = minimapSceneCanvas.getContext("2d", {
    alpha: false,
  });
  const minimapState = {
    ready: false,
    mapRevision: -1,
    terrainRevision: -1,
    lastRefreshTime: -Infinity,
    bounds: { x: 0, y: 0, width: 1, height: 1 },
    imageData: minimapSceneContext.createImageData(
      MINIMAP_RULES.width,
      MINIMAP_RULES.height,
    ),
    sampleColumns: new Int32Array(MINIMAP_RULES.width),
  };

  const DEV_PROFILER_SAMPLE_DURATION = 500;
  const DEV_PROFILER_DEFAULT_BUDGET = 1000 / 60;
  const devProfiler = {
    active: false,
    frameCollecting: false,
    lastFrameTimestamp: 0,
    estimatedBudgetMs: DEV_PROFILER_DEFAULT_BUDGET,
    currentChunkBuilds: 0,
    currentChunkBuildMs: 0,
    currentEvictions: 0,
    visibleChunks: 0,
    cacheLimit: MIN_TERRAIN_CHUNKS,
    pendingFrame: null,
    sampleStart: 0,
    frameCount: 0,
    intervalCount: 0,
    intervalTotal: 0,
    intervalPeak: 0,
    updateTotal: 0,
    renderTotal: 0,
    workTotal: 0,
    workPeak: 0,
    chunkBuilds: 0,
    chunkBuildMs: 0,
    chunkFramePeakMs: 0,
    chunkFramePeakCount: 0,
    evictions: 0,
    droppedFrames: 0,
  };

  function resetDevProfilerSample(time) {
    devProfiler.sampleStart = time;
    devProfiler.frameCount = 0;
    devProfiler.intervalCount = 0;
    devProfiler.intervalTotal = 0;
    devProfiler.intervalPeak = 0;
    devProfiler.updateTotal = 0;
    devProfiler.renderTotal = 0;
    devProfiler.workTotal = 0;
    devProfiler.workPeak = 0;
    devProfiler.chunkBuilds = 0;
    devProfiler.chunkBuildMs = 0;
    devProfiler.chunkFramePeakMs = 0;
    devProfiler.chunkFramePeakCount = 0;
    devProfiler.evictions = 0;
    devProfiler.droppedFrames = 0;
  }

  function resetDevProfilerPanel() {
    devProfilerGate.dataset.gate = "idle";
    devProfilerLabel.textContent = "Collecting";
    devProfilerDetail.textContent =
      "Move through the world to sample frame pressure.";
    devProfilerFrame.textContent = "0.0";
    devProfilerBudget.textContent = devProfiler.estimatedBudgetMs.toFixed(1);
    devProfilerUpdate.textContent = "0.0";
    devProfilerRender.textContent = "0.0";
    devProfilerPeak.textContent = "0.0";
    devProfilerDropped.textContent = "0";
    devProfilerChunks.textContent = "0";
    devProfilerChunkTime.textContent = "0.0";
    devProfilerCache.textContent = `${game.terrainChunks.size} / ${devProfiler.cacheLimit}`;
    devProfilerMemory.textContent = "0.0";
    devProfilerEvictions.textContent = "0";
    devProfilerUpdateBar.style.width = "0%";
    devProfilerRenderBar.style.width = "0%";
  }

  function setDevProfilerActive(active) {
    devProfiler.active = active;
    devProfiler.frameCollecting = false;
    devProfiler.lastFrameTimestamp = 0;
    devProfiler.pendingFrame = null;
    devProfiler.estimatedBudgetMs =
      game.fpsLimit > 0
        ? 1000 / game.fpsLimit
        : game.fps > 1
          ? 1000 / game.fps
          : DEV_PROFILER_DEFAULT_BUDGET;
    resetDevProfilerSample(performance.now());
    if (active) resetDevProfilerPanel();
  }

  function beginDevProfilerFrame(time) {
    if (!devProfiler.active) return false;
    devProfiler.frameCollecting = true;
    devProfiler.currentChunkBuilds = 0;
    devProfiler.currentChunkBuildMs = 0;
    devProfiler.currentEvictions = 0;
    if (devProfiler.sampleStart === 0) resetDevProfilerSample(time);
    return true;
  }

  function noteDevProfilerTerrainBuild(duration) {
    if (!devProfiler.frameCollecting) return;
    devProfiler.currentChunkBuilds += 1;
    devProfiler.currentChunkBuildMs += duration;
  }

  function noteDevProfilerTerrainEviction() {
    if (devProfiler.frameCollecting) devProfiler.currentEvictions += 1;
  }

  function noteDevProfilerTerrainView(visibleChunks, cacheLimit) {
    if (!devProfiler.frameCollecting) return;
    devProfiler.visibleChunks = visibleChunks;
    devProfiler.cacheLimit = cacheLimit;
  }

  function devProfilerFrameBudget(frameInterval) {
    if (game.fpsLimit > 0) {
      devProfiler.estimatedBudgetMs = 1000 / game.fpsLimit;
      return devProfiler.estimatedBudgetMs;
    }
    if (frameInterval > 2 && frameInterval < 50) {
      if (frameInterval < devProfiler.estimatedBudgetMs * 0.85) {
        devProfiler.estimatedBudgetMs = frameInterval;
      } else if (frameInterval < devProfiler.estimatedBudgetMs * 1.2) {
        devProfiler.estimatedBudgetMs = lerp(
          devProfiler.estimatedBudgetMs,
          frameInterval,
          0.08,
        );
      }
    }
    return devProfiler.estimatedBudgetMs;
  }

  function devProfilerCacheMemoryMegabytes() {
    let bytes = 0;
    game.terrainChunks.forEach((chunk) => {
      bytes += chunk.canvas.width * chunk.canvas.height * 4;
    });
    return bytes / (1024 * 1024);
  }

  function classifyDevProfilerSample(sample) {
    const pressure =
      sample.droppedFrames > 0 ||
      sample.intervalPeak > sample.budget * 1.35 ||
      sample.averageInterval > sample.budget * 1.15;
    if (
      pressure &&
      sample.chunkBuilds > 0 &&
      (sample.chunkFramePeakMs > sample.budget * 0.2 ||
        sample.chunkFramePeakCount >= 3)
    ) {
      return {
        gate: "cache",
        label: "CPU / cache",
        detail: `${sample.chunkFramePeakCount} terrain chunks were built in one frame.`,
      };
    }
    if (
      pressure &&
      (sample.workPeak >= sample.budget * 0.85 ||
        sample.averageWork >= sample.budget * 0.75)
    ) {
      const canvasDominant = sample.averageRender > sample.averageUpdate * 1.35;
      return {
        gate: "cpu",
        label: canvasDominant ? "Main / canvas" : "CPU / main",
        detail: canvasDominant
          ? "Canvas submission is consuming most of the measured frame budget."
          : "Game update work is consuming most of the measured frame budget.",
      };
    }
    if (pressure && sample.averageWork < sample.budget * 0.65) {
      return {
        gate: "gpu",
        label: "Raster / GPU?",
        detail:
          "Presentation is late while measured main-thread work remains below budget.",
      };
    }
    if (pressure) {
      return {
        gate: "mixed",
        label: "Mixed pressure",
        detail:
          "Measured work and browser presentation are both close to the frame limit.",
      };
    }
    return {
      gate: "ok",
      label: "Within budget",
      detail: "No consistent CPU, cache, or presentation gate was detected.",
    };
  }

  function publishDevProfilerSample(time) {
    const frames = Math.max(1, devProfiler.frameCount);
    const intervals = Math.max(1, devProfiler.intervalCount);
    const sample = {
      budget: devProfiler.estimatedBudgetMs,
      averageInterval: devProfiler.intervalTotal / intervals,
      intervalPeak: devProfiler.intervalPeak,
      averageUpdate: devProfiler.updateTotal / frames,
      averageRender: devProfiler.renderTotal / frames,
      averageWork: devProfiler.workTotal / frames,
      workPeak: devProfiler.workPeak,
      chunkBuilds: devProfiler.chunkBuilds,
      chunkBuildMs: devProfiler.chunkBuildMs,
      chunkFramePeakMs: devProfiler.chunkFramePeakMs,
      chunkFramePeakCount: devProfiler.chunkFramePeakCount,
      evictions: devProfiler.evictions,
      droppedFrames: devProfiler.droppedFrames,
    };
    const classification = classifyDevProfilerSample(sample);
    const updatePercent = clamp(
      (sample.averageUpdate / sample.budget) * 100,
      0,
      100,
    );
    const renderPercent = clamp(
      (sample.averageRender / sample.budget) * 100,
      0,
      100 - updatePercent,
    );

    devProfilerGate.dataset.gate = classification.gate;
    devProfilerLabel.textContent = classification.label;
    devProfilerDetail.textContent = classification.detail;
    devProfilerFrame.textContent = sample.averageInterval.toFixed(1);
    devProfilerBudget.textContent = sample.budget.toFixed(1);
    devProfilerUpdate.textContent = sample.averageUpdate.toFixed(1);
    devProfilerRender.textContent = sample.averageRender.toFixed(1);
    devProfilerPeak.textContent = sample.intervalPeak.toFixed(1);
    devProfilerDropped.textContent = String(sample.droppedFrames);
    devProfilerChunks.textContent = String(sample.chunkBuilds);
    devProfilerChunkTime.textContent = sample.chunkBuildMs.toFixed(1);
    devProfilerCache.textContent = `${game.terrainChunks.size} / ${devProfiler.cacheLimit}`;
    devProfilerMemory.textContent = devProfilerCacheMemoryMegabytes().toFixed(1);
    devProfilerEvictions.textContent = String(sample.evictions);
    devProfilerUpdateBar.style.width = `${updatePercent.toFixed(1)}%`;
    devProfilerRenderBar.style.width = `${renderPercent.toFixed(1)}%`;
    resetDevProfilerSample(time);
  }

  function finishDevProfilerFrame(
    time,
    updateDuration,
    renderDuration,
    workDuration,
  ) {
    if (!devProfiler.frameCollecting) return;
    const frameInterval =
      devProfiler.lastFrameTimestamp > 0
        ? time - devProfiler.lastFrameTimestamp
        : 0;
    devProfiler.lastFrameTimestamp = time;
    const budget = devProfilerFrameBudget(frameInterval);

    // A long callback delays the following requestAnimationFrame timestamp.
    // Attribute that interval to the completed frame which preceded it, not
    // to the new frame whose work has only just been measured.
    const completedFrame = devProfiler.pendingFrame;
    if (completedFrame && frameInterval > 0 && frameInterval < 1000) {
      devProfiler.frameCount += 1;
      devProfiler.updateTotal += completedFrame.updateDuration;
      devProfiler.renderTotal += completedFrame.renderDuration;
      devProfiler.workTotal += completedFrame.workDuration;
      devProfiler.workPeak = Math.max(
        devProfiler.workPeak,
        completedFrame.workDuration,
      );
      devProfiler.chunkBuilds += completedFrame.chunkBuilds;
      devProfiler.chunkBuildMs += completedFrame.chunkBuildMs;
      devProfiler.chunkFramePeakMs = Math.max(
        devProfiler.chunkFramePeakMs,
        completedFrame.chunkBuildMs,
      );
      devProfiler.chunkFramePeakCount = Math.max(
        devProfiler.chunkFramePeakCount,
        completedFrame.chunkBuilds,
      );
      devProfiler.evictions += completedFrame.evictions;
      devProfiler.intervalCount += 1;
      devProfiler.intervalTotal += frameInterval;
      devProfiler.intervalPeak = Math.max(
        devProfiler.intervalPeak,
        frameInterval,
      );
      devProfiler.droppedFrames += Math.max(
        0,
        Math.round(frameInterval / Math.max(0.1, budget)) - 1,
      );
    }
    devProfiler.pendingFrame = {
      updateDuration,
      renderDuration,
      workDuration,
      chunkBuilds: devProfiler.currentChunkBuilds,
      chunkBuildMs: devProfiler.currentChunkBuildMs,
      evictions: devProfiler.currentEvictions,
    };
    devProfiler.frameCollecting = false;

    if (
      time - devProfiler.sampleStart >= DEV_PROFILER_SAMPLE_DURATION &&
      devProfiler.intervalCount > 0
    ) {
      publishDevProfilerSample(time);
    }
  }

  let customWorlds = [];
  const editor = {
    open: false,
    worldId: null,
    tiles: new Uint8Array(0),
    spawn: { column: Math.floor(WORLD_COLUMNS / 2), row: Math.floor(WORLD_ROWS / 2) },
    tool: "ground",
    fillMaterialTool: "ground",
    brushShape: "circle",
    brushSize: 5,
    scale: 2,
    offsetX: 0,
    offsetY: 0,
    viewWidth: 0,
    viewHeight: 0,
    drawing: false,
    panning: false,
    pointerId: null,
    lastCell: null,
    lastPointer: null,
    hoverCell: null,
  };
  const wormPainter = {
    open: false,
    activeLayer: "headUpper",
    tool: "paint",
    strokeTool: "paint",
    brushSize: 4,
    symmetry: "horizontal",
    color: "#ec6f51",
    showReflectionLine: false,
    showMouthJawOverlay: false,
    mirroredJawSource: DEFAULT_WORM_MIRRORING.mirroredJawSource,
    mirroredMouthSource: DEFAULT_WORM_MIRRORING.mirroredMouthSource,
    drawing: false,
    pointerId: null,
    lastPoint: null,
    bodyCompositeRevision: 0,
    layers: Object.fromEntries(
      Object.entries(WORM_LAYER_DEFINITIONS).map(([name, definition]) => {
        const layer = document.createElement("canvas");
        layer.width = definition.width;
        layer.height = definition.height;
        return [name, layer];
      }),
    ),
  };
  const wormPreviewBodyCompositeCache = {
    revision: -1,
    segmentCount: 0,
    sprites: [],
  };
  const wormPreviewSimulation = {
    initialized: false,
    time: 0,
    lastBreachTime: -WORM_PREVIEW_MOTION.forcedBreachInterval,
    head: { x: 0, y: 82 },
    previous: { x: 0, y: 82 },
    velocity: { x: 0, y: 0 },
    heading: -0.55,
    speed: 145,
    inGround: true,
    phase: "accelerate",
    phaseTimer: 0,
    throttle: 1,
    turnInput: 0,
    targetHeading: null,
    mouthOpen: 0.42,
    tonguePhase: "waiting",
    tongueProgress: 0,
    tonguePhaseTimer: 0,
    tongueAimOffset: 0,
    tongueSwingOffset: 0,
    tongueSwingVelocity: 0,
    tongueSwingTarget: 0,
    tongueSwingTimer: 0,
    segments: [],
    bodyPath: [],
    camera: { x: 0, y: 0 },
  };
  const wormAppearance = {
    mirroredJawSource: DEFAULT_WORM_MIRRORING.mirroredJawSource,
    mirroredMouthSource: DEFAULT_WORM_MIRRORING.mirroredMouthSource,
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (start, end, amount) => start + (end - start) * amount;
  const magnitude = (x, y) => Math.hypot(x, y);
  const positiveModulo = (value, modulus) =>
    modulus > 0 ? ((value % modulus) + modulus) % modulus : value;
  const wrapWorldX = (x) => positiveModulo(x, game.width);
  const nearestPeriodicWorldX = (x, referenceX = game.head.x) => {
    if (game.width <= 0) return x;
    return x + Math.round((referenceX - x) / game.width) * game.width;
  };
  const wrapWorldColumn = (column) =>
    positiveModulo(column, game.map.columns);
  const moveToward = (value, target, maximumChange) =>
    value < target
      ? Math.min(value + maximumChange, target)
      : Math.max(value - maximumChange, target);
  const randomRange = (minimum, maximum) =>
    minimum + Math.random() * (maximum - minimum);
  const activeWormType = () =>
    WORM_TYPES[game.activeWormTypeId] || WORM_TYPES[WORM_TYPE_IDS.LICKER];
  const activeWormScaling = () => activeWormType().scaling;
  const wormHasAbility = (ability) => activeWormType().ability === ability;
  const growthCostForLevel = (level) =>
    Math.ceil(
      activeWormScaling().initialGrowthCost *
        activeWormScaling().growthCostMultiplier ** level,
    );
  const wormScale = () =>
    activeWormScaling().baseEntityScale *
    (1 + game.growthLevel * activeWormScaling().scalePerLevel);
  const wormBiteDamage = () =>
    activeWormScaling().baseBiteDamage *
    activeWormScaling().biteDamagePerLevel ** game.growthLevel;
  const wormDimension = (name) => WORM_SHAPE[name] * wormScale();
  const wormSegmentSpacing = () => wormDimension("segmentSpacing");
  const wormSegmentCount = () =>
    Math.floor(
      activeWormScaling().baseSegmentCount +
        game.growthLevel * activeWormScaling().segmentsPerLevel,
    );
  const wormMaximumSpeed = () =>
    activeWormScaling().baseMaximumSpeed +
    game.growthLevel * activeWormScaling().maximumSpeedPerLevel;
  const boostCapacity = () =>
    activeWormScaling().levelOneBoostDuration +
    (game.growthLevel - 1) * activeWormScaling().boostSecondsPerLevel;

  function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function hashString(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function mixHexColors(source, target, amount) {
    const sourceValue = Number.parseInt(source.slice(1), 16);
    const targetValue = Number.parseInt(target.slice(1), 16);
    const blend = clamp(amount, 0, 1);
    const channel = (shift) =>
      Math.round(
        ((sourceValue >> shift) & 255) * (1 - blend) +
          ((targetValue >> shift) & 255) * blend,
      );
    return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
  }

  function createSkyDetailTexture() {
    const width = 768;
    const height = 512;
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = width;
    textureCanvas.height = height;
    const textureContext = textureCanvas.getContext("2d");
    const random = seededRandom(hashString("red-sky-atmosphere"));

    for (let index = 0; index < 115; index += 1) {
      const x = random() * width;
      const y = random() * height;
      const streakWidth = 12 + random() * 78;
      const streakHeight = 0.7 + random() * 3.3;
      textureContext.globalAlpha = 0.035 + random() * 0.085;
      textureContext.fillStyle =
        random() > 0.46 ? palette.skyLight : palette.cloudLight;
      textureContext.beginPath();
      textureContext.ellipse(
        x,
        y,
        streakWidth,
        streakHeight,
        (random() - 0.5) * 0.08,
        0,
        TAU,
      );
      textureContext.fill();
    }

    for (let index = 0; index < 190; index += 1) {
      const radius = 0.35 + random() * 1.15;
      textureContext.globalAlpha = 0.05 + random() * 0.12;
      textureContext.fillStyle =
        random() > 0.55 ? palette.skyLight : palette.skyDark;
      textureContext.beginPath();
      textureContext.arc(random() * width, random() * height, radius, 0, TAU);
      textureContext.fill();
    }
    textureContext.globalAlpha = 1;
    return textureCanvas;
  }

  const skyDetailPattern = ctx.createPattern(createSkyDetailTexture(), "repeat");

  function createTerrainTexturePattern(material, variant) {
    const size = TERRAIN_TEXTURE_PATTERN_SIZE;
    const patternCanvas = document.createElement("canvas");
    patternCanvas.width = size;
    patternCanvas.height = size;
    const patternContext = patternCanvas.getContext("2d");
    const random = seededRandom(
      hashString(`terrain-pattern:${material}:${variant}`),
    );
    const detailCount = Math.floor((size * size) / 1500);

    for (let index = 0; index < detailCount; index += 1) {
      const x = random() * size;
      const y = random() * size;
      const radius = 0.6 + random() * 1.8;
      const tone = random();
      const dash = random() > 0.72;
      patternContext.globalAlpha = 0.2 + tone * 0.16;
      patternContext.fillStyle =
        material === BLOCK_TYPES.STONE
          ? tone > 0.52
            ? palette.stoneLight
            : palette.stoneDark
          : tone > 0.5
            ? palette.soilLight
            : palette.soilDark;
      if (material === BLOCK_TYPES.STONE) {
        patternContext.beginPath();
        patternContext.ellipse(
          x,
          y,
          radius * (dash ? 2.8 : 1.35),
          radius * 0.72,
          tone * TAU,
          0,
          TAU,
        );
        patternContext.fill();
      } else if (dash) {
        patternContext.fillRect(x, y, radius * 4, radius);
      } else {
        patternContext.beginPath();
        patternContext.arc(x, y, radius, 0, TAU);
        patternContext.fill();
      }
    }
    patternContext.globalAlpha = 1;
    return patternCanvas;
  }

  const terrainTexturePatterns = Object.freeze({
    [BLOCK_TYPES.GROUND]: Object.freeze(
      Array.from({ length: TERRAIN_TEXTURE_PATTERN_VARIANTS }, (_, variant) =>
        createTerrainTexturePattern(BLOCK_TYPES.GROUND, variant),
      ),
    ),
    [BLOCK_TYPES.STONE]: Object.freeze(
      Array.from({ length: TERRAIN_TEXTURE_PATTERN_VARIANTS }, (_, variant) =>
        createTerrainTexturePattern(BLOCK_TYPES.STONE, variant),
      ),
    ),
  });

  function createTerrainDepthTexturePattern(material, layer, variant) {
    const size = TERRAIN_TEXTURE_PATTERN_SIZE;
    const patternCanvas = document.createElement("canvas");
    patternCanvas.width = size;
    patternCanvas.height = size;
    const patternContext = patternCanvas.getContext("2d");
    const sourceBaseColor =
      material === BLOCK_TYPES.STONE ? palette.stone : palette.soil;
    const sourceLightColor =
      material === BLOCK_TYPES.STONE
        ? palette.stoneLight
        : palette.soilLight;
    const sourceDarkColor =
      material === BLOCK_TYPES.STONE ? palette.stoneDark : palette.soilDark;
    const skyBlend = TERRAIN_DEPTH_SKY_BLEND[layer.id];
    const baseColor = mixHexColors(sourceBaseColor, palette.sky, skyBlend);
    const lightColor = mixHexColors(sourceLightColor, palette.sky, skyBlend);
    const darkColor = mixHexColors(sourceDarkColor, palette.sky, skyBlend);
    const random = seededRandom(
      hashString(`terrain-depth:${material}:${layer.id}:${variant}`),
    );
    const distanceIndex = TERRAIN_DEPTH_LAYERS.indexOf(layer);
    const featureScale =
      1 + (TERRAIN_DEPTH_LAYERS.length - distanceIndex) * 0.7;
    const detailCount = Math.floor(
      (size * size) /
        (2600 + (TERRAIN_DEPTH_LAYERS.length - distanceIndex) * 900),
    );

    patternContext.fillStyle = baseColor;
    patternContext.fillRect(0, 0, size, size);
    for (let index = 0; index < detailCount; index += 1) {
      const x = random() * size;
      const y = random() * size;
      const radius = (0.8 + random() * 1.7) * featureScale;
      patternContext.globalAlpha = 0.2 + random() * 0.16;
      patternContext.fillStyle = random() > 0.5 ? lightColor : darkColor;
      if (material === BLOCK_TYPES.STONE) {
        patternContext.beginPath();
        patternContext.ellipse(
          x,
          y,
          radius * (1.4 + random() * 1.5),
          radius * 0.62,
          random() * TAU,
          0,
          TAU,
        );
        patternContext.fill();
      } else if (random() > 0.58) {
        patternContext.fillRect(x, y, radius * 3.2, Math.max(1, radius * 0.52));
      } else {
        patternContext.beginPath();
        patternContext.arc(x, y, radius, 0, TAU);
        patternContext.fill();
      }
    }
    patternContext.globalAlpha = 1;
    return patternCanvas;
  }

  const terrainDepthTexturePatterns = Object.freeze(
    Object.fromEntries(
      TERRAIN_MATERIALS
        .map((material) => [
          material,
          Object.freeze(
            Object.fromEntries(
              TERRAIN_DEPTH_LAYERS.map((layer) => [
                layer.id,
                Object.freeze(
                  Array.from(
                    { length: TERRAIN_TEXTURE_PATTERN_VARIANTS },
                    (_, variant) =>
                      ctx.createPattern(
                        createTerrainDepthTexturePattern(
                          material,
                          layer,
                          variant,
                        ),
                        "repeat",
                      ),
                  ),
                ),
              ]),
            ),
          ),
        ]),
    ),
  );

  function createFlatTiles(columns, rows, groundRow) {
    const tiles = new Uint8Array(columns * rows);
    tiles.fill(
      MATERIAL_TILE_VALUES[BLOCK_TYPES.GROUND],
      groundRow * columns,
    );
    return tiles;
  }

  function encodeMaterialRuns(tiles) {
    const materials = [];
    let index = 0;
    while (index < tiles.length) {
      const tileValue = tiles[index];
      const type = TILE_VALUE_MATERIALS[tileValue];
      if (!type) {
        index += 1;
        continue;
      }
      const start = index;
      while (index < tiles.length && tiles[index] === tileValue) index += 1;
      materials.push({ type, start, length: index - start });
    }
    return materials;
  }

  function fillTileRuns(tiles, runs, tileValue) {
    if (!Array.isArray(runs)) return;
    for (let index = 0; index + 1 < runs.length; index += 2) {
      const start = clamp(Math.floor(Number(runs[index]) || 0), 0, tiles.length);
      const length = clamp(
        Math.floor(Number(runs[index + 1]) || 0),
        0,
        tiles.length - start,
      );
      tiles.fill(tileValue, start, start + length);
    }
  }

  function decodeMaterialRuns(world) {
    const declaredColumns = Math.floor(Number(world?.columns));
    const declaredRows = Math.floor(Number(world?.rows));
    const sourceColumns = Number.isFinite(declaredColumns) && declaredColumns > 0
      ? clamp(declaredColumns, 1, WORLD_COLUMNS)
      : Number(world?.formatVersion) >= WORLD_FORMAT_VERSION
        ? WORLD_COLUMNS
        : LEGACY_WORLD_COLUMNS;
    const sourceRows = Number.isFinite(declaredRows) && declaredRows > 0
      ? clamp(declaredRows, 1, WORLD_ROWS)
      : Number(world?.formatVersion) >= WORLD_FORMAT_VERSION
        ? WORLD_ROWS
        : LEGACY_WORLD_ROWS;
    const sourceTiles = new Uint8Array(sourceColumns * sourceRows);
    if (Array.isArray(world?.materials)) {
      world.materials.forEach((run) => {
        const tileValue = MATERIAL_TILE_VALUES[run?.type];
        if (!tileValue) return;
        const start = clamp(
          Math.floor(Number(run.start) || 0),
          0,
          sourceTiles.length,
        );
        const length = clamp(
          Math.floor(Number(run.length) || 0),
          0,
          sourceTiles.length - start,
        );
        sourceTiles.fill(tileValue, start, start + length);
      });
    } else {
      // Version 1 worlds stored one numeric run array per material. Decode that
      // shape here so loading the world can migrate it to the unified format.
      fillTileRuns(
        sourceTiles,
        world?.runs,
        MATERIAL_TILE_VALUES[BLOCK_TYPES.GROUND],
      );
      fillTileRuns(
        sourceTiles,
        world?.stoneRuns,
        MATERIAL_TILE_VALUES[BLOCK_TYPES.STONE],
      );
    }

    if (sourceColumns === WORLD_COLUMNS && sourceRows === WORLD_ROWS) {
      return sourceTiles;
    }

    // Material-run indices are row-major. Copy each legacy row separately so
    // added width becomes air on the right and added depth becomes air below,
    // without shifting any existing tile coordinates.
    const tiles = new Uint8Array(WORLD_COLUMNS * WORLD_ROWS);
    const copiedColumns = Math.min(sourceColumns, WORLD_COLUMNS);
    const copiedRows = Math.min(sourceRows, WORLD_ROWS);
    for (let row = 0; row < copiedRows; row += 1) {
      const sourceOffset = row * sourceColumns;
      const targetOffset = row * WORLD_COLUMNS;
      tiles.set(
        sourceTiles.subarray(sourceOffset, sourceOffset + copiedColumns),
        targetOffset,
      );
    }
    return tiles;
  }

  function countMaterialTiles(world, type) {
    if (!Array.isArray(world?.materials)) return 0;
    return world.materials.reduce(
      (total, run) =>
        run?.type === type ? total + (Number(run.length) || 0) : total,
      0,
    );
  }

  function sanitizeMaterialRuns(materials) {
    if (!Array.isArray(materials)) return [];
    const tileCount = WORLD_COLUMNS * WORLD_ROWS;
    return materials.flatMap((run) => {
      if (!MATERIAL_TILE_VALUES[run?.type]) return [];
      const start = clamp(
        Math.floor(Number(run.start) || 0),
        0,
        tileCount,
      );
      const length = clamp(
        Math.floor(Number(run.length) || 0),
        0,
        tileCount - start,
      );
      return length > 0 ? [{ type: run.type, start, length }] : [];
    });
  }

  function distanceTransform1D(values, length, output, sites, boundaries) {
    const unreachable = 1e15;
    let envelopeSize = -1;

    for (let position = 0; position < length; position += 1) {
      if (values[position] >= unreachable) continue;
      let intersection = -Infinity;
      while (envelopeSize >= 0) {
        const previous = sites[envelopeSize];
        intersection =
          (values[position] + position * position -
            values[previous] - previous * previous) /
          (2 * (position - previous));
        if (intersection > boundaries[envelopeSize]) break;
        envelopeSize -= 1;
      }
      envelopeSize += 1;
      sites[envelopeSize] = position;
      boundaries[envelopeSize] =
        envelopeSize === 0 ? -Infinity : intersection;
      boundaries[envelopeSize + 1] = Infinity;
    }

    if (envelopeSize < 0) {
      output.fill(unreachable, 0, length);
      return;
    }

    let envelopeIndex = 0;
    for (let position = 0; position < length; position += 1) {
      while (boundaries[envelopeIndex + 1] < position) {
        envelopeIndex += 1;
      }
      const site = sites[envelopeIndex];
      const delta = position - site;
      output[position] = delta * delta + values[site];
    }
  }

  function squaredDistanceTransform(source, width, height) {
    const intermediate = new Float64Array(width * height);
    const result = new Float64Array(width * height);
    const maximumLength = Math.max(width, height);
    const values = new Float64Array(maximumLength);
    const transformed = new Float64Array(maximumLength);
    const sites = new Int32Array(maximumLength);
    const boundaries = new Float64Array(maximumLength + 1);

    for (let row = 0; row < height; row += 1) {
      const offset = row * width;
      for (let column = 0; column < width; column += 1) {
        values[column] = source[offset + column];
      }
      distanceTransform1D(values, width, transformed, sites, boundaries);
      for (let column = 0; column < width; column += 1) {
        intermediate[offset + column] = transformed[column];
      }
    }

    for (let column = 0; column < width; column += 1) {
      for (let row = 0; row < height; row += 1) {
        values[row] = intermediate[row * width + column];
      }
      distanceTransform1D(values, height, transformed, sites, boundaries);
      for (let row = 0; row < height; row += 1) {
        result[row * width + column] = transformed[row];
      }
    }
    return result;
  }

  function createStoneSignedDistanceField(
    tiles,
    tileClusterIds,
    columns,
    size,
    bounds,
  ) {
    const width = bounds.maxColumn - bounds.minColumn + 3;
    const height = bounds.maxRow - bounds.minRow + 3;
    const unreachable = 1e15;
    const stoneSources = new Float64Array(width * height);
    const airSources = new Float64Array(width * height);
    const clusterIds = new Int32Array(width * height);
    stoneSources.fill(unreachable);
    clusterIds.fill(-1);
    let stoneCount = 0;

    for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
      for (
        let column = bounds.minColumn;
        column <= bounds.maxColumn;
        column += 1
      ) {
        const tileIndex = row * columns + column;
        const fieldIndex =
          (row - bounds.minRow + 1) * width +
          column - bounds.minColumn + 1;
        if (tiles[tileIndex] === MATERIAL_TILE_VALUES[BLOCK_TYPES.STONE]) {
          stoneSources[fieldIndex] = 0;
          airSources[fieldIndex] = unreachable;
          clusterIds[fieldIndex] = tileClusterIds[tileIndex];
          stoneCount += 1;
        }
      }
    }
    if (stoneCount === 0) return null;

    const distanceToStone = squaredDistanceTransform(
      stoneSources,
      width,
      height,
    );
    const distanceToAir = squaredDistanceTransform(
      airSources,
      width,
      height,
    );
    const values = new Float32Array(width * height);
    for (let index = 0; index < values.length; index += 1) {
      if (stoneSources[index] === 0) {
        values[index] =
          -(Math.sqrt(distanceToAir[index]) - 0.5) * size;
      } else {
        values[index] =
          (Math.sqrt(distanceToStone[index]) - 0.5) * size;
      }
    }
    return {
      values,
      clusterIds,
      width,
      height,
      size,
      originColumn: bounds.minColumn,
      originRow: bounds.minRow,
      periodicCenterX:
        (bounds.minColumn + bounds.maxColumn + 1) * size * 0.5,
    };
  }

  function sampleStoneSignedDistanceAtBaseX(field, x, y) {
    const rawGridX = x / field.size - field.originColumn + 0.5;
    const rawGridY = y / field.size - field.originRow + 0.5;
    const gridX = clamp(rawGridX, 0, field.width - 1);
    const gridY = clamp(rawGridY, 0, field.height - 1);
    const left = Math.min(Math.floor(gridX), field.width - 2);
    const top = Math.min(Math.floor(gridY), field.height - 2);
    const amountX = gridX - left;
    const amountY = gridY - top;
    const topLeft = field.values[top * field.width + left];
    const topRight = field.values[top * field.width + left + 1];
    const bottomLeft = field.values[(top + 1) * field.width + left];
    const bottomRight = field.values[(top + 1) * field.width + left + 1];
    const fieldDistance = lerp(
      lerp(topLeft, topRight, amountX),
      lerp(bottomLeft, bottomRight, amountX),
      amountY,
    );
    const outsideX = rawGridX - gridX;
    const outsideY = rawGridY - gridY;
    return fieldDistance + magnitude(outsideX, outsideY) * field.size;
  }

  function sampleStoneSignedDistance(field, x, y) {
    const canonicalX = wrapWorldX(x);
    return sampleStoneSignedDistanceAtBaseX(
      field,
      nearestPeriodicWorldX(canonicalX, field.periodicCenterX),
      y,
    );
  }

  function stoneSignedDistanceGradient(field, x, y) {
    const step = field.size * 0.35;
    const gradientX =
      sampleStoneSignedDistance(field, x + step, y) -
      sampleStoneSignedDistance(field, x - step, y);
    const gradientY =
      sampleStoneSignedDistance(field, x, y + step) -
      sampleStoneSignedDistance(field, x, y - step);
    const length = magnitude(gradientX, gradientY) || 1;
    return { x: gradientX / length, y: gradientY / length };
  }

  function marchingStoneContourSegments(field) {
    const segmentsByCluster = new Map();
    const edgeCorners = [
      [0, 1],
      [1, 2],
      [3, 2],
      [0, 3],
    ];
    const caseSegments = [
      [],
      [[0, 3, 0]],
      [[0, 1, 1]],
      [[3, 1, 0]],
      [[1, 2, 2]],
      [[0, 3, 0], [1, 2, 2]],
      [[0, 2, 1]],
      [[3, 2, 0]],
      [[2, 3, 3]],
      [[0, 2, 0]],
      [[0, 1, 1], [2, 3, 3]],
      [[1, 2, 0]],
      [[1, 3, 2]],
      [[0, 1, 0]],
      [[0, 3, 1]],
      [],
    ];

    for (let row = 0; row < field.height - 1; row += 1) {
      for (let column = 0; column < field.width - 1; column += 1) {
        const cornerIndices = [
          row * field.width + column,
          row * field.width + column + 1,
          (row + 1) * field.width + column + 1,
          (row + 1) * field.width + column,
        ];
        const values = cornerIndices.map((index) => field.values[index]);
        const contourCase = values.reduce(
          (mask, value, index) => mask | (value < 0 ? 1 << index : 0),
          0,
        );
        const definitions = caseSegments[contourCase];
        if (definitions.length === 0) continue;
        const cornerPoints = [
          {
            x: (field.originColumn + column - 0.5) * field.size,
            y: (field.originRow + row - 0.5) * field.size,
          },
          {
            x: (field.originColumn + column + 0.5) * field.size,
            y: (field.originRow + row - 0.5) * field.size,
          },
          {
            x: (field.originColumn + column + 0.5) * field.size,
            y: (field.originRow + row + 0.5) * field.size,
          },
          {
            x: (field.originColumn + column - 0.5) * field.size,
            y: (field.originRow + row + 0.5) * field.size,
          },
        ];

        const pointOnEdge = (edge) => {
          const [firstCorner, secondCorner] = edgeCorners[edge];
          const firstValue = values[firstCorner];
          const secondValue = values[secondCorner];
          const amount = clamp(
            firstValue / (firstValue - secondValue || 1),
            0,
            1,
          );
          return {
            x: lerp(
              cornerPoints[firstCorner].x,
              cornerPoints[secondCorner].x,
              amount,
            ),
            y: lerp(
              cornerPoints[firstCorner].y,
              cornerPoints[secondCorner].y,
              amount,
            ),
          };
        };

        definitions.forEach(([firstEdge, secondEdge, stoneCorner]) => {
          const clusterId = field.clusterIds[cornerIndices[stoneCorner]];
          if (clusterId < 0) return;
          const segment = {
            first: pointOnEdge(firstEdge),
            second: pointOnEdge(secondEdge),
          };
          const bucket = segmentsByCluster.get(clusterId);
          if (bucket) bucket.push(segment);
          else segmentsByCluster.set(clusterId, [segment]);
        });
      }
    }
    return segmentsByCluster;
  }

  function stoneContourPointKey(point) {
    return `${Math.round(point.x * 1000)}:${Math.round(point.y * 1000)}`;
  }

  function traceStoneContourSegments(segments) {
    const endpoints = new Map();
    segments.forEach((segment, segmentIndex) => {
      [segment.first, segment.second].forEach((point, endpointIndex) => {
        const key = stoneContourPointKey(point);
        const bucket = endpoints.get(key);
        const reference = { segmentIndex, endpointIndex };
        if (bucket) bucket.push(reference);
        else endpoints.set(key, [reference]);
      });
    });
    const visited = new Uint8Array(segments.length);
    const contours = [];

    for (let seed = 0; seed < segments.length; seed += 1) {
      if (visited[seed]) continue;
      const seedSegment = segments[seed];
      const firstDegree =
        endpoints.get(stoneContourPointKey(seedSegment.first))?.length || 0;
      let segmentIndex = seed;
      let endpointIndex = firstDegree === 1 ? 0 : 1;
      const points = [];
      let closed = false;

      while (!visited[segmentIndex]) {
        visited[segmentIndex] = 1;
        const segment = segments[segmentIndex];
        const entry = endpointIndex === 0 ? segment.first : segment.second;
        const exit = endpointIndex === 0 ? segment.second : segment.first;
        if (points.length === 0) points.push(entry);
        points.push(exit);
        const nextReferences =
          endpoints.get(stoneContourPointKey(exit)) || [];
        const next = nextReferences.find(
          (reference) => !visited[reference.segmentIndex],
        );
        if (!next) {
          closed =
            stoneContourPointKey(points[0]) ===
            stoneContourPointKey(points[points.length - 1]);
          break;
        }
        segmentIndex = next.segmentIndex;
        endpointIndex = next.endpointIndex;
      }

      if (closed) points.pop();
      if (points.length >= 2) contours.push({ points, closed });
    }
    return contours;
  }

  function smoothStoneContour(
    points,
    closed,
    passes = STONE_RULES.surfaceSmoothingPasses,
  ) {
    let smoothed = points.map((point) => ({ ...point }));
    for (let pass = 0; pass < passes; pass += 1) {
      if (smoothed.length < 3) break;
      const next = closed ? [] : [{ ...smoothed[0] }];
      const sectionCount = closed ? smoothed.length : smoothed.length - 1;
      for (let index = 0; index < sectionCount; index += 1) {
        const first = smoothed[index];
        const second = smoothed[(index + 1) % smoothed.length];
        next.push({
          x: first.x * 0.75 + second.x * 0.25,
          y: first.y * 0.75 + second.y * 0.25,
        });
        next.push({
          x: first.x * 0.25 + second.x * 0.75,
          y: first.y * 0.25 + second.y * 0.75,
        });
      }
      if (!closed) next.push({ ...smoothed[smoothed.length - 1] });
      smoothed = next;
    }
    return smoothed;
  }

  function projectStoneContourOutside(field, point) {
    const projected = { ...point };
    for (let iteration = 0; iteration < 4; iteration += 1) {
      const distance = sampleStoneSignedDistance(field, projected.x, projected.y);
      if (distance >= -0.01) break;
      const normal = stoneSignedDistanceGradient(
        field,
        projected.x,
        projected.y,
      );
      const correction = Math.min(field.size, -distance + 0.05);
      projected.x += normal.x * correction;
      projected.y += normal.y * correction;
    }
    return projected;
  }

  function createSmoothStoneSurfacePath(points, clusterId, id, field) {
    const cleanPoints = [];
    points.forEach((point) => {
      const previous = cleanPoints[cleanPoints.length - 1];
      if (
        !previous ||
        magnitude(point.x - previous.x, point.y - previous.y) > 0.1
      ) {
        cleanPoints.push(point);
      }
    });
    if (cleanPoints.length < 2) return null;
    if (cleanPoints[0].x > cleanPoints[cleanPoints.length - 1].x) {
      cleanPoints.reverse();
    }

    let distance = 0;
    const samples = cleanPoints.map((point, index) => {
      const previous = cleanPoints[Math.max(0, index - 1)];
      const next = cleanPoints[Math.min(cleanPoints.length - 1, index + 1)];
      let unitX = next.x - previous.x;
      let unitY = next.y - previous.y;
      const tangentLength = magnitude(unitX, unitY) || 1;
      unitX /= tangentLength;
      unitY /= tangentLength;
      if (index > 0) {
        distance += magnitude(
          point.x - cleanPoints[index - 1].x,
          point.y - cleanPoints[index - 1].y,
        );
      }
      const gradient = stoneSignedDistanceGradient(field, point.x, point.y);
      let normalX = unitY;
      let normalY = -unitX;
      if (normalX * gradient.x + normalY * gradient.y < 0) {
        normalX *= -1;
        normalY *= -1;
      }
      return {
        x: point.x,
        y: point.y,
        distance,
        unitX,
        unitY,
        normalX,
        normalY,
      };
    });
    const bounds = samples.reduce(
      (result, sample) => ({
        minX: Math.min(result.minX, sample.x),
        maxX: Math.max(result.maxX, sample.x),
        minY: Math.min(result.minY, sample.y),
        maxY: Math.max(result.maxY, sample.y),
      }),
      {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity,
      },
    );
    const minimumStandaloneSpan =
      field.size * STONE_RULES.surfaceMinimumStandaloneBlocks;
    if (
      distance <= minimumStandaloneSpan + 0.001 ||
      bounds.maxX - bounds.minX <= minimumStandaloneSpan + 0.001
    ) {
      return null;
    }
    return {
      id,
      clusterId,
      kind: "smooth-contour",
      samples,
      length: distance,
      bounds,
    };
  }

  function stoneContourPointTouchesAir(
    point,
    normal,
    tiles,
    columns,
    rows,
    size,
  ) {
    // The signed-distance field deliberately treats every non-stone material
    // as empty so it can provide one continuous collision outline. Surface
    // eligibility is stricter: sample just beyond that outline and retain the
    // point only when the neighboring map block is actually air.
    const sampleDistance = size * 0.35;
    const column = Math.floor(
      (point.x + normal.x * sampleDistance) / size,
    );
    const row = Math.floor(
      (point.y + normal.y * sampleDistance) / size,
    );
    return (
      column >= 0 &&
      column < columns &&
      row >= 0 &&
      row < rows &&
      tiles[row * columns + column] === 0
    );
  }

  function upwardStoneContourRuns(
    points,
    closed,
    field,
    tiles,
    columns,
    rows,
  ) {
    const normals = points.map((point) =>
      stoneSignedDistanceGradient(field, point.x, point.y),
    );
    const airExposed = points.map((point, index) =>
      stoneContourPointTouchesAir(
        point,
        normals[index],
        tiles,
        columns,
        rows,
        field.size,
      ),
    );
    const eligible = normals.map(
      (normal, index) =>
        airExposed[index] &&
        normal.y < -STONE_RULES.surfaceMinimumUpwardNormal,
    );
    if (!eligible.some(Boolean)) return [];

    // Marching contours around a short step contain a small neutral section
    // between its two upward-facing arcs. Keep that section in the same path
    // when it never turns downward and is short enough to remain a local
    // surface estimate. Long walls and undersides still split the path.
    const originalEligibility = [...eligible];
    const maximumBridgeLength =
      STONE_RULES.surfaceNeutralBridgeBlocks * field.size;
    const lastBridgeStart = closed ? points.length : points.length - 1;
    for (let start = 0; start < lastBridgeStart; start += 1) {
      if (!originalEligibility[start]) continue;
      let cursor = start + 1;
      const gap = [];
      let gapLength = 0;
      let previous = points[start];
      while (
        cursor < start + points.length &&
        (closed || cursor < points.length)
      ) {
        const index = cursor % points.length;
        const point = points[index];
        gapLength += magnitude(point.x - previous.x, point.y - previous.y);
        previous = point;
        if (originalEligibility[index]) {
          if (
            gap.length > 0 &&
            gapLength <= maximumBridgeLength &&
            gap.every(
              (gapIndex) =>
                airExposed[gapIndex] &&
                normals[gapIndex].y <=
                STONE_RULES.surfaceMinimumUpwardNormal,
            )
          ) {
            gap.forEach((gapIndex) => {
              eligible[gapIndex] = true;
            });
          }
          break;
        }
        gap.push(index);
        cursor += 1;
      }
    }
    const runs = [];
    let current = [];
    const startIndex = closed
      ? (eligible.findIndex((value) => !value) + 1) % points.length
      : 0;
    const count = closed ? points.length : points.length;

    for (let offset = 0; offset < count; offset += 1) {
      const index = (startIndex + offset) % points.length;
      if (eligible[index]) {
        current.push(points[index]);
      } else if (current.length > 0) {
        runs.push(current);
        current = [];
      }
    }
    if (current.length > 0) runs.push(current);
    return runs;
  }

  function createStoneSurfaceContours(tiles, columns, rows, size) {
    const tileCount = columns * rows;
    const stoneTileValue = MATERIAL_TILE_VALUES[BLOCK_TYPES.STONE];
    if (!tiles.includes(stoneTileValue)) {
      return {
        clusters: [],
        clusterIds: null,
        distanceField: null,
        paths: [],
        segmentsByColumn: Array.from({ length: columns }, () => []),
      };
    }
    const clusterIds = new Int32Array(tileCount);
    let queue = null;
    clusterIds.fill(-1);
    const clusters = [];
    const stoneBounds = {
      minColumn: columns,
      maxColumn: 0,
      minRow: rows,
      maxRow: 0,
    };

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const tileIndex = row * columns + column;
        if (
          tiles[tileIndex] !== stoneTileValue ||
          clusterIds[tileIndex] !== -1
        ) {
          continue;
        }
        const cluster = {
          id: clusters.length,
          blockCount: 0,
          surfacePaths: [],
        };
        let readIndex = 0;
        let writeIndex = 1;
        if (!queue) queue = new Int32Array(tileCount);
        queue[0] = tileIndex;
        clusterIds[tileIndex] = cluster.id;
        while (readIndex < writeIndex) {
          const currentIndex = queue[readIndex];
          readIndex += 1;
          cluster.blockCount += 1;
          const currentColumn = currentIndex % columns;
          const currentRow = Math.floor(currentIndex / columns);
          stoneBounds.minColumn = Math.min(stoneBounds.minColumn, currentColumn);
          stoneBounds.maxColumn = Math.max(stoneBounds.maxColumn, currentColumn);
          stoneBounds.minRow = Math.min(stoneBounds.minRow, currentRow);
          stoneBounds.maxRow = Math.max(stoneBounds.maxRow, currentRow);
          CARDINAL_BLOCK_OFFSETS.forEach(([columnOffset, rowOffset]) => {
            const neighborColumn = currentColumn + columnOffset;
            const neighborRow = currentRow + rowOffset;
            if (
              neighborColumn < 0 ||
              neighborColumn >= columns ||
              neighborRow < 0 ||
              neighborRow >= rows
            ) {
              return;
            }
            const neighborIndex = neighborRow * columns + neighborColumn;
            if (
              clusterIds[neighborIndex] !== -1 ||
              tiles[neighborIndex] !== stoneTileValue
            ) {
              return;
            }
            clusterIds[neighborIndex] = cluster.id;
            queue[writeIndex] = neighborIndex;
            writeIndex += 1;
          });
        }
        clusters.push(cluster);
      }
    }

    const field = clusters.length > 0
      ? createStoneSignedDistanceField(
          tiles,
          clusterIds,
          columns,
          size,
          stoneBounds,
        )
      : null;
    const paths = [];
    if (field) {
      const segmentsByCluster = marchingStoneContourSegments(field);
      segmentsByCluster.forEach((segments, clusterId) => {
        traceStoneContourSegments(segments).forEach((contour) => {
          const smoothed = smoothStoneContour(
            contour.points,
            contour.closed,
          ).map((point) => projectStoneContourOutside(field, point));
          upwardStoneContourRuns(
            smoothed,
            contour.closed,
            field,
            tiles,
            columns,
            rows,
          ).forEach(
            (run) => {
              const path = createSmoothStoneSurfacePath(
                run,
                clusterId,
                paths.length,
                field,
              );
              if (!path) return;
              paths.push(path);
              clusters[clusterId].surfacePaths.push(path);
            },
          );
        });
      });
    }

    const segmentsByColumn = Array.from({ length: columns }, () => []);
    paths.forEach((path) => {
      for (let index = 0; index < path.samples.length - 1; index += 1) {
        const first = path.samples[index];
        const second = path.samples[index + 1];
        const segmentFirstColumn = clamp(
          Math.floor(Math.min(first.x, second.x) / size),
          0,
          columns - 1,
        );
        const segmentLastColumn = clamp(
          Math.floor(Math.max(first.x, second.x) / size),
          0,
          columns - 1,
        );
        const reference = { path, index };
        for (
          let column = segmentFirstColumn;
          column <= segmentLastColumn;
          column += 1
        ) {
          segmentsByColumn[column].push(reference);
        }
      }
    });
    return {
      clusters,
      clusterIds,
      distanceField: field,
      paths,
      segmentsByColumn,
    };
  }

  function normalizeCustomWorld(world) {
    if (!world || typeof world.id !== "string" || world.id === DEFAULT_WORLD_ID) return null;
    const spawn = world.spawn || {};
    const canKeepMaterialIndices =
      Array.isArray(world.materials) &&
      Number(world.columns) === WORLD_COLUMNS &&
      Number(world.rows) > 0 &&
      Number(world.rows) <= WORLD_ROWS;
    return {
      id: world.id,
      name: String(world.name || "Untitled World").slice(0, 40),
      builtin: false,
      spawn: {
        column: clamp(Math.floor(Number(spawn.column) || 0), 0, WORLD_COLUMNS - 1),
        row: clamp(Math.floor(Number(spawn.row) || 0), 0, WORLD_ROWS - 1),
      },
      formatVersion: WORLD_FORMAT_VERSION,
      columns: WORLD_COLUMNS,
      rows: WORLD_ROWS,
      materials: canKeepMaterialIndices
        ? sanitizeMaterialRuns(world.materials)
        : encodeMaterialRuns(decodeMaterialRuns(world)),
      updatedAt: Number(world.updatedAt) || 0,
    };
  }

  function loadCustomWorlds() {
    try {
      const stored = JSON.parse(window.localStorage.getItem(WORLD_STORAGE_KEY) || "[]");
      customWorlds = Array.isArray(stored)
        ? stored.map(normalizeCustomWorld).filter(Boolean)
        : [];
      const needsMigration = Array.isArray(stored) && stored.some(
        (world) =>
          world &&
          world.id !== DEFAULT_WORLD_ID &&
          (!Array.isArray(world.materials) ||
            world.formatVersion !== WORLD_FORMAT_VERSION ||
            world.columns !== WORLD_COLUMNS ||
            world.rows !== WORLD_ROWS ||
            Object.hasOwn(world, "runs") ||
            Object.hasOwn(world, "stoneRuns")),
      );
      if (needsMigration) persistCustomWorlds();
    } catch (_error) {
      customWorlds = [];
    }
  }

  function persistCustomWorlds() {
    try {
      window.localStorage.setItem(WORLD_STORAGE_KEY, JSON.stringify(customWorlds));
      return true;
    } catch (_error) {
      return false;
    }
  }

  function getWorldById(worldId) {
    if (worldId === DEFAULT_WORLD_ID) return DEFAULT_WORLD;
    return customWorlds.find((world) => world.id === worldId) || null;
  }

  function buildMap(worldDefinition = DEFAULT_WORLD) {
    const columns = WORLD_COLUMNS;
    const rows = WORLD_ROWS;
    const tiles = worldDefinition.builtin
      ? createFlatTiles(columns, rows, WORLD_GROUND_ROW)
      : decodeMaterialRuns(worldDefinition);
    const stoneGeometry = createStoneSurfaceContours(
      tiles,
      columns,
      rows,
      BLOCK_SIZE,
    );

    game.map = {
      cellSize: BLOCK_SIZE,
      columns,
      rows,
      tiles,
      tunnelExpiryBuckets: new Map(),
      nextTunnelExpiryTick: Infinity,
      acidTunnelDecayRecords: new Map(),
      stoneClusterIds: stoneGeometry.clusterIds,
      stoneClusters: stoneGeometry.clusters,
      stoneDistanceField: stoneGeometry.distanceField,
      stoneSurfacePaths: stoneGeometry.paths,
      stoneSurfaceSegmentsByColumn: stoneGeometry.segmentsByColumn,
      targetCandidateSummaries: new Map(),
    };
    game.activeWorldId = worldDefinition.id;
    game.activeWorldName = worldDefinition.name;
    game.spawn.x = (worldDefinition.spawn.column + 0.5) * BLOCK_SIZE;
    game.spawn.y = (worldDefinition.spawn.row + 0.5) * BLOCK_SIZE;
    game.spawn.heading = -0.48;
    game.groundY = WORLD_GROUND_ROW * BLOCK_SIZE;
    game.minimapMapRevision += 1;
    game.minimapTerrainRevision += 1;
  }

  function getBlockAtGrid(column, row) {
    if (
      game.map.columns <= 0 ||
      row < 0 ||
      row >= game.map.rows
    ) {
      return null;
    }
    const wrappedColumn = wrapWorldColumn(column);
    const index = row * game.map.columns + wrappedColumn;
    const tileValue = game.map.tiles[index];
    const type = TILE_VALUE_MATERIALS[tileValue] || BLOCK_TYPES.AIR;
    const baseTexture =
      type === BLOCK_TYPES.GROUND
        ? BLOCK_TEXTURES.SOIL
        : type === BLOCK_TYPES.STONE
          ? BLOCK_TEXTURES.STONE
          : null;
    return {
      row,
      column: wrappedColumn,
      type,
      baseTexture,
      texture:
        tileValue === TUNNELED_GROUND_TILE_VALUE
          ? game.map.acidTunnelDecayRecords.has(index)
            ? BLOCK_TEXTURES.ACID_TUNNELED_SOIL
            : BLOCK_TEXTURES.TUNNELED_SOIL
          : baseTexture,
      stoneClusterId: game.map.stoneClusterIds?.[index] ?? -1,
    };
  }

  function getBlockAtWorld(x, y) {
    return getBlockAtGrid(
      Math.floor(x / game.map.cellSize),
      Math.floor(y / game.map.cellSize),
    );
  }

  function nearestStoneBlock(x, y, searchRadius) {
    const size = game.map.cellSize;
    const minimumColumn = Math.floor((x - searchRadius) / size);
    const maximumColumn = Math.floor((x + searchRadius) / size);
    const minimumRow = clamp(
      Math.floor((y - searchRadius) / size),
      0,
      game.map.rows - 1,
    );
    const maximumRow = clamp(
      Math.floor((y + searchRadius) / size),
      0,
      game.map.rows - 1,
    );
    let nearestBlock = null;
    let nearestDistanceSquared = Infinity;
    for (let row = minimumRow; row <= maximumRow; row += 1) {
      for (let column = minimumColumn; column <= maximumColumn; column += 1) {
        const block = getBlockAtGrid(column, row);
        if (block?.type !== BLOCK_TYPES.STONE) continue;
        const nearestX = clamp(x, column * size, (column + 1) * size);
        const nearestY = clamp(y, row * size, (row + 1) * size);
        const deltaX = x - nearestX;
        const deltaY = y - nearestY;
        const distanceSquared = deltaX * deltaX + deltaY * deltaY;
        if (distanceSquared >= nearestDistanceSquared) continue;
        nearestDistanceSquared = distanceSquared;
        nearestBlock = block;
      }
    }
    return nearestBlock;
  }

  function headIsInGround() {
    return getBlockAtWorld(game.head.x, game.head.y)?.type === BLOCK_TYPES.GROUND;
  }

  function targetCandidateAt(column, row, type) {
    const tileValue = game.map.tiles[row * game.map.columns + column];
    const candidateType = TILE_VALUE_MATERIALS[tileValue] || BLOCK_TYPES.AIR;
    if (candidateType !== type) return null;
    const x = (column + 0.5) * BLOCK_SIZE;
    const y = (row + 0.5) * BLOCK_SIZE;
    const dx = x - game.spawn.x;
    const dy = y - game.spawn.y;
    if (dx * dx + dy * dy < 180 * 180) return null;
    return { row, column };
  }

  function collectTargetCandidateSummaries() {
    if (game.map.targetCandidateSummaries.size > 0) return;

    const summaries = new Map([
      [BLOCK_TYPES.GROUND, { count: 0, nearby: [] }],
      [BLOCK_TYPES.AIR, { count: 0, nearby: [] }],
    ]);
    for (let row = 4; row < game.map.rows - 4; row += 1) {
      for (let column = 4; column < game.map.columns - 4; column += 1) {
        const tileIndex = row * game.map.columns + column;
        const tileValue = game.map.tiles[tileIndex];
        const materialType = tileValue === 0
          ? BLOCK_TYPES.AIR
          : TILE_VALUE_MATERIALS[tileValue];
        const type =
          materialType === BLOCK_TYPES.GROUND ||
          materialType === BLOCK_TYPES.AIR
            ? materialType
            : null;
        if (!type) continue;
        const x = (column + 0.5) * BLOCK_SIZE;
        const y = (row + 0.5) * BLOCK_SIZE;
        const dx = x - game.spawn.x;
        const dy = y - game.spawn.y;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared < 180 ** 2) continue;
        const summary = summaries.get(type);
        summary.count += 1;
        if (distanceSquared >= 220 ** 2 && distanceSquared <= 1050 ** 2) {
          summary.nearby.push({ row, column });
        }
      }
    }
    game.map.targetCandidateSummaries = summaries;
  }

  function collectTargetCandidateSummary(type) {
    collectTargetCandidateSummaries();
    return game.map.targetCandidateSummaries.get(type) || {
      count: 0,
      nearby: [],
    };
  }

  function takeRandomCandidate(pool, random) {
    const index = Math.floor(random() * pool.length);
    const candidate = pool[index];
    pool[index] = pool[pool.length - 1];
    pool.pop();
    return candidate;
  }

  function createEnemyTarget(kind, x, y, regionType, random) {
    const definition = ENEMY_DEFINITIONS[kind];
    const moveSpeed = ENEMY_MOTION.moveSpeed * definition.sizeScale;
    const angle = random() * TAU;
    const turnAmount =
      (random() * 2 - 1) * ENEMY_MOTION.maximumTurnAngle;
    const turnDuration = Math.abs(turnAmount) / ENEMY_MOTION.turnSpeed;
    const animationProgress = random() * 2;
    const target = {
      id: game.nextTargetId++,
      kind,
      x,
      y,
      acidPreviousX: x,
      acidPreviousY: y,
      angle,
      radius: definition.radius,
      sizeScale: definition.sizeScale,
      scoreValue: definition.score,
      health: definition.health,
      maxHealth: definition.health,
      healthBarTimer: 0,
      biteBounceCooldown: 0,
      boostLatchHitboxDisabled: false,
      regionType,
      movementMode:
        regionType === BLOCK_TYPES.GROUND ? "turning" : "falling",
      turnDirection: turnAmount < 0 ? -1 : 1,
      turnRemaining: Math.abs(turnAmount),
      moveRemaining:
        moveSpeed *
        turnDuration *
        ENEMY_MOTION.moveToTurnDurationRatio,
      vx: regionType === BLOCK_TYPES.AIR
        ? Math.cos(angle) * moveSpeed * 0.72
        : 0,
      vy: 0,
      burrowRemaining: 0,
      animationProgress,
      animationFrame: Math.floor(animationProgress),
    };
    if (kind === ENEMY_TYPES.RABBIT) {
      initializeRabbitTarget(target, random);
    } else if (definition.flightBehavior === "dragonfly") {
      initializeDragonflyTarget(target, random);
    } else if (definition.flightBehavior === "vulture") {
      initializeVultureTarget(target, random);
    }
    return target;
  }

  function createEnemySpawnKinds(targetCount, random) {
    const allocations = ENEMY_SPAWN_RULES.weights.map((entry) => {
      const exactCount = entry.weight * targetCount;
      return {
        kind: entry.kind,
        count: Math.floor(exactCount),
        remainder: exactCount - Math.floor(exactCount),
      };
    });
    let assignedCount = allocations.reduce(
      (total, allocation) => total + allocation.count,
      0,
    );
    while (assignedCount < targetCount) {
      let nextAllocation = allocations[0];
      allocations.forEach((allocation) => {
        if (allocation.remainder > nextAllocation.remainder) {
          nextAllocation = allocation;
        }
      });
      nextAllocation.count += 1;
      nextAllocation.remainder = -1;
      assignedCount += 1;
    }

    const kinds = allocations.flatMap((allocation) =>
      Array.from({ length: allocation.count }, () => allocation.kind),
    );
    for (let index = kinds.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [kinds[index], kinds[swapIndex]] = [kinds[swapIndex], kinds[index]];
    }
    return kinds;
  }

  function buildTargets() {
    let candidateSummary = collectTargetCandidateSummary(BLOCK_TYPES.GROUND);
    let regionType = BLOCK_TYPES.GROUND;
    if (candidateSummary.count === 0) {
      candidateSummary = collectTargetCandidateSummary(BLOCK_TYPES.AIR);
      regionType = BLOCK_TYPES.AIR;
    }

    const targetCount = Math.min(
      candidateSummary.count,
      clamp(
        Math.round(
          candidateSummary.count / ENEMY_SPAWN_RULES.candidateDivisor,
        ),
        ENEMY_SPAWN_RULES.minimumCount,
        ENEMY_SPAWN_RULES.maximumCount,
      ),
    );
    const random = seededRandom(
      hashString(`${game.activeWorldId}:${candidateSummary.count}:enemies`),
    );
    const selected = [];
    const selectedKeys = new Set();
    const nearby = candidateSummary.nearby.slice();

    while (
      selected.length < Math.min(ENEMY_SPAWN_RULES.nearbyCount, targetCount) &&
      nearby.length > 0
    ) {
      const candidate = takeRandomCandidate(nearby, random);
      const key = candidate.row * game.map.columns + candidate.column;
      if (selectedKeys.has(key)) continue;
      selectedKeys.add(key);
      selected.push(candidate);
    }

    const randomAttemptLimit = Math.max(2000, targetCount * 200);
    for (
      let attempt = 0;
      selected.length < targetCount && attempt < randomAttemptLimit;
      attempt += 1
    ) {
      const column = 4 + Math.floor(random() * (game.map.columns - 8));
      const row = 4 + Math.floor(random() * (game.map.rows - 8));
      const candidate = targetCandidateAt(column, row, regionType);
      if (!candidate) continue;
      const key = row * game.map.columns + column;
      if (selectedKeys.has(key)) continue;
      selectedKeys.add(key);
      selected.push(candidate);
    }

    searchCandidates: for (
      let row = 4;
      selected.length < targetCount && row < game.map.rows - 4;
      row += 1
    ) {
      for (let column = 4; column < game.map.columns - 4; column += 1) {
        const candidate = targetCandidateAt(column, row, regionType);
        if (!candidate) continue;
        const key = row * game.map.columns + column;
        if (selectedKeys.has(key)) continue;
        selectedKeys.add(key);
        selected.push(candidate);
        if (selected.length >= targetCount) break searchCandidates;
      }
    }

    game.nextTargetId = 0;
    const spawnKinds = createEnemySpawnKinds(targetCount, random);
    game.targets = selected.map((block, index) =>
      createEnemyTarget(
        spawnKinds[index],
        (block.column + 0.5) * BLOCK_SIZE,
        (block.row + 0.5) * BLOCK_SIZE,
        regionType,
        random,
      ),
    );
    game.targets.forEach((target) => keepEnemyInsideWorld(target));
    game.capturedTargets = [];
    game.targetsEaten = 0;
    game.totalTargets = game.targets.length;
  }

  function buildScenery() {
    const random = seededRandom(83027 + Math.round(game.width));
    game.clouds = [];

    const cloudCount = Math.max(3, Math.ceil(game.width / 380));
    for (let index = 0; index < cloudCount; index += 1) {
      const distance = random();
      game.clouds.push({
        x: ((index + 0.4) / cloudCount) * game.width + random() * 100,
        y: 75 + random() * Math.max(60, game.groundY - 170),
        width: 85 + random() * 135,
        heightScale: 0.72 + random() * 0.5,
        speed: 2 + random() * 5,
        alpha: 0.24 + random() * 0.24,
        distance,
      });
    }
  }

  function cameraZoom() {
    const zoomSteps = Math.floor(
      game.growthLevel / CAMERA_RULES.levelsPerZoomStep,
    );
    return Math.max(
      CAMERA_RULES.minimumZoom,
      CAMERA_RULES.zoomPerStep ** zoomSteps,
    );
  }

  function updateCamera() {
    const zoom = cameraZoom();
    game.camera.x =
      game.head.x - game.viewport.width / zoom * 0.5;
    game.camera.y =
      game.head.y - game.viewport.height / zoom * 0.5;
  }

  function getMinimapWorldBounds() {
    const zoom = cameraZoom();
    const visibleWidth = game.viewport.width / zoom;
    const visibleHeight = game.viewport.height / zoom;
    const worldUnitsPerPixel =
      Math.max(
        visibleWidth / MINIMAP_RULES.width,
        visibleHeight / MINIMAP_RULES.height,
      ) * MINIMAP_RULES.viewPadding;
    const width = MINIMAP_RULES.width * worldUnitsPerPixel;
    const height = MINIMAP_RULES.height * worldUnitsPerPixel;
    return {
      x: game.head.x - width * 0.5,
      y: game.head.y - height * 0.5,
      width,
      height,
    };
  }

  function drawMinimapTarget(target, bounds) {
    const x = ((target.x - bounds.x) / bounds.width) * MINIMAP_RULES.width;
    const y = ((target.y - bounds.y) / bounds.height) * MINIMAP_RULES.height;
    if (
      x < -4 ||
      x > MINIMAP_RULES.width + 4 ||
      y < -4 ||
      y > MINIMAP_RULES.height + 4
    ) {
      return;
    }

    const radius =
      target.kind === ENEMY_TYPES.VULTURE
        ? 2.7
        : target.kind === ENEMY_TYPES.MEAT
          ? 1.3
          : 1.8;
    minimapSceneContext.beginPath();
    minimapSceneContext.arc(x, y, radius, 0, TAU);
    minimapSceneContext.fillStyle =
      target.kind === ENEMY_TYPES.MEAT ? palette.cream : palette.sun;
    minimapSceneContext.fill();
    minimapSceneContext.strokeStyle = palette.ink;
    minimapSceneContext.lineWidth = 0.8;
    minimapSceneContext.stroke();
  }

  function refreshMinimapScene(time, bounds) {
    const width = MINIMAP_RULES.width;
    const height = MINIMAP_RULES.height;
    const data = minimapState.imageData.data;
    const size = game.map.cellSize;
    const xStep = bounds.width / width;
    const yStep = bounds.height / height;

    for (let x = 0; x < width; x += 1) {
      minimapState.sampleColumns[x] = positiveModulo(
        Math.floor((bounds.x + (x + 0.5) * xStep) / size),
        game.map.columns,
      );
    }

    for (let y = 0; y < height; y += 1) {
      const row = Math.floor((bounds.y + (y + 0.5) * yStep) / size);
      const validRow = row >= 0 && row < game.map.rows;
      const rowOffset = validRow ? row * game.map.columns : 0;
      for (let x = 0; x < width; x += 1) {
        const column = minimapState.sampleColumns[x];
        let color = MINIMAP_COLORS.outside;
        if (validRow) {
          const tileValue = game.map.tiles[rowOffset + column];
          color =
            tileValue === MATERIAL_TILE_VALUES[BLOCK_TYPES.GROUND]
              ? MINIMAP_COLORS.ground
              : tileValue === MATERIAL_TILE_VALUES[BLOCK_TYPES.STONE]
                ? MINIMAP_COLORS.stone
                : tileValue === TUNNELED_GROUND_TILE_VALUE
                  ? game.map.acidTunnelDecayRecords.has(rowOffset + column)
                    ? MINIMAP_COLORS.acidTunneled
                    : MINIMAP_COLORS.tunneled
                  : MINIMAP_COLORS.air;
        }
        const pixel = (y * width + x) * 4;
        data[pixel] = color[0];
        data[pixel + 1] = color[1];
        data[pixel + 2] = color[2];
        data[pixel + 3] = 255;
      }
    }

    minimapSceneContext.putImageData(minimapState.imageData, 0, 0);
    const scaleX = width / bounds.width;
    const scaleY = height / bounds.height;
    const worldTop = (0 - bounds.y) * scaleY;
    minimapSceneContext.strokeStyle = palette.ink;
    minimapSceneContext.lineWidth = 1.5;
    minimapSceneContext.beginPath();
    minimapSceneContext.moveTo(0, worldTop);
    minimapSceneContext.lineTo(width, worldTop);
    minimapSceneContext.moveTo(0, worldTop + game.height * scaleY);
    minimapSceneContext.lineTo(width, worldTop + game.height * scaleY);
    minimapSceneContext.stroke();
    game.targets.forEach((target) => drawMinimapTarget(target, bounds));
    game.capturedTargets.forEach((target) =>
      drawMinimapTarget(target, bounds),
    );

    minimapState.ready = true;
    minimapState.mapRevision = game.minimapMapRevision;
    minimapState.terrainRevision = game.minimapTerrainRevision;
    minimapState.lastRefreshTime = time;
    minimapState.bounds = bounds;
  }

  function drawMinimap(time = performance.now()) {
    if (game.map.columns === 0 || game.map.rows === 0) return;
    const bounds = getMinimapWorldBounds();
    const previousBounds = minimapState.bounds;
    const movedBy = Math.max(
      Math.abs(bounds.x - previousBounds.x),
      Math.abs(bounds.y - previousBounds.y),
    );
    const scaleChanged =
      Math.abs(bounds.width - previousBounds.width) > bounds.width * 0.001 ||
      Math.abs(bounds.height - previousBounds.height) > bounds.height * 0.001;
    const mapChanged = minimapState.mapRevision !== game.minimapMapRevision;
    const refreshAvailable =
      time - minimapState.lastRefreshTime >= MINIMAP_RULES.refreshInterval;
    const sceneIsMoving = game.started && !game.paused && !game.menuOpen;
    const refreshNeeded =
      !minimapState.ready ||
      mapChanged ||
      (refreshAvailable &&
        (sceneIsMoving ||
          scaleChanged ||
          minimapState.terrainRevision !== game.minimapTerrainRevision ||
          movedBy > bounds.width / MINIMAP_RULES.width));
    if (refreshNeeded) refreshMinimapScene(time, bounds);
    if (!minimapState.ready) return;

    const activeBounds = minimapState.bounds;
    const scaleX = MINIMAP_RULES.width / activeBounds.width;
    const scaleY = MINIMAP_RULES.height / activeBounds.height;
    const zoom = cameraZoom();
    const viewportX = (game.camera.x - activeBounds.x) * scaleX;
    const viewportY = (game.camera.y - activeBounds.y) * scaleY;
    const viewportWidth = (game.viewport.width / zoom) * scaleX;
    const viewportHeight = (game.viewport.height / zoom) * scaleY;
    const wormX = (game.head.x - activeBounds.x) * scaleX;
    const wormY = (game.head.y - activeBounds.y) * scaleY;

    minimapContext.setTransform(1, 0, 0, 1, 0, 0);
    minimapContext.imageSmoothingEnabled = false;
    minimapContext.drawImage(minimapSceneCanvas, 0, 0);
    minimapContext.strokeStyle = palette.ink;
    minimapContext.lineWidth = 3;
    minimapContext.strokeRect(
      viewportX,
      viewportY,
      viewportWidth,
      viewportHeight,
    );
    minimapContext.strokeStyle = palette.cream;
    minimapContext.lineWidth = 1;
    minimapContext.strokeRect(
      viewportX,
      viewportY,
      viewportWidth,
      viewportHeight,
    );

    minimapContext.save();
    minimapContext.translate(wormX, wormY);
    minimapContext.rotate(game.heading);
    minimapContext.beginPath();
    minimapContext.moveTo(7, 0);
    minimapContext.lineTo(-5, -4.5);
    minimapContext.lineTo(-2.5, 0);
    minimapContext.lineTo(-5, 4.5);
    minimapContext.closePath();
    minimapContext.fillStyle = palette.acid;
    minimapContext.fill();
    minimapContext.strokeStyle = palette.ink;
    minimapContext.lineWidth = 1.5;
    minimapContext.stroke();
    minimapContext.restore();
  }

  function getVisibleWorldBounds(padding = 0) {
    const zoom = cameraZoom();
    const visibleWidth = game.viewport.width / zoom;
    const visibleHeight = game.viewport.height / zoom;
    const left = game.camera.x - padding;
    const top = clamp(game.camera.y - padding, 0, game.height);
    const right = game.camera.x + visibleWidth + padding;
    const bottom = clamp(
      game.camera.y + visibleHeight + padding,
      0,
      game.height,
    );
    return {
      x: left,
      y: top,
      width: Math.max(0, right - left),
      height: Math.max(0, bottom - top),
    };
  }

  function resize() {
    game.viewport.width = window.innerWidth;
    game.viewport.height = window.innerHeight;
    game.dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(game.viewport.width * game.dpr);
    canvas.height = Math.round(game.viewport.height * game.dpr);
    canvas.style.width = `${game.viewport.width}px`;
    canvas.style.height = `${game.viewport.height}px`;
    ctx.setTransform(game.dpr, 0, 0, game.dpr, 0, 0);
    if (game.levelLoaded) updateCamera();
    if (editor.open) resizeEditorCanvas(false);
  }

  function reset() {
    cancelHeldTonguePointer();
    cancelSpitterPointer();
    clearAcidParticles();
    game.head.x = game.spawn.x;
    game.head.y = game.spawn.y;
    game.previous.x = game.head.x;
    game.previous.y = game.head.y;
    game.heading = game.spawn.heading;
    game.score = 0;
    game.scoreGrowthLevel = 0;
    game.growthLevel = game.growthLevelOverride ?? 0;
    game.growthProgress = 0;
    game.growthCost = growthCostForLevel(0);
    game.boostCharge = boostCapacity();
    game.boosting = false;
    game.speed = 0;
    game.velocity.x = 0;
    game.velocity.y = 0;
    game.acceleration.x = 0;
    game.acceleration.y = 0;
    game.inGround = headIsInGround();
    game.wasInGround = game.inGround;
    game.onStoneSurface = false;
    game.stoneSurfaceContact = null;
    gameShell.dataset.stoneSurface = "false";
    game.excludedStoneSurfacePath = null;
    game.stoneSurfaceRelockTimer = 0;
    game.stoneCollisionGraceClusterId = null;
    game.stoneCollisionGraceTimer = 0;
    game.stoneSurfaceDirection = Math.cos(game.heading) < 0 ? -1 : 1;
    resetTunneledGroundBlocks();
    game.particles = [];
    game.elapsed = 0;
    buildTargets();
    game.shake = 0;
    game.transitionEffectCooldown = 0;
    game.mouthOpen = 0;
    game.mouthBitePhase = "idle";
    game.mouthBiteHoldTimer = 0;
    game.mouthChewTimer = 0;
    game.tongues = [];
    game.latchAttack = null;
    game.boostLatchReady = true;

    game.segments = Array.from({ length: wormSegmentCount() }, (_, index) => ({
      x: game.head.x - Math.cos(game.heading) * index * wormSegmentSpacing(),
      y: game.head.y - Math.sin(game.heading) * index * wormSegmentSpacing(),
    }));
    initializeBodyPath();
    game.previousEatHitbox = getEatHitboxPose();
    updateCamera();
    syncDevWormLevelControl();

    updateHud();
  }

  function clearControlKeys() {
    keys.left = false;
    keys.right = false;
    keys.up = false;
    keys.down = false;
    keys.boost = false;
    cancelHeldTonguePointer();
    cancelSpitterPointer();
  }

  function updateActiveWormTypeLabels() {
    const type = activeWormType();
    const label = type.label;
    currentWormName.textContent = label;
    wormEditorTypeName.textContent = label;
    gameShell.dataset.wormType = type.id;
    gameShell.dataset.wormAbility = type.ability || "none";
  }

  function persistActiveWormType() {
    try {
      window.localStorage.setItem(
        WORM_TYPE_STORAGE_KEY,
        game.activeWormTypeId,
      );
    } catch (_error) {
      // Selection still applies for this page when storage is unavailable.
    }
  }

  function loadSavedWormType() {
    try {
      const savedTypeId = window.localStorage.getItem(WORM_TYPE_STORAGE_KEY);
      if (WORM_TYPES[savedTypeId]) game.activeWormTypeId = savedTypeId;
    } catch (_error) {
      game.activeWormTypeId = WORM_TYPE_IDS.LICKER;
    }
    updateActiveWormTypeLabels();
  }

  function resumeTargetAfterTongueRelease(target) {
    target.tongueCaptured = false;
    target.paralyzed = false;
    const definition = ENEMY_DEFINITIONS[target.kind];
    if (target.kind === ENEMY_TYPES.MEAT) {
      target.movementMode = "meat";
      return;
    }
    if (target.kind === ENEMY_TYPES.RABBIT) {
      setRabbitResting(target);
      return;
    }
    if (definition?.flightBehavior === "dragonfly") {
      beginDragonflyHover(target);
      return;
    }
    if (definition?.flightBehavior === "vulture") {
      target.movementMode = "vulture-patrolling";
      target.flightDirection = target.flightDirection || 1;
      target.vx = target.flightDirection * VULTURE_MOTION.moveSpeed;
      target.vy = 0;
      return;
    }
    const regionType =
      getBlockAtWorld(target.x, target.y)?.type || BLOCK_TYPES.AIR;
    target.regionType = regionType;
    target.movementMode =
      regionType === BLOCK_TYPES.GROUND ? "turning" : "falling";
    target.vx = 0;
    target.vy = 0;
  }

  function discardActiveTongues() {
    const pointerId = tonguePointer.pointerId;
    tonguePointer.pointerId = null;
    if (pointerId !== null && canvas.hasPointerCapture?.(pointerId)) {
      canvas.releasePointerCapture(pointerId);
    }
    game.tongues.forEach((tongue) => handOffHeavyGrappleBody(tongue));
    game.targets.forEach((target) => {
      if (target.tongueCaptured) resumeTargetAfterTongueRelease(target);
    });
    game.tongues.length = 0;
  }

  async function setActiveWormType(typeId) {
    const nextType = WORM_TYPES[typeId];
    if (!nextType) return false;
    if (typeId === game.activeWormTypeId) {
      updateActiveWormTypeLabels();
      await loadSavedWormAppearance();
      return true;
    }

    const previousBoostCapacity = Math.max(0.001, boostCapacity());
    const boostRatio = clamp(game.boostCharge / previousBoostCapacity, 0, 1);
    discardActiveTongues();
    cancelSpitterPointer();
    clearAcidParticles();
    game.activeWormTypeId = typeId;
    game.growthCost = growthCostForLevel(game.scoreGrowthLevel);
    if (game.segments.length > 0) {
      setEffectiveWormLevel(game.growthLevel);
      game.previousEatHitbox = getEatHitboxPose();
    }
    game.boostCharge = boostCapacity() * boostRatio;
    persistActiveWormType();
    updateActiveWormTypeLabels();
    await loadSavedWormAppearance();
    updateHud();
    return true;
  }

  function createWormTypeOption(type, index) {
    const option = document.createElement("article");
    const selected = type.id === game.activeWormTypeId;
    option.className = "worm-type-option";
    option.classList.toggle("active", selected);

    const indexLabel = document.createElement("span");
    indexLabel.className = "worm-type-index";
    indexLabel.textContent = `TYPE ${String(index + 1).padStart(2, "0")}`;
    const heading = document.createElement("div");
    heading.className = "worm-type-option-heading";
    const name = document.createElement("h3");
    name.textContent = type.label;
    const ability = document.createElement("span");
    ability.className = "worm-type-ability-label";
    ability.textContent = `Ability · ${type.abilityLabel}`;
    heading.append(name, ability);

    const description = document.createElement("p");
    description.textContent = type.description;
    const scaling = document.createElement("span");
    scaling.className = "worm-type-scaling";
    const segmentGrowthLabel =
      type.scaling.segmentsPerLevel === 0.5
        ? "+1 segment / 2 levels"
        : `+${type.scaling.segmentsPerLevel} segment / level`;
    scaling.textContent =
      `+${Math.round(type.scaling.scalePerLevel * 100)}% size / level · ` +
      `${segmentGrowthLabel} · ` +
      `+${type.scaling.maximumSpeedPerLevel} speed / level`;
    const button = document.createElement("button");
    button.type = "button";
    button.disabled = selected;
    button.textContent = selected ? "Selected" : `Use ${type.label}`;
    button.addEventListener("click", async () => {
      button.disabled = true;
      if (!(await setActiveWormType(type.id))) {
        button.disabled = false;
        return;
      }
      closeWormTypeSelect();
    });

    option.append(indexLabel, heading, description, scaling, button);
    return option;
  }

  function renderWormTypeList() {
    const options = Object.values(WORM_TYPES).map((type, index) =>
      createWormTypeOption(type, index),
    );
    wormTypeList.replaceChildren(...options);
  }

  function openWormTypeSelect() {
    clearControlKeys();
    renderWormTypeList();
    wormTypeSelect.classList.add("visible");
    wormTypeSelect.setAttribute("aria-hidden", "false");
    game.menuOpen = true;
  }

  function closeWormTypeSelect() {
    wormTypeSelect.classList.remove("visible");
    wormTypeSelect.setAttribute("aria-hidden", "true");
    syncMenuOpenState();
  }

  function syncMenuOpenState() {
    game.menuOpen =
      game.homeOpen ||
      gameMenu.classList.contains("visible") ||
      enemyInfo.classList.contains("visible") ||
      wormTypeSelect.classList.contains("visible") ||
      worldSelect.classList.contains("visible") ||
      editor.open ||
      wormPainter.open;
  }

  function openMainMenu() {
    if (!game.levelLoaded || !game.started || game.homeOpen) return;
    clearControlKeys();
    cancelSpitterPointer();
    toggleDevMenu(false);
    game.paused = true;
    gameShell.dataset.paused = "true";
    gameMenu.classList.add("visible");
    gameMenu.setAttribute("aria-hidden", "false");
    mainMenuButton.setAttribute("aria-expanded", "true");
    game.menuOpen = true;
  }

  function closeMainMenu(resume = true) {
    gameMenu.classList.remove("visible");
    gameMenu.setAttribute("aria-hidden", "true");
    mainMenuButton.setAttribute("aria-expanded", "false");
    if (resume && game.levelLoaded && game.started) {
      game.paused = false;
      gameShell.dataset.paused = "false";
      game.lastTime = performance.now();
    }
    syncMenuOpenState();
  }

  function createEnemyInfoEntry(kind, definition) {
    const entry = document.createElement("article");
    entry.className = "enemy-info-entry";

    const artwork = document.createElement("div");
    artwork.className = "enemy-info-artwork";
    const sprite = document.createElement("img");
    sprite.src = ENEMY_SPRITE_FILES[definition.spriteFrames[0]];
    sprite.alt = `${definition.label} sprite`;
    artwork.appendChild(sprite);

    const heading = document.createElement("div");
    heading.className = "enemy-info-entry-heading";
    const indexLabel = document.createElement("span");
    indexLabel.textContent = `TARGET ${kind.toUpperCase()}`;
    const name = document.createElement("h3");
    name.textContent = definition.label;
    heading.append(indexLabel, name);

    const stats = document.createElement("dl");
    stats.className = "enemy-info-stats";
    [
      ["Points", definition.score],
      ["HP", definition.health],
      ["Prey", preyClassLabel(preyClassForHealth(definition.health))],
    ].forEach(([label, value]) => {
      const stat = document.createElement("div");
      const term = document.createElement("dt");
      term.textContent = label;
      const amount = document.createElement("dd");
      amount.textContent = String(value);
      stat.append(term, amount);
      stats.appendChild(stat);
    });

    entry.append(artwork, heading, stats);
    return entry;
  }

  function renderEnemyInfoList() {
    const entries = Object.entries(ENEMY_DEFINITIONS)
      .filter(([, definition]) => definition.devSpawnable !== false)
      .map(([kind, definition]) => createEnemyInfoEntry(kind, definition));
    enemyInfoList.replaceChildren(...entries);
  }

  function openEnemyInfo() {
    clearControlKeys();
    closeMainMenu(false);
    renderEnemyInfoList();
    enemyInfo.classList.add("visible");
    enemyInfo.setAttribute("aria-hidden", "false");
    game.menuOpen = true;
  }

  function closeEnemyInfo() {
    enemyInfo.classList.remove("visible");
    enemyInfo.setAttribute("aria-hidden", "true");
    if (game.levelLoaded && game.paused) openMainMenu();
    else syncMenuOpenState();
  }

  function updateSelectedWorldLabel() {
    currentWorldName.textContent = game.selectedWorldName;
  }

  function persistSelectedWorld() {
    try {
      window.localStorage.setItem(
        SELECTED_WORLD_STORAGE_KEY,
        game.selectedWorldId,
      );
    } catch (_error) {
      // The selection still applies for this page when storage is unavailable.
    }
  }

  function loadSelectedWorld() {
    try {
      const savedWorldId = window.localStorage.getItem(
        SELECTED_WORLD_STORAGE_KEY,
      );
      const savedWorld = getWorldById(savedWorldId);
      if (savedWorld) {
        game.selectedWorldId = savedWorld.id;
        game.selectedWorldName = savedWorld.name;
      }
    } catch (_error) {
      game.selectedWorldId = DEFAULT_WORLD_ID;
      game.selectedWorldName = DEFAULT_WORLD.name;
    }
    updateSelectedWorldLabel();
  }

  function selectWorld(worldId) {
    const world = getWorldById(worldId) || DEFAULT_WORLD;
    game.selectedWorldId = world.id;
    game.selectedWorldName = world.name;
    persistSelectedWorld();
    updateSelectedWorldLabel();
    closeWorldSelect();
  }

  function createWorldCard(world) {
    const card = document.createElement("article");
    card.className = "world-card";
    card.classList.toggle("active", world.id === game.selectedWorldId);

    const copy = document.createElement("div");
    copy.className = "world-card-copy";
    const name = document.createElement("strong");
    name.textContent = world.name;
    const details = document.createElement("small");
    if (world.builtin) {
      details.textContent = "Built in · Flat ground";
    } else {
      const groundBlocks = countMaterialTiles(world, BLOCK_TYPES.GROUND);
      const stoneBlocks = countMaterialTiles(world, BLOCK_TYPES.STONE);
      details.textContent =
        `${groundBlocks.toLocaleString()} ground · ` +
        `${stoneBlocks.toLocaleString()} stone · Custom`;
    }
    copy.append(name, details);

    const actions = document.createElement("div");
    actions.className = "world-card-actions";
    const selectButton = document.createElement("button");
    selectButton.className = "play-world";
    selectButton.type = "button";
    selectButton.disabled = world.id === game.selectedWorldId;
    selectButton.textContent = selectButton.disabled ? "Selected" : "Select";
    selectButton.addEventListener("click", () => selectWorld(world.id));
    actions.appendChild(selectButton);

    if (!world.builtin) {
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.textContent = "Edit";
      editButton.addEventListener("click", () => openWorldEditor(world.id));
      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-world";
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => deleteCustomWorld(world.id));
      actions.append(editButton, deleteButton);
    }

    card.append(copy, actions);
    return card;
  }

  function renderWorldList() {
    worldList.replaceChildren();
    worldList.appendChild(createWorldCard(DEFAULT_WORLD));
    customWorlds
      .slice()
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .forEach((world) => worldList.appendChild(createWorldCard(world)));
  }

  function openWorldSelect() {
    clearControlKeys();
    game.menuOpen = true;
    renderWorldList();
    worldSelect.classList.add("visible");
    worldSelect.setAttribute("aria-hidden", "false");
  }

  function closeWorldSelect() {
    worldSelect.classList.remove("visible");
    worldSelect.setAttribute("aria-hidden", "true");
    syncMenuOpenState();
  }

  function startSelectedWorld() {
    const world = getWorldById(game.selectedWorldId) || DEFAULT_WORLD;
    game.selectedWorldId = world.id;
    game.selectedWorldName = world.name;
    updateSelectedWorldLabel();
    homeScreen.classList.remove("visible");
    homeScreen.setAttribute("aria-hidden", "true");
    gameShell.classList.remove("home-active");
    game.homeOpen = false;
    buildMap(world);
    game.levelLoaded = true;
    gameShell.dataset.levelLoaded = "true";
    buildScenery();
    rebuildTerrainLayer();
    reset();
    game.started = true;
    game.paused = false;
    gameShell.dataset.paused = "false";
    closeWorldSelect();
    game.menuOpen = false;
    game.lastTime = performance.now();
    game.lastRenderTime = game.lastTime;
    render();
  }

  function deleteCustomWorld(worldId) {
    const world = getWorldById(worldId);
    if (!world || world.builtin) return;
    if (!window.confirm(`Delete “${world.name}”? This cannot be undone.`)) return;
    const previousWorlds = customWorlds;
    customWorlds = customWorlds.filter((candidate) => candidate.id !== worldId);
    if (!persistCustomWorlds()) {
      customWorlds = previousWorlds;
      return;
    }
    if (game.selectedWorldId === worldId) {
      game.selectedWorldId = DEFAULT_WORLD_ID;
      game.selectedWorldName = DEFAULT_WORLD.name;
      persistSelectedWorld();
      updateSelectedWorldLabel();
    }
    renderWorldList();
  }

  function editorTileIndex(column, row) {
    return row * WORLD_COLUMNS + column;
  }

  function editorCellAt(clientX, clientY) {
    const rect = editorCanvas.getBoundingClientRect();
    return {
      column: Math.floor((clientX - rect.left - editor.offsetX) / editor.scale),
      row: Math.floor((clientY - rect.top - editor.offsetY) / editor.scale),
    };
  }

  function editorCellIsValid(cell) {
    return (
      cell &&
      cell.column >= 0 &&
      cell.column < WORLD_COLUMNS &&
      cell.row >= 0 &&
      cell.row < WORLD_ROWS
    );
  }

  function getEditorBrushCells(center) {
    if (!editorCellIsValid(center)) return [];
    const cells = [];
    const half = Math.floor(editor.brushSize / 2);
    for (let y = -half; y <= half; y += 1) {
      for (let x = -half; x <= half; x += 1) {
        let included = false;
        if (editor.brushShape === "square") included = true;
        else if (editor.brushShape === "horizontal") included = y === 0;
        else if (editor.brushShape === "vertical") included = x === 0;
        else included = x * x + y * y <= Math.pow(half + 0.35, 2);
        const column = center.column + x;
        const row = center.row + y;
        if (
          included &&
          column >= 0 &&
          column < WORLD_COLUMNS &&
          row >= 0 &&
          row < WORLD_ROWS
        ) {
          cells.push({ column, row });
        }
      }
    }
    return cells;
  }

  function applyEditorTool(cell, tool = editor.tool) {
    if (!editorCellIsValid(cell)) return;
    if (tool === "spawn") {
      editor.spawn.column = cell.column;
      editor.spawn.row = cell.row;
      const spawnIndex = editorTileIndex(cell.column, cell.row);
      if (editor.tiles[spawnIndex] === 2) editor.tiles[spawnIndex] = 0;
      return;
    }
    if (
      tool !== "ground" &&
      tool !== "stone" &&
      tool !== "erase"
    ) return;
    const value = tool === "ground"
      ? MATERIAL_TILE_VALUES[BLOCK_TYPES.GROUND]
      : tool === "stone"
        ? MATERIAL_TILE_VALUES[BLOCK_TYPES.STONE]
        : 0;
    getEditorBrushCells(cell).forEach((brushCell) => {
      if (
        value === 2 &&
        brushCell.column === editor.spawn.column &&
        brushCell.row === editor.spawn.row
      ) {
        return;
      }
      editor.tiles[editorTileIndex(brushCell.column, brushCell.row)] = value;
    });
  }

  function applyEditorFill(cell, materialTool = editor.fillMaterialTool) {
    if (!editorCellIsValid(cell)) return;
    const replacement = materialTool === "ground"
      ? MATERIAL_TILE_VALUES[BLOCK_TYPES.GROUND]
      : materialTool === "stone"
        ? MATERIAL_TILE_VALUES[BLOCK_TYPES.STONE]
        : materialTool === "erase"
          ? 0
          : null;
    if (replacement === null) return;

    const startIndex = editorTileIndex(cell.column, cell.row);
    const target = editor.tiles[startIndex];
    if (target === replacement) return;
    const spawnIndex = editorTileIndex(editor.spawn.column, editor.spawn.row);
    const spawnValue = editor.tiles[spawnIndex];

    const queue = new Int32Array(editor.tiles.length);
    let readIndex = 0;
    let writeIndex = 0;
    editor.tiles[startIndex] = replacement;
    queue[writeIndex] = startIndex;
    writeIndex += 1;

    const enqueueIfTarget = (index) => {
      if (editor.tiles[index] !== target) return;
      editor.tiles[index] = replacement;
      queue[writeIndex] = index;
      writeIndex += 1;
    };

    while (readIndex < writeIndex) {
      const index = queue[readIndex];
      readIndex += 1;
      const column = index % WORLD_COLUMNS;
      if (column > 0) enqueueIfTarget(index - 1);
      if (column < WORLD_COLUMNS - 1) enqueueIfTarget(index + 1);
      if (index >= WORLD_COLUMNS) enqueueIfTarget(index - WORLD_COLUMNS);
      if (index < editor.tiles.length - WORLD_COLUMNS) {
        enqueueIfTarget(index + WORLD_COLUMNS);
      }
    }

    if (replacement === 2) {
      editor.tiles[spawnIndex] = spawnValue;
    }
  }

  function applyEditorStroke(from, to, tool) {
    const distance = Math.max(
      Math.abs(to.column - from.column),
      Math.abs(to.row - from.row),
    );
    const steps = Math.max(1, distance);
    for (let step = 0; step <= steps; step += 1) {
      const amount = step / steps;
      applyEditorTool(
        {
          column: Math.round(lerp(from.column, to.column, amount)),
          row: Math.round(lerp(from.row, to.row, amount)),
        },
        tool,
      );
    }
  }

  function editorToolLabel() {
    return editor.tool === "ground"
      ? "Ground"
      : editor.tool === "stone"
        ? "Stone"
        : editor.tool === "erase"
          ? "Erase"
          : editor.tool === "fill"
            ? `Fill ${editor.fillMaterialTool[0].toUpperCase()}${editor.fillMaterialTool.slice(1)}`
          : editor.tool === "spawn"
            ? "Spawn"
            : "Pan";
  }

  function updateEditorStatus() {
    const location = editor.hoverCell && editorCellIsValid(editor.hoverCell)
      ? `${editor.hoverCell.column}, ${editor.hoverCell.row}`
      : "Outside world";
    const shape = editor.brushShape[0].toUpperCase() + editor.brushShape.slice(1);
    const brushDescription =
      editor.tool === "fill" || editor.tool === "spawn" || editor.tool === "pan"
        ? ""
        : ` · ${shape} ${editor.brushSize}`;
    editorStatus.textContent =
      `${editorToolLabel()}${brushDescription} · ${location} · ${Math.round(editor.scale * 100)}%`;
  }

  function drawWorldEditor() {
    if (!editor.open || editor.viewWidth <= 0 || editor.viewHeight <= 0) return;
    const width = editor.viewWidth;
    const height = editor.viewHeight;
    const scale = editor.scale;
    editorContext.clearRect(0, 0, width, height);
    editorContext.fillStyle = "#241714";
    editorContext.fillRect(0, 0, width, height);

    const worldScreenWidth = WORLD_COLUMNS * scale;
    const worldScreenHeight = WORLD_ROWS * scale;
    editorContext.fillStyle = palette.sky;
    editorContext.fillRect(editor.offsetX, editor.offsetY, worldScreenWidth, worldScreenHeight);

    const startColumn = clamp(Math.floor(-editor.offsetX / scale), 0, WORLD_COLUMNS - 1);
    const endColumn = clamp(
      Math.ceil((width - editor.offsetX) / scale),
      0,
      WORLD_COLUMNS - 1,
    );
    const startRow = clamp(Math.floor(-editor.offsetY / scale), 0, WORLD_ROWS - 1);
    const endRow = clamp(
      Math.ceil((height - editor.offsetY) / scale),
      0,
      WORLD_ROWS - 1,
    );

    const drawMaterialRuns = (tileValue, color) => {
      editorContext.fillStyle = color;
      for (let row = startRow; row <= endRow; row += 1) {
        let runStart = null;
        for (let column = startColumn; column <= endColumn + 1; column += 1) {
          const filled =
            column <= endColumn &&
            editor.tiles[editorTileIndex(column, row)] === tileValue;
          if (filled && runStart === null) runStart = column;
          if (!filled && runStart !== null) {
            editorContext.fillRect(
              editor.offsetX + runStart * scale,
              editor.offsetY + row * scale,
              (column - runStart) * scale,
              scale,
            );
            runStart = null;
          }
        }
      }
    };
    drawMaterialRuns(1, palette.soil);
    drawMaterialRuns(2, palette.stone);

    if (scale >= 6) {
      editorContext.beginPath();
      for (let column = startColumn; column <= endColumn + 1; column += 1) {
        const x = editor.offsetX + column * scale;
        editorContext.moveTo(x, editor.offsetY + startRow * scale);
        editorContext.lineTo(x, editor.offsetY + (endRow + 1) * scale);
      }
      for (let row = startRow; row <= endRow + 1; row += 1) {
        const y = editor.offsetY + row * scale;
        editorContext.moveTo(editor.offsetX + startColumn * scale, y);
        editorContext.lineTo(editor.offsetX + (endColumn + 1) * scale, y);
      }
      editorContext.strokeStyle = "rgba(58, 36, 31, 0.22)";
      editorContext.lineWidth = 1;
      editorContext.stroke();
    }

    if (editor.hoverCell && editorCellIsValid(editor.hoverCell) && editor.tool !== "pan") {
      const previewCells = editor.tool === "spawn" || editor.tool === "fill"
        ? [editor.hoverCell]
        : getEditorBrushCells(editor.hoverCell);
      const previewTool = editor.tool === "fill" ? editor.fillMaterialTool : editor.tool;
      editorContext.fillStyle = previewTool === "erase"
        ? "rgba(248, 240, 221, 0.48)"
        : previewTool === "spawn"
          ? "rgba(245, 194, 98, 0.65)"
          : previewTool === "stone"
            ? "rgba(135, 145, 141, 0.72)"
            : "rgba(53, 35, 29, 0.62)";
      previewCells.forEach((cell) => {
        editorContext.fillRect(
          editor.offsetX + cell.column * scale,
          editor.offsetY + cell.row * scale,
          Math.max(1, scale),
          Math.max(1, scale),
        );
      });
    }

    const spawnX = editor.offsetX + (editor.spawn.column + 0.5) * scale;
    const spawnY = editor.offsetY + (editor.spawn.row + 0.5) * scale;
    const markerRadius = clamp(scale * 1.8, 6, 18);
    editorContext.beginPath();
    editorContext.arc(spawnX, spawnY, markerRadius, 0, TAU);
    editorContext.fillStyle = palette.acid;
    editorContext.fill();
    editorContext.strokeStyle = palette.ink;
    editorContext.lineWidth = 2;
    editorContext.stroke();
    editorContext.beginPath();
    editorContext.moveTo(spawnX - markerRadius * 0.55, spawnY);
    editorContext.lineTo(spawnX + markerRadius * 0.55, spawnY);
    editorContext.moveTo(spawnX, spawnY - markerRadius * 0.55);
    editorContext.lineTo(spawnX, spawnY + markerRadius * 0.55);
    editorContext.stroke();

    editorContext.strokeStyle = palette.cream;
    editorContext.lineWidth = 2;
    editorContext.strokeRect(editor.offsetX, editor.offsetY, worldScreenWidth, worldScreenHeight);
    updateEditorStatus();
  }

  function fitEditorWorld() {
    if (editor.viewWidth <= 0 || editor.viewHeight <= 0) return;
    editor.scale = Math.min(
      (editor.viewWidth - 48) / WORLD_COLUMNS,
      (editor.viewHeight - 48) / WORLD_ROWS,
    );
    editor.scale = clamp(editor.scale, 0.5, 28);
    editor.offsetX = (editor.viewWidth - WORLD_COLUMNS * editor.scale) * 0.5;
    editor.offsetY = (editor.viewHeight - WORLD_ROWS * editor.scale) * 0.5;
    drawWorldEditor();
  }

  function resizeEditorCanvas(fit = false) {
    if (!editor.open) return;
    const rect = editorCanvasWrap.getBoundingClientRect();
    editor.viewWidth = Math.max(1, Math.round(rect.width));
    editor.viewHeight = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    editorCanvas.width = Math.round(editor.viewWidth * dpr);
    editorCanvas.height = Math.round(editor.viewHeight * dpr);
    editorContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (fit) fitEditorWorld();
    else drawWorldEditor();
  }

  function setEditorTool(tool) {
    if (
      tool === "ground" ||
      tool === "stone" ||
      tool === "erase"
    ) {
      editor.fillMaterialTool = tool;
    }
    editor.tool = tool;
    worldEditor.dataset.tool = tool;
    document.querySelectorAll("[data-editor-tool]").forEach((button) => {
      button.classList.toggle("active", button.dataset.editorTool === tool);
    });
    drawWorldEditor();
  }

  function openWorldEditor(worldId = null) {
    const world = worldId ? getWorldById(worldId) : null;
    editor.worldId = world?.id || null;
    editor.tiles = world
      ? decodeMaterialRuns(world)
      : new Uint8Array(WORLD_COLUMNS * WORLD_ROWS);
    editor.spawn = world
      ? { ...world.spawn }
      : { column: Math.floor(WORLD_COLUMNS / 2), row: Math.floor(WORLD_ROWS / 2) };
    editor.open = true;
    editor.drawing = false;
    editor.panning = false;
    editor.lastCell = null;
    editor.hoverCell = null;
    worldNameInput.value = world?.name || "Untitled World";
    closeWorldSelect();
    game.menuOpen = true;
    worldEditor.classList.add("visible");
    worldEditor.setAttribute("aria-hidden", "false");
    setEditorTool("ground");
    requestAnimationFrame(() => resizeEditorCanvas(true));
  }

  function closeWorldEditor(returnToWorlds = true) {
    editor.open = false;
    editor.drawing = false;
    editor.panning = false;
    // The expanded editor grid is only needed while the editor is visible.
    // Release its multi-megabyte working copy before returning to gameplay.
    editor.tiles = new Uint8Array(0);
    worldEditor.classList.remove("visible");
    worldEditor.setAttribute("aria-hidden", "true");
    if (returnToWorlds) openWorldSelect();
    else syncMenuOpenState();
  }

  function saveEditedWorld() {
    const name = worldNameInput.value.trim().slice(0, 40) || "Untitled World";
    const worldId = editor.worldId ||
      `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const savedWorld = {
      id: worldId,
      name,
      builtin: false,
      spawn: { ...editor.spawn },
      formatVersion: WORLD_FORMAT_VERSION,
      columns: WORLD_COLUMNS,
      rows: WORLD_ROWS,
      materials: encodeMaterialRuns(editor.tiles),
      updatedAt: Date.now(),
    };
    const previousWorlds = customWorlds.slice();
    const existingIndex = customWorlds.findIndex((world) => world.id === worldId);
    if (existingIndex >= 0) customWorlds.splice(existingIndex, 1, savedWorld);
    else customWorlds.push(savedWorld);

    if (!persistCustomWorlds()) {
      customWorlds = previousWorlds;
      editorStatus.textContent = "Could not save · Browser storage is unavailable or full";
      return;
    }
    game.selectedWorldId = savedWorld.id;
    game.selectedWorldName = savedWorld.name;
    persistSelectedWorld();
    updateSelectedWorldLabel();
    closeWorldEditor(true);
  }

  function waitForImage(image) {
    if (image.complete && image.naturalWidth > 0) return Promise.resolve(image);
    return new Promise((resolve, reject) => {
      image.addEventListener("load", () => resolve(image), { once: true });
      image.addEventListener("error", () => reject(new Error("Image could not be loaded")), {
        once: true,
      });
    });
  }

  function loadImageSource(source) {
    const image = new Image();
    image.decoding = "async";
    image.src = source;
    return waitForImage(image);
  }

  function markWormPainterBodyCompositeDirty(layerName) {
    if (layerName === "segment" || layerName === "segmentOutline") {
      wormPainter.bodyCompositeRevision += 1;
    }
  }

  function copyImageToWormLayer(name, image) {
    const definition = WORM_LAYER_DEFINITIONS[name];
    const layer = wormPainter.layers[name];
    const layerContext = layer.getContext("2d");
    layerContext.clearRect(0, 0, definition.width, definition.height);
    layerContext.imageSmoothingEnabled = true;
    layerContext.drawImage(image, 0, 0, definition.width, definition.height);
    const halfSide = HALF_WORM_LAYER_SIDES[name];
    if (halfSide === "upper") {
      layerContext.clearRect(
        0,
        definition.height * 0.5,
        definition.width,
        definition.height * 0.5,
      );
    } else if (halfSide === "lower") {
      layerContext.clearRect(0, 0, definition.width, definition.height * 0.5);
    }
    markWormPainterBodyCompositeDirty(name);
  }

  async function loadActiveWormIntoEditor() {
    await Promise.all(Object.values(wormSprites).map(waitForImage));
    Object.entries(wormSprites).forEach(([name, image]) =>
      copyImageToWormLayer(name, image),
    );
    wormPainter.mirroredJawSource = wormAppearance.mirroredJawSource;
    wormPainter.mirroredMouthSource = wormAppearance.mirroredMouthSource;
  }

  async function loadDefaultWormIntoEditor() {
    wormPaintStatus.textContent = "Loading default PNG layers…";
    const defaultSources = activeDefaultWormSpriteFiles();
    const defaults = await Promise.all(
      Object.entries(defaultSources).map(async ([name, source]) => [
        name,
        await loadImageSource(source),
      ]),
    );
    defaults.forEach(([name, image]) => copyImageToWormLayer(name, image));
    wormPainter.mirroredJawSource =
      DEFAULT_WORM_MIRRORING.mirroredJawSource;
    wormPainter.mirroredMouthSource =
      DEFAULT_WORM_MIRRORING.mirroredMouthSource;
    syncWormEditorGuideControls();
    renderWormPaintCanvas();
    drawWormEditorPreview();
  }

  function normalizeMirroredJawSource(source) {
    return JAW_LAYER_NAMES.has(source) ? source : null;
  }

  function normalizeMirroredMouthSource(source) {
    return MOUTH_LAYER_NAMES.has(source) ? source : null;
  }

  function applyWormSpriteSources(
    sources,
    mirroredJawSource = null,
    mirroredMouthSource = null,
  ) {
    wormBodySpriteRevision += 1;
    const defaultSources = activeDefaultWormSpriteFiles();
    Object.keys(WORM_LAYER_DEFINITIONS).forEach((name) => {
      wormSprites[name].src = sources[name] || defaultSources[name];
    });
    wormAppearance.mirroredJawSource = normalizeMirroredJawSource(
      mirroredJawSource,
    );
    wormAppearance.mirroredMouthSource = normalizeMirroredMouthSource(
      mirroredMouthSource,
    );
  }

  function savedSpriteSetIsValid(sources, layerNames) {
    return layerNames.every(
      (name) =>
        typeof sources?.[name] === "string" &&
        sources[name].startsWith("data:image/png"),
    );
  }

  function withTongueSpriteFallbacks(sources) {
    const resolvedSources = { ...(sources || {}) };
    const defaultSources = activeDefaultWormSpriteFiles();
    ["tongue", "tongueRing"].forEach((name) => {
      if (!savedSpriteSetIsValid(resolvedSources, [name])) {
        resolvedSources[name] = defaultSources[name];
      }
    });
    return resolvedSources;
  }

  function halfSpriteDataUrl(image, definition, side) {
    const layer = document.createElement("canvas");
    layer.width = definition.width;
    layer.height = definition.height;
    const layerContext = layer.getContext("2d");
    layerContext.drawImage(image, 0, 0, layer.width, layer.height);
    if (side === "upper") {
      layerContext.clearRect(
        0,
        layer.height * 0.5,
        layer.width,
        layer.height * 0.5,
      );
    } else {
      layerContext.clearRect(0, 0, layer.width, layer.height * 0.5);
    }
    return layer.toDataURL("image/png");
  }

  function mirroredOppositeHalfDataUrl(image, definition, targetSide) {
    const layer = document.createElement("canvas");
    layer.width = definition.width;
    layer.height = definition.height;
    const layerContext = layer.getContext("2d");
    layerContext.translate(0, layer.height);
    layerContext.scale(1, -1);
    layerContext.drawImage(image, 0, 0, layer.width, layer.height);
    layerContext.setTransform(1, 0, 0, 1, 0, 0);
    if (targetSide === "upper") {
      layerContext.clearRect(
        0,
        layer.height * 0.5,
        layer.width,
        layer.height * 0.5,
      );
    } else {
      layerContext.clearRect(0, 0, layer.width, layer.height * 0.5);
    }
    return layer.toDataURL("image/png");
  }

  async function migrateSingleMouthAppearance(sources) {
    const [headUpper, headLower, mouth] = await Promise.all([
      loadImageSource(sources.headUpper),
      loadImageSource(sources.headLower),
      loadImageSource(sources.mouth),
    ]);
    return {
      headUpper: halfSpriteDataUrl(
        headUpper,
        WORM_LAYER_DEFINITIONS.headUpper,
        "upper",
      ),
      headLower: halfSpriteDataUrl(
        headLower,
        WORM_LAYER_DEFINITIONS.headLower,
        "lower",
      ),
      mouthUpper: halfSpriteDataUrl(
        mouth,
        WORM_LAYER_DEFINITIONS.mouthUpper,
        "upper",
      ),
      mouthLower: mirroredOppositeHalfDataUrl(
        mouth,
        WORM_LAYER_DEFINITIONS.mouthLower,
        "lower",
      ),
      segment: sources.segment,
      segmentBand: sources.segmentBand,
      segmentOutline: sources.segmentOutline,
    };
  }

  async function migrateSingleJawAppearance(sources) {
    const [headUpper, mouth] = await Promise.all([
      loadImageSource(sources.headUpper),
      loadImageSource(sources.mouth),
    ]);
    return {
      headUpper: halfSpriteDataUrl(
        headUpper,
        WORM_LAYER_DEFINITIONS.headUpper,
        "upper",
      ),
      headLower: mirroredOppositeHalfDataUrl(
        headUpper,
        WORM_LAYER_DEFINITIONS.headLower,
        "lower",
      ),
      mouthUpper: halfSpriteDataUrl(
        mouth,
        WORM_LAYER_DEFINITIONS.mouthUpper,
        "upper",
      ),
      mouthLower: mirroredOppositeHalfDataUrl(
        mouth,
        WORM_LAYER_DEFINITIONS.mouthLower,
        "lower",
      ),
      segment: sources.segment,
      segmentBand: sources.segmentBand,
      segmentOutline: sources.segmentOutline,
    };
  }

  async function migrateSplitJawAppearance(sources) {
    const [headUpper, headLower, mouth] = await Promise.all([
      loadImageSource(sources.headUpper),
      loadImageSource(sources.headLower),
      loadImageSource(sources.mouth),
    ]);
    return {
      headUpper: halfSpriteDataUrl(
        headUpper,
        WORM_LAYER_DEFINITIONS.headUpper,
        "upper",
      ),
      headLower: halfSpriteDataUrl(
        headLower,
        WORM_LAYER_DEFINITIONS.headLower,
        "lower",
      ),
      mouthUpper: halfSpriteDataUrl(
        mouth,
        WORM_LAYER_DEFINITIONS.mouthUpper,
        "upper",
      ),
      mouthLower: halfSpriteDataUrl(
        mouth,
        WORM_LAYER_DEFINITIONS.mouthLower,
        "lower",
      ),
      segment: sources.segment,
      segmentBand: sources.segmentBand,
      segmentOutline: sources.segmentOutline,
    };
  }

  async function migrateLegacyWormAppearance(sources) {
    const legacyHead = await loadImageSource(sources.head);
    const defaultMouth = await loadImageSource(
      activeDefaultWormSpriteFiles().mouthUpper,
    );
    return {
      headUpper: halfSpriteDataUrl(
        legacyHead,
        WORM_LAYER_DEFINITIONS.headUpper,
        "upper",
      ),
      headLower: halfSpriteDataUrl(
        legacyHead,
        WORM_LAYER_DEFINITIONS.headLower,
        "lower",
      ),
      mouthUpper: halfSpriteDataUrl(
        defaultMouth,
        WORM_LAYER_DEFINITIONS.mouthUpper,
        "upper",
      ),
      mouthLower: halfSpriteDataUrl(
        defaultMouth,
        WORM_LAYER_DEFINITIONS.mouthLower,
        "lower",
      ),
      segment: sources.segment,
      segmentBand: sources.segmentBand,
      segmentOutline: sources.segmentOutline,
    };
  }

  function wormAppearanceStorageKey(typeId = game.activeWormTypeId) {
    return `${WORM_TYPE_APPEARANCE_STORAGE_PREFIX}.${typeId}`;
  }

  function applyDefaultWormAppearance() {
    applyWormSpriteSources(
      activeDefaultWormSpriteFiles(),
      DEFAULT_WORM_MIRRORING.mirroredJawSource,
      DEFAULT_WORM_MIRRORING.mirroredMouthSource,
    );
  }

  function persistMigratedWormAppearance(
    storageKey,
    sprites,
    mirroredJawSource = null,
    mirroredMouthSource = null,
  ) {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        version: 1,
        wormTypeId: game.activeWormTypeId,
        updatedAt: Date.now(),
        mirroredJawSource: normalizeMirroredJawSource(mirroredJawSource),
        mirroredMouthSource: normalizeMirroredMouthSource(mirroredMouthSource),
        sprites,
      }),
    );
  }

  async function loadSavedWormAppearance() {
    const typeStorageKey = wormAppearanceStorageKey();
    try {
      const typedAppearance = JSON.parse(
        window.localStorage.getItem(typeStorageKey) || "null",
      );
      if (
        savedSpriteSetIsValid(
          typedAppearance?.sprites,
          CORE_WORM_LAYER_NAMES,
        )
      ) {
        applyWormSpriteSources(
          withTongueSpriteFallbacks(typedAppearance.sprites),
          typedAppearance.mirroredJawSource,
          typedAppearance.mirroredMouthSource,
        );
        return true;
      }

      // The pre-type appearance belonged to the original worm, now Licker.
      // Other worm types begin from the file-backed defaults until edited.
      if (game.activeWormTypeId !== WORM_TYPE_IDS.LICKER) {
        applyDefaultWormAppearance();
        return false;
      }

      const parsed = JSON.parse(
        window.localStorage.getItem(WORM_APPEARANCE_STORAGE_KEY) || "null",
      );
      const sources = parsed?.sprites;
      if (savedSpriteSetIsValid(sources, CORE_WORM_LAYER_NAMES)) {
        applyWormSpriteSources(
          withTongueSpriteFallbacks(sources),
          parsed?.mirroredJawSource,
          parsed?.mirroredMouthSource,
        );
        persistMigratedWormAppearance(
          typeStorageKey,
          withTongueSpriteFallbacks(sources),
          parsed?.mirroredJawSource,
          parsed?.mirroredMouthSource,
        );
        return true;
      }

      const singleMouth = JSON.parse(
        window.localStorage.getItem(PREVIOUS_WORM_APPEARANCE_STORAGE_KEY) ||
          "null",
      );
      const singleMouthSources = singleMouth?.sprites;
      const singleMouthLayerNames = [
        "headUpper",
        "headLower",
        "mouth",
        "segment",
        "segmentBand",
        "segmentOutline",
      ];
      if (savedSpriteSetIsValid(singleMouthSources, singleMouthLayerNames)) {
        const migratedSprites = await migrateSingleMouthAppearance(
          singleMouthSources,
        );
        applyWormSpriteSources(
          migratedSprites,
          singleMouth?.mirroredJawSource,
        );
        persistMigratedWormAppearance(
          typeStorageKey,
          migratedSprites,
          singleMouth?.mirroredJawSource,
        );
        return true;
      }

      const singleJawLayerNames = [
        "headUpper",
        "mouth",
        "segment",
        "segmentBand",
        "segmentOutline",
      ];
      for (const storageKey of [
        SINGLE_JAW_WORM_APPEARANCE_STORAGE_KEY,
        OLDER_WORM_APPEARANCE_STORAGE_KEY,
      ]) {
        const previous = JSON.parse(
          window.localStorage.getItem(storageKey) || "null",
        );
        const previousSources = previous?.sprites;
        if (
          !savedSpriteSetIsValid(
            previousSources,
            singleJawLayerNames,
          )
        ) {
          continue;
        }
        const migratedSprites = await migrateSingleJawAppearance(previousSources);
        applyWormSpriteSources(migratedSprites);
        persistMigratedWormAppearance(typeStorageKey, migratedSprites);
        return true;
      }

      const splitJaw = JSON.parse(
        window.localStorage.getItem(SPLIT_JAW_WORM_APPEARANCE_STORAGE_KEY) ||
          "null",
      );
      const splitJawSources = splitJaw?.sprites;
      if (
        savedSpriteSetIsValid(
          splitJawSources,
          singleMouthLayerNames,
        )
      ) {
        const migratedSprites = await migrateSplitJawAppearance(splitJawSources);
        applyWormSpriteSources(migratedSprites);
        persistMigratedWormAppearance(typeStorageKey, migratedSprites);
        return true;
      }

      const legacy = JSON.parse(
        window.localStorage.getItem(LEGACY_WORM_APPEARANCE_STORAGE_KEY) || "null",
      );
      const legacySources = legacy?.sprites;
      const legacyLayerNames = ["head", "segment", "segmentBand", "segmentOutline"];
      if (!savedSpriteSetIsValid(legacySources, legacyLayerNames)) {
        applyDefaultWormAppearance();
        return false;
      }

      const migratedSprites = await migrateLegacyWormAppearance(legacySources);
      applyWormSpriteSources(migratedSprites);
      persistMigratedWormAppearance(typeStorageKey, migratedSprites);
      return true;
    } catch {
      applyDefaultWormAppearance();
      return false;
    }
  }

  function wormLayerPair(layerName) {
    if (JAW_LAYER_NAMES.has(layerName)) return "jaw";
    if (MOUTH_LAYER_NAMES.has(layerName)) return "mouth";
    return null;
  }

  function mirroredSourceForPair(pairName) {
    if (pairName === "jaw") return wormPainter.mirroredJawSource;
    if (pairName === "mouth") return wormPainter.mirroredMouthSource;
    return null;
  }

  function wormLayerIsMirrorLocked(layerName) {
    const pairName = wormLayerPair(layerName);
    const mirroredSource = mirroredSourceForPair(pairName);
    return Boolean(mirroredSource && layerName !== mirroredSource);
  }

  function updateWormPaintStatus(message = "") {
    if (message) {
      wormPaintStatus.textContent = message;
      return;
    }
    const definition = WORM_LAYER_DEFINITIONS[wormPainter.activeLayer];
    const halfSide = HALF_WORM_LAYER_SIDES[wormPainter.activeLayer];
    const activeLayerIsHalf = Boolean(halfSide);
    const activePairName = wormLayerPair(wormPainter.activeLayer);
    const verticalSymmetry =
      wormPainter.symmetry === "vertical" || wormPainter.symmetry === "both";
    const pairIsMirroring =
      mirroredSourceForPair(activePairName) === wormPainter.activeLayer;
    const symmetryLabel =
      activeLayerIsHalf
        ? `${
            pairIsMirroring
              ? `Mirroring opposite ${activePairName}`
              : `Independent ${activePairName}`
          }${verticalSymmetry ? " + vertical symmetry" : ""}`
        : {
            off: "No symmetry",
            horizontal: "Horizontal symmetry",
            vertical: "Vertical symmetry",
            both: "Both-axis symmetry",
          }[wormPainter.symmetry];
    const visibleGuides = [];
    if (activeLayerIsHalf && wormPainter.showReflectionLine) {
      visibleGuides.push("Reflection line visible");
    }
    if (
      MOUTH_LAYER_NAMES.has(wormPainter.activeLayer) &&
      wormPainter.showMouthJawOverlay
    ) {
      visibleGuides.push("Open jaw overlay visible");
    }
    const toolDescription = wormPainter.tool === "fill"
      ? "Fill"
      : `${wormPainter.tool === "erase" ? "Erase" : "Paint"} ${wormPainter.brushSize} px`;
    wormPaintStatus.textContent =
      `${definition.label} · ${definition.width} × ${definition.height} · ` +
      `${toolDescription} · ` +
      symmetryLabel +
      (visibleGuides.length > 0 ? ` · ${visibleGuides.join(" · ")}` : "");
  }

  function drawWormPaintOverlays(definition) {
    if (
      MOUTH_LAYER_NAMES.has(wormPainter.activeLayer) &&
      wormPainter.showMouthJawOverlay
    ) {
      wormLayerContext.save();
      wormLayerContext.translate(definition.width * 0.5, definition.height * 0.5);
      wormLayerContext.globalAlpha = 0.68;
      drawJawHalves(
        wormLayerContext,
        wormPainter.layers,
        definition.width,
        definition.height,
        WORM_SPRITE_METRICS.jawHingeX * 2,
        MOUTH_BEHAVIOR.maxJawAngle,
        wormPainter.mirroredJawSource,
      );
      wormLayerContext.restore();
    }

    if (
      !HALF_WORM_LAYER_SIDES[wormPainter.activeLayer] ||
      !wormPainter.showReflectionLine
    ) {
      return;
    }

    const reflectionY = definition.height * 0.5;
    wormLayerContext.save();
    wormLayerContext.setLineDash([4, 3]);
    wormLayerContext.beginPath();
    wormLayerContext.moveTo(0, reflectionY);
    wormLayerContext.lineTo(definition.width, reflectionY);
    wormLayerContext.strokeStyle = palette.ink;
    wormLayerContext.lineWidth = 3;
    wormLayerContext.stroke();
    wormLayerContext.strokeStyle = palette.acid;
    wormLayerContext.lineWidth = 1;
    wormLayerContext.stroke();
    wormLayerContext.restore();
  }

  function syncWormEditorGuideControls() {
    const halfLayerIsActive = Boolean(
      HALF_WORM_LAYER_SIDES[wormPainter.activeLayer],
    );
    const activePairName = wormLayerPair(wormPainter.activeLayer);
    const mouthIsActive = activePairName === "mouth";
    wormReflectionToggle.hidden = !halfLayerIsActive;
    wormReflectionToggle.setAttribute(
      "aria-pressed",
      String(wormPainter.showReflectionLine),
    );
    wormMouthJawOverlayToggle.hidden = !mouthIsActive;
    wormMouthJawOverlayToggle.setAttribute(
      "aria-pressed",
      String(wormPainter.showMouthJawOverlay),
    );
    wormMirrorPairToggle.hidden = !activePairName;
    wormMirrorPairToggle.textContent =
      activePairName === "mouth" ? "Mirror this mouth" : "Mirror this jaw";
    wormMirrorPairToggle.setAttribute(
      "aria-pressed",
      String(
        mirroredSourceForPair(activePairName) === wormPainter.activeLayer,
      ),
    );
    document.querySelectorAll("[data-worm-layer]").forEach((button) => {
      const layerName = button.dataset.wormLayer;
      const abilityLocked =
        (layerName === "tongue" || layerName === "tongueRing") &&
        !wormHasAbility(WORM_ABILITIES.TONGUE);
      button.disabled = wormLayerIsMirrorLocked(layerName) || abilityLocked;
      button.title = abilityLocked
        ? `${activeWormType().label} does not use tongue layers`
        : "";
    });
  }

  function renderWormPaintCanvas() {
    const definition = WORM_LAYER_DEFINITIONS[wormPainter.activeLayer];
    const layer = wormPainter.layers[wormPainter.activeLayer];
    if (
      wormLayerCanvas.width !== definition.width ||
      wormLayerCanvas.height !== definition.height
    ) {
      wormLayerCanvas.width = definition.width;
      wormLayerCanvas.height = definition.height;
    }
    wormLayerContext.clearRect(0, 0, definition.width, definition.height);
    wormLayerContext.imageSmoothingEnabled = false;
    wormLayerContext.drawImage(layer, 0, 0);
    drawWormPaintOverlays(definition);
    updateWormPaintStatus();
  }

  function setWormPaintLayer(name) {
    if (!WORM_LAYER_DEFINITIONS[name]) return;
    if (wormLayerIsMirrorLocked(name)) return;
    if (
      (name === "tongue" || name === "tongueRing") &&
      !wormHasAbility(WORM_ABILITIES.TONGUE)
    ) {
      return;
    }
    wormPainter.activeLayer = name;
    document.querySelectorAll("[data-worm-layer]").forEach((button) => {
      button.classList.toggle("active", button.dataset.wormLayer === name);
    });
    syncWormEditorGuideControls();
    renderWormPaintCanvas();
  }

  function setWormPaintTool(tool) {
    if (tool !== "paint" && tool !== "erase" && tool !== "fill") return;
    wormPainter.tool = tool;
    document.querySelectorAll("[data-worm-tool]").forEach((button) => {
      button.classList.toggle("active", button.dataset.wormTool === tool);
    });
    updateWormPaintStatus();
  }

  function baseBodyRadius(index, segmentCount, outline = false) {
    const progress = index / Math.max(1, segmentCount - 1);
    const radius =
      WORM_SHAPE.tailRadius +
      WORM_SHAPE.bodyRadius * Math.pow(1 - progress, 0.65);
    return radius + (outline ? WORM_SHAPE.bodyOutline : 0);
  }

  function previewBodyRadius(index, segmentCount, outline = false) {
    return baseBodyRadius(index, segmentCount, outline);
  }

  function createBodyCompositeSprite(
    segmentImage,
    outlineImage,
    index,
    segmentCount,
  ) {
    const size = WORM_LAYER_DEFINITIONS.segment.width;
    const sprite =
      typeof OffscreenCanvas === "function"
        ? new OffscreenCanvas(size, size)
        : document.createElement("canvas");
    sprite.width = size;
    sprite.height = size;
    const spriteContext = sprite.getContext("2d");
    const fillRadius = baseBodyRadius(index, segmentCount);
    const outlineRadius = baseBodyRadius(index, segmentCount, true);
    const normalizedFillRadius =
      fillRadius / WORM_SPRITE_METRICS.segmentFillRadius;
    const normalizedOutlineRadius =
      outlineRadius / WORM_SPRITE_METRICS.segmentOutlineRadius;
    const fillScale = clamp(
      normalizedFillRadius / Math.max(0.0001, normalizedOutlineRadius),
      0,
      1,
    );
    const fillSize = size * fillScale;
    const fillOffset = (size - fillSize) * 0.5;

    spriteContext.imageSmoothingEnabled = true;
    spriteContext.drawImage(outlineImage, 0, 0, size, size);
    spriteContext.drawImage(
      segmentImage,
      fillOffset,
      fillOffset,
      fillSize,
      fillSize,
    );
    return typeof sprite.transferToImageBitmap === "function"
      ? sprite.transferToImageBitmap()
      : sprite;
  }

  function bodyCompositeSpriteFromCache(
    cache,
    revision,
    segmentImage,
    outlineImage,
    index,
    segmentCount,
  ) {
    if (
      cache.revision !== revision ||
      cache.segmentCount !== segmentCount
    ) {
      cache.sprites.forEach((sprite) => sprite?.close?.());
      cache.revision = revision;
      cache.segmentCount = segmentCount;
      cache.sprites = new Array(segmentCount);
    }
    if (!cache.sprites[index]) {
      cache.sprites[index] = createBodyCompositeSprite(
        segmentImage,
        outlineImage,
        index,
        segmentCount,
      );
    }
    return cache.sprites[index];
  }

  function previewBodyCompositeSprite(index, segmentCount) {
    return bodyCompositeSpriteFromCache(
      wormPreviewBodyCompositeCache,
      wormPainter.bodyCompositeRevision,
      wormPainter.layers.segment,
      wormPainter.layers.segmentOutline,
      index,
      segmentCount,
    );
  }

  function gameplayBodyCompositeSprite(index, segmentCount) {
    return bodyCompositeSpriteFromCache(
      wormBodyCompositeCache,
      wormBodySpriteRevision,
      wormSprites.segment,
      wormSprites.segmentOutline,
      index,
      segmentCount,
    );
  }

  function previewSegmentAngle(segments, index) {
    const previous = segments[Math.max(0, index - 1)];
    const next = segments[Math.min(segments.length - 1, index + 1)];
    return Math.atan2(previous.y - next.y, previous.x - next.x);
  }

  function previewRandomRange(minimum, maximum) {
    return randomRange(minimum, maximum);
  }

  function previewAngleDifference(target, current) {
    const difference = target - current;
    return Math.atan2(Math.sin(difference), Math.cos(difference));
  }

  function beginWormPreviewTongueExtension() {
    const simulation = wormPreviewSimulation;
    simulation.tonguePhase = "extending";
    simulation.tongueProgress = 0;
    simulation.tonguePhaseTimer = 0;
    simulation.tongueAimOffset = previewRandomRange(
      WORM_PREVIEW_TONGUE.minimumAimOffset,
      WORM_PREVIEW_TONGUE.maximumAimOffset,
    );
    simulation.tongueSwingOffset = 0;
    simulation.tongueSwingVelocity = 0;
    simulation.tongueSwingTarget = previewRandomRange(
      WORM_PREVIEW_TONGUE.minimumSwingTarget,
      WORM_PREVIEW_TONGUE.maximumSwingTarget,
    );
    simulation.tongueSwingTimer = previewRandomRange(
      WORM_PREVIEW_TONGUE.minimumSwingTargetDuration,
      WORM_PREVIEW_TONGUE.maximumSwingTargetDuration,
    );
  }

  function updateWormPreviewTongue(dt) {
    const simulation = wormPreviewSimulation;
    if (!wormHasAbility(WORM_ABILITIES.TONGUE)) {
      simulation.tonguePhase = "waiting";
      simulation.tongueProgress = 0;
      simulation.tonguePhaseTimer = 0;
      simulation.tongueSwingOffset = 0;
      simulation.tongueSwingVelocity = 0;
      return;
    }
    simulation.tonguePhaseTimer -= dt;

    if (simulation.tonguePhase === "waiting") {
      simulation.tongueProgress = 0;
      if (simulation.tonguePhaseTimer <= 0) {
        beginWormPreviewTongueExtension();
      }
      return;
    }

    simulation.tongueSwingTimer -= dt;
    if (simulation.tongueSwingTimer <= 0) {
      simulation.tongueSwingTarget =
        simulation.tonguePhase === "retracting"
          ? 0
          : previewRandomRange(
              WORM_PREVIEW_TONGUE.minimumSwingTarget,
              WORM_PREVIEW_TONGUE.maximumSwingTarget,
            );
      simulation.tongueSwingTimer = previewRandomRange(
        WORM_PREVIEW_TONGUE.minimumSwingTargetDuration,
        WORM_PREVIEW_TONGUE.maximumSwingTargetDuration,
      );
    }
    simulation.tongueSwingVelocity +=
      (simulation.tongueSwingTarget - simulation.tongueSwingOffset) *
      WORM_PREVIEW_TONGUE.swingAcceleration *
      dt;
    simulation.tongueSwingVelocity *= Math.exp(
      -WORM_PREVIEW_TONGUE.swingDamping * dt,
    );
    simulation.tongueSwingVelocity = clamp(
      simulation.tongueSwingVelocity,
      -WORM_PREVIEW_TONGUE.maximumSwingSpeed,
      WORM_PREVIEW_TONGUE.maximumSwingSpeed,
    );
    simulation.tongueSwingOffset += simulation.tongueSwingVelocity * dt;

    if (simulation.tonguePhase === "extending") {
      simulation.tongueProgress = Math.min(
        1,
        simulation.tongueProgress + WORM_PREVIEW_TONGUE.extendRate * dt,
      );
      if (simulation.tongueProgress >= 1) {
        simulation.tonguePhase = "swinging";
        simulation.tonguePhaseTimer = previewRandomRange(
          WORM_PREVIEW_TONGUE.minimumSwingDuration,
          WORM_PREVIEW_TONGUE.maximumSwingDuration,
        );
      }
      return;
    }

    if (simulation.tonguePhase === "swinging") {
      simulation.tongueProgress = 1;
      if (simulation.tonguePhaseTimer <= 0) {
        simulation.tonguePhase = "retracting";
        simulation.tongueSwingTarget = 0;
      }
      return;
    }

    simulation.tongueProgress = Math.max(
      0,
      simulation.tongueProgress - WORM_PREVIEW_TONGUE.retractRate * dt,
    );
    if (simulation.tongueProgress <= 0) {
      simulation.tonguePhase = "waiting";
      simulation.tonguePhaseTimer = previewRandomRange(
        WORM_PREVIEW_TONGUE.minimumWaitDuration,
        WORM_PREVIEW_TONGUE.maximumWaitDuration,
      );
      simulation.tongueSwingOffset = 0;
      simulation.tongueSwingVelocity = 0;
      simulation.tongueSwingTarget = 0;
    }
  }

  function initializeWormPreviewSimulation() {
    const simulation = wormPreviewSimulation;
    simulation.initialized = true;
    simulation.time = 0;
    simulation.lastBreachTime = -3;
    simulation.head.x = 0;
    simulation.head.y = 82;
    simulation.previous.x = simulation.head.x;
    simulation.previous.y = simulation.head.y;
    simulation.heading = -0.46;
    simulation.speed = 145;
    simulation.velocity.x = Math.cos(simulation.heading) * simulation.speed;
    simulation.velocity.y = Math.sin(simulation.heading) * simulation.speed;
    simulation.inGround = true;
    simulation.phase = "accelerate";
    simulation.phaseTimer = previewRandomRange(0.7, 1.25);
    simulation.throttle = 1;
    simulation.turnInput = previewRandomRange(-0.35, 0.35);
    simulation.targetHeading = null;
    simulation.mouthOpen = 0.42;
    simulation.tonguePhase = "waiting";
    simulation.tongueProgress = 0;
    simulation.tonguePhaseTimer = previewRandomRange(0.2, 0.65);
    simulation.tongueAimOffset = 0;
    simulation.tongueSwingOffset = 0;
    simulation.tongueSwingVelocity = 0;
    simulation.tongueSwingTarget = 0;
    simulation.tongueSwingTimer = 0;
    simulation.segments = Array.from(
      { length: WORM_SHAPE.segmentCount },
      (_, index) => ({
        x:
          simulation.head.x -
          Math.cos(simulation.heading) * index * WORM_SHAPE.segmentSpacing,
        y:
          simulation.head.y -
          Math.sin(simulation.heading) * index * WORM_SHAPE.segmentSpacing,
      }),
    );
    simulation.bodyPath = [];
    const bodyLength =
      (simulation.segments.length - 1) * WORM_SHAPE.segmentSpacing;
    for (let distance = bodyLength; distance > 0; distance -= 3) {
      simulation.bodyPath.push({
        x: simulation.head.x - Math.cos(simulation.heading) * distance,
        y: simulation.head.y - Math.sin(simulation.heading) * distance,
      });
    }
    simulation.bodyPath.push({
      x: simulation.head.x,
      y: simulation.head.y,
    });
    simulation.camera.x =
      simulation.head.x - wormPreviewCanvas.width * 0.66;
    simulation.camera.y =
      simulation.head.y - wormPreviewCanvas.height * 0.56;
  }

  function chooseWormPreviewBehavior(forceLaunch = false) {
    const simulation = wormPreviewSimulation;
    if (!simulation.inGround) {
      simulation.phase = "air-turn";
      simulation.phaseTimer = previewRandomRange(0.45, 1.2);
      simulation.throttle = 0;
      simulation.turnInput = previewRandomRange(-0.9, 0.9);
      simulation.targetHeading = null;
      return;
    }

    const depth = simulation.head.y - WORM_PREVIEW_MOTION.groundY;
    const breachIsDue =
      simulation.time - simulation.lastBreachTime >=
      WORM_PREVIEW_MOTION.forcedBreachInterval;
    if (forceLaunch || depth > 145 || (breachIsDue && depth > 28)) {
      simulation.phase = "launch";
      simulation.phaseTimer = previewRandomRange(1.8, 2.8);
      simulation.throttle = 1;
      simulation.turnInput = 0;
      const launchAngle = previewRandomRange(0.58, 0.96);
      simulation.targetHeading =
        Math.cos(simulation.heading) >= 0
          ? -launchAngle
          : -Math.PI + launchAngle;
      return;
    }

    const behavior = Math.random();
    simulation.targetHeading = null;
    if (behavior < 0.27) {
      simulation.phase = "accelerate";
      simulation.phaseTimer = previewRandomRange(0.7, 1.7);
      simulation.throttle = 1;
      simulation.turnInput = previewRandomRange(-0.55, 0.55);
    } else if (behavior < 0.49) {
      simulation.phase = "coast";
      simulation.phaseTimer = previewRandomRange(0.65, 1.45);
      simulation.throttle = 0;
      simulation.turnInput = previewRandomRange(-0.4, 0.4);
    } else if (behavior < 0.66) {
      simulation.phase = "brake";
      simulation.phaseTimer = previewRandomRange(0.35, 0.8);
      simulation.throttle = -1;
      simulation.turnInput = previewRandomRange(-0.28, 0.28);
    } else if (behavior < 0.88) {
      simulation.phase = "turn";
      simulation.phaseTimer = previewRandomRange(0.55, 1.35);
      simulation.throttle = Math.random() > 0.5 ? 1 : 0;
      simulation.turnInput =
        (Math.random() > 0.5 ? 1 : -1) * previewRandomRange(0.5, 1);
    } else {
      chooseWormPreviewBehavior(true);
    }
  }

  function recordWormPreviewPath() {
    const simulation = wormPreviewSimulation;
    const last = simulation.bodyPath[simulation.bodyPath.length - 1];
    const deltaX = simulation.head.x - last.x;
    const deltaY = simulation.head.y - last.y;
    const distance = magnitude(deltaX, deltaY);
    if (distance < 0.01) return;

    const steps = Math.max(1, Math.ceil(distance / 3));
    for (let step = 1; step <= steps; step += 1) {
      const amount = step / steps;
      simulation.bodyPath.push({
        x: lerp(last.x, simulation.head.x, amount),
        y: lerp(last.y, simulation.head.y, amount),
      });
    }

    const keepLength =
      simulation.segments.length * WORM_SHAPE.segmentSpacing + 48;
    let retainedLength = 0;
    let startIndex = simulation.bodyPath.length - 1;
    while (startIndex > 0 && retainedLength < keepLength) {
      const newer = simulation.bodyPath[startIndex];
      const older = simulation.bodyPath[startIndex - 1];
      retainedLength += magnitude(newer.x - older.x, newer.y - older.y);
      startIndex -= 1;
    }
    if (startIndex > 0) simulation.bodyPath.splice(0, startIndex);
  }

  function pointAlongWormPreviewPath(distanceBehindHead) {
    const path = wormPreviewSimulation.bodyPath;
    let remaining = distanceBehindHead;
    for (let index = path.length - 1; index > 0; index -= 1) {
      const newer = path[index];
      const older = path[index - 1];
      const sectionLength = magnitude(newer.x - older.x, newer.y - older.y);
      if (sectionLength >= remaining) {
        const amount = sectionLength > 0 ? remaining / sectionLength : 0;
        return {
          x: lerp(newer.x, older.x, amount),
          y: lerp(newer.y, older.y, amount),
        };
      }
      remaining -= sectionLength;
    }
    return path[0];
  }

  function updateWormPreviewSegments() {
    wormPreviewSimulation.segments.forEach((segment, index) => {
      const pathPoint = pointAlongWormPreviewPath(
        index * WORM_SHAPE.segmentSpacing,
      );
      segment.x = pathPoint.x;
      segment.y = pathPoint.y;
    });
  }

  function updateWormPreviewSimulation(dt) {
    const simulation = wormPreviewSimulation;
    if (!simulation.initialized) initializeWormPreviewSimulation();
    simulation.time += dt;
    simulation.phaseTimer -= dt;

    const breachIsDue =
      simulation.inGround &&
      simulation.time - simulation.lastBreachTime >=
        WORM_PREVIEW_MOTION.forcedBreachInterval &&
      simulation.head.y > WORM_PREVIEW_MOTION.groundY + 28;
    if (breachIsDue && simulation.phase !== "launch") {
      chooseWormPreviewBehavior(true);
    } else if (simulation.phaseTimer <= 0) {
      if (simulation.phase === "launch" && simulation.inGround) {
        chooseWormPreviewBehavior(true);
      } else {
        chooseWormPreviewBehavior();
      }
    }

    simulation.previous.x = simulation.head.x;
    simulation.previous.y = simulation.head.y;
    const wasInGround = simulation.inGround;

    if (simulation.inGround) {
      const turnInput =
        simulation.targetHeading === null
          ? simulation.turnInput
          : clamp(
              previewAngleDifference(
                simulation.targetHeading,
                simulation.heading,
              ) / 0.42,
              -1,
              1,
            );
      const speedTurnFactor = lerp(
        1,
        0.65,
        clamp((simulation.speed - 180) / 220, 0, 1),
      );
      simulation.heading +=
        turnInput *
        WORM_PREVIEW_MOTION.groundTurnSpeed *
        speedTurnFactor *
        dt;

      if (simulation.throttle > 0.5) {
        simulation.speed += WORM_PREVIEW_MOTION.acceleration * dt;
      } else if (simulation.throttle < -0.5) {
        simulation.speed -= WORM_PREVIEW_MOTION.brakeDeceleration * dt;
      } else {
        simulation.speed -= WORM_PREVIEW_MOTION.coastDeceleration * dt;
      }
      simulation.speed = clamp(
        simulation.speed,
        WORM_PREVIEW_MOTION.minimumSpeed,
        WORM_PREVIEW_MOTION.maximumSpeed,
      );
      simulation.velocity.x = Math.cos(simulation.heading) * simulation.speed;
      simulation.velocity.y = Math.sin(simulation.heading) * simulation.speed;
    } else {
      const currentSpeed = magnitude(
        simulation.velocity.x,
        simulation.velocity.y,
      );
      if (currentSpeed > 0.5) {
        const turnForceX =
          (-simulation.velocity.y / currentSpeed) * simulation.turnInput;
        const turnForceY =
          (simulation.velocity.x / currentSpeed) * simulation.turnInput;
        simulation.velocity.x +=
          turnForceX * WORM_PREVIEW_MOTION.airTurnForce * dt;
        simulation.velocity.y +=
          turnForceY * WORM_PREVIEW_MOTION.airTurnForce * dt;
      }
      simulation.velocity.y += WORM_PREVIEW_MOTION.gravity * dt;
      simulation.speed = magnitude(
        simulation.velocity.x,
        simulation.velocity.y,
      );
      if (simulation.speed > 0.5) {
        simulation.heading = Math.atan2(
          simulation.velocity.y,
          simulation.velocity.x,
        );
      }
    }

    simulation.head.x += simulation.velocity.x * dt;
    simulation.head.y += simulation.velocity.y * dt;
    if (simulation.head.y < WORM_PREVIEW_MOTION.minimumDepth) {
      simulation.head.y = WORM_PREVIEW_MOTION.minimumDepth;
      simulation.velocity.y = Math.abs(simulation.velocity.y) * 0.45;
    }

    simulation.inGround =
      simulation.head.y >= WORM_PREVIEW_MOTION.groundY;
    if (wasInGround && !simulation.inGround) {
      simulation.lastBreachTime = simulation.time;
      chooseWormPreviewBehavior();
    } else if (!wasInGround && simulation.inGround) {
      simulation.speed = clamp(
        magnitude(simulation.velocity.x, simulation.velocity.y),
        WORM_PREVIEW_MOTION.minimumSpeed,
        WORM_PREVIEW_MOTION.maximumSpeed,
      );
      simulation.heading = Math.atan2(
        simulation.velocity.y,
        simulation.velocity.x,
      );
      simulation.phase = "dive";
      simulation.phaseTimer = previewRandomRange(0.45, 0.9);
      simulation.throttle = Math.random() > 0.45 ? 1 : 0;
      simulation.turnInput = previewRandomRange(-0.45, 0.45);
      simulation.targetHeading = null;
    }
    if (
      simulation.inGround &&
      simulation.head.y > WORM_PREVIEW_MOTION.maximumDepth &&
      simulation.phase !== "launch"
    ) {
      chooseWormPreviewBehavior(true);
    }

    recordWormPreviewPath();
    updateWormPreviewSegments();
    updateWormPreviewTongue(dt);
    const idleMouthTarget =
      0.18 +
      0.68 *
        (0.5 + 0.5 * Math.sin(simulation.time * 1.9 + Math.sin(simulation.time)));
    const mouthTarget =
      simulation.tongueProgress > 0.001
        ? Math.max(0.9, idleMouthTarget)
        : idleMouthTarget;
    simulation.mouthOpen = moveToward(
      simulation.mouthOpen,
      mouthTarget,
      1.8 * dt,
    );

    const targetCameraX =
      simulation.head.x - wormPreviewCanvas.width * 0.66;
    const targetCameraY =
      simulation.head.y - wormPreviewCanvas.height * 0.56;
    const cameraResponse = 1 - Math.exp(-5.5 * dt);
    simulation.camera.x = lerp(
      simulation.camera.x,
      targetCameraX,
      cameraResponse,
    );
    simulation.camera.y = lerp(
      simulation.camera.y,
      targetCameraY,
      cameraResponse,
    );
  }

  function drawPreviewSprite(
    image,
    x,
    y,
    angle,
    visibleWidth,
    visibleHeight,
    sourceRadius,
    minimumRenderedWidth = 0,
  ) {
    const sourceScale = WORM_SPRITE_METRICS.segmentCanvasSize / (sourceRadius * 2);
    const width = Math.max(
      visibleWidth * sourceScale,
      minimumRenderedWidth,
    );
    const height = visibleHeight * sourceScale;
    wormPreviewContext.save();
    wormPreviewContext.translate(x, y);
    wormPreviewContext.rotate(angle);
    wormPreviewContext.drawImage(image, -width * 0.5, -height * 0.5, width, height);
    wormPreviewContext.restore();
  }

  function createSparseBodyRenderPath(segments) {
    const cumulativeDistances = new Float32Array(segments.length);
    const minimumRenderedWidths = new Float32Array(segments.length);
    const renderIndices = [];
    if (segments.length === 0) {
      return { renderIndices, minimumRenderedWidths };
    }
    for (let index = 0; index < segments.length; index += 1) {
      if (index > 0) {
        cumulativeDistances[index] =
          cumulativeDistances[index - 1] +
          magnitude(
            segments[index].x - segments[index - 1].x,
            segments[index].y - segments[index - 1].y,
          );
      }
      if (index % BODY_RENDER_RULES.visualSegmentStride === 0) {
        renderIndices.push(index);
      }
    }
    const tailIndex = segments.length - 1;
    if (renderIndices[renderIndices.length - 1] !== tailIndex) {
      renderIndices.push(tailIndex);
    }
    for (
      let renderIndex = 0;
      renderIndex < renderIndices.length;
      renderIndex += 1
    ) {
      const index = renderIndices[renderIndex];
      const previousIndex = renderIndices[Math.max(0, renderIndex - 1)];
      const nextIndex = renderIndices[
        Math.min(renderIndices.length - 1, renderIndex + 1)
      ];
      const previousDistance =
        cumulativeDistances[index] - cumulativeDistances[previousIndex];
      const nextDistance =
        cumulativeDistances[nextIndex] - cumulativeDistances[index];
      minimumRenderedWidths[index] =
        Math.max(previousDistance, nextDistance) *
        BODY_RENDER_RULES.longitudinalOverlap;
    }
    return { renderIndices, minimumRenderedWidths };
  }

  function createPreviewBodySpriteLayout(segments) {
    const sparsePath = createSparseBodyRenderPath(segments);
    return {
      ...sparsePath,
      fillRadii: segments.map((_, index) =>
        previewBodyRadius(index, segments.length),
      ),
      outlineRadii: segments.map((_, index) =>
        previewBodyRadius(index, segments.length, true),
      ),
      segmentAngles: segments.map((_, index) =>
        previewSegmentAngle(segments, index),
      ),
    };
  }

  function drawPreviewCompositeBody(segments, layout) {
    for (
      let renderIndex = layout.renderIndices.length - 1;
      renderIndex >= 0;
      renderIndex -= 1
    ) {
      const index = layout.renderIndices[renderIndex];
      const radius = layout.outlineRadii[index];
      drawPreviewSprite(
        previewBodyCompositeSprite(index, segments.length),
        segments[index].x,
        segments[index].y,
        layout.segmentAngles[index],
        radius * 2,
        radius * 2,
        WORM_SPRITE_METRICS.segmentOutlineRadius,
        layout.minimumRenderedWidths[index],
      );
    }
  }

  function drawJawHalves(
    targetContext,
    sprites,
    headWidth,
    headHeight,
    hingeX,
    jawAngle,
    mirroredJawSource = null,
  ) {
    const seamOverlap =
      HALF_SPRITE_SEAM_OVERLAP *
      (headHeight / WORM_SPRITE_METRICS.headHeight);
    const drawJawHalf = (image, sourceSide, rotation, flipVertically) => {
      const sourceWidth = image.naturalWidth || image.width;
      const sourceHeight = image.naturalHeight || image.height;
      const sourceHalfHeight = sourceHeight * 0.5;
      const sourceY = sourceSide === "upper" ? 0 : sourceHalfHeight;
      const destinationY =
        sourceSide === "upper" ? -headHeight * 0.5 : -seamOverlap;
      targetContext.save();
      targetContext.translate(hingeX, 0);
      targetContext.rotate(rotation);
      targetContext.translate(-hingeX, 0);
      if (flipVertically) targetContext.scale(1, -1);
      targetContext.drawImage(
        image,
        0,
        sourceY,
        sourceWidth,
        sourceHalfHeight,
        -headWidth * 0.5,
        destinationY,
        headWidth,
        headHeight * 0.5 + seamOverlap,
      );
      targetContext.restore();
    };

    drawJawHalf(
      mirroredJawSource === "headLower"
        ? sprites.headLower
        : sprites.headUpper,
      mirroredJawSource === "headLower" ? "lower" : "upper",
      -jawAngle,
      mirroredJawSource === "headLower",
    );
    drawJawHalf(
      mirroredJawSource === "headUpper"
        ? sprites.headUpper
        : sprites.headLower,
      mirroredJawSource === "headUpper" ? "upper" : "lower",
      jawAngle,
      mirroredJawSource === "headUpper",
    );
  }

  function drawMouthHalves(
    targetContext,
    sprites,
    visibleWidth,
    visibleHeight,
    hingeX,
    jawAngle,
    mirroredMouthSource = null,
  ) {
    const mouthClosingAngle = MOUTH_BEHAVIOR.maxJawAngle - jawAngle;
    const seamOverlap =
      HALF_SPRITE_SEAM_OVERLAP *
      (visibleHeight / WORM_SPRITE_METRICS.headHeight);
    const drawMouthHalf = (
      image,
      sourceSide,
      rotation,
      flipVertically,
    ) => {
      const sourceWidth = image.naturalWidth || image.width;
      const sourceHeight = image.naturalHeight || image.height;
      const sourceHalfHeight = sourceHeight * 0.5;
      const sourceY = sourceSide === "upper" ? 0 : sourceHalfHeight;
      const destinationY =
        sourceSide === "upper" ? -visibleHeight * 0.5 : -seamOverlap;
      targetContext.save();
      targetContext.translate(hingeX, 0);
      targetContext.rotate(rotation);
      targetContext.translate(-hingeX, 0);
      if (flipVertically) targetContext.scale(1, -1);
      targetContext.drawImage(
        image,
        0,
        sourceY,
        sourceWidth,
        sourceHalfHeight,
        -visibleWidth * 0.5,
        destinationY,
        visibleWidth,
        visibleHeight * 0.5 + seamOverlap,
      );
      targetContext.restore();
    };

    drawMouthHalf(
      mirroredMouthSource === "mouthLower"
        ? sprites.mouthLower
        : sprites.mouthUpper,
      mirroredMouthSource === "mouthLower" ? "lower" : "upper",
      mouthClosingAngle,
      mirroredMouthSource === "mouthLower",
    );
    drawMouthHalf(
      mirroredMouthSource === "mouthUpper"
        ? sprites.mouthUpper
        : sprites.mouthLower,
      mirroredMouthSource === "mouthUpper" ? "upper" : "lower",
      -mouthClosingAngle,
      mirroredMouthSource === "mouthUpper",
    );
  }

  function drawJawSpriteSet(
    targetContext,
    sprites,
    x,
    y,
    angle,
    openness,
    scale = 1,
    mirroredJawSource = null,
    mirroredMouthSource = null,
    jawAngleMultiplier = 1,
  ) {
    const headWidth = WORM_SPRITE_METRICS.headWidth * scale;
    const headHeight = WORM_SPRITE_METRICS.headHeight * scale;
    const hingeX = WORM_SPRITE_METRICS.jawHingeX * scale;
    const jawAngle =
      MOUTH_BEHAVIOR.maxJawAngle *
      clamp(openness, 0, 1) *
      Math.max(0, jawAngleMultiplier);
    const facingLeft = Math.cos(angle) < 0;

    targetContext.save();
    targetContext.translate(x, y);
    // Keep the side-view artwork upright while preserving the head's true
    // forward axis. A plain half-turn would place the upper mouth underneath
    // the lower one whenever the worm faces left.
    targetContext.rotate(facingLeft ? angle + Math.PI : angle);
    if (facingLeft) targetContext.scale(-1, 1);
    drawMouthHalves(
      targetContext,
      sprites,
      headWidth,
      headHeight,
      hingeX,
      jawAngle,
      mirroredMouthSource,
    );
    drawJawHalves(
      targetContext,
      sprites,
      headWidth,
      headHeight,
      hingeX,
      jawAngle,
      mirroredJawSource,
    );
    targetContext.restore();
  }

  function drawPreviewJawReflectionLine(x, y, angle) {
    const halfWidth = WORM_SPRITE_METRICS.headWidth * 0.5;
    wormPreviewContext.save();
    wormPreviewContext.translate(x, y);
    wormPreviewContext.rotate(angle);
    wormPreviewContext.setLineDash([6, 4]);
    wormPreviewContext.beginPath();
    wormPreviewContext.moveTo(-halfWidth, 0);
    wormPreviewContext.lineTo(halfWidth, 0);
    wormPreviewContext.strokeStyle = palette.ink;
    wormPreviewContext.lineWidth = 4;
    wormPreviewContext.stroke();
    wormPreviewContext.strokeStyle = palette.acid;
    wormPreviewContext.lineWidth = 2;
    wormPreviewContext.stroke();
    wormPreviewContext.restore();
  }

  function wormPreviewDetailNoise(column, row, salt = 0) {
    const hash =
      (Math.imul(column + 193 + salt, 374761393) ^
        Math.imul(row + 977 - salt, 668265263)) >>>
      0;
    return hash / 4294967296;
  }

  function drawWormPreviewBackground() {
    const simulation = wormPreviewSimulation;
    const width = wormPreviewCanvas.width;
    const height = wormPreviewCanvas.height;
    wormPreviewContext.clearRect(0, 0, width, height);
    wormPreviewContext.fillStyle = palette.sky;
    wormPreviewContext.fillRect(0, 0, width, height);

    wormPreviewContext.save();
    wormPreviewContext.globalAlpha = 0.72;
    wormPreviewContext.fillStyle = palette.sun;
    wormPreviewContext.beginPath();
    wormPreviewContext.arc(width * 0.83, 64, 31, 0, TAU);
    wormPreviewContext.fill();
    wormPreviewContext.restore();

    const cloudSpacing = 310;
    const firstCloud = Math.floor(simulation.camera.x / cloudSpacing) - 1;
    const lastCloud = Math.ceil(
      (simulation.camera.x + width) / cloudSpacing,
    );
    for (let cloudIndex = firstCloud; cloudIndex <= lastCloud; cloudIndex += 1) {
      const cloudNoise = wormPreviewDetailNoise(cloudIndex, -4, 13);
      const worldX = cloudIndex * cloudSpacing + cloudNoise * 120;
      const worldY = -82 - cloudNoise * 74;
      const screenX = worldX - simulation.camera.x;
      const screenY = worldY - simulation.camera.y;
      if (screenY < -30 || screenY > height + 30) continue;
      wormPreviewContext.save();
      wormPreviewContext.globalAlpha = 0.3;
      wormPreviewContext.fillStyle = palette.cream;
      wormPreviewContext.beginPath();
      wormPreviewContext.ellipse(screenX, screenY, 42, 8, 0, 0, TAU);
      wormPreviewContext.ellipse(screenX - 12, screenY - 6, 17, 12, 0, 0, TAU);
      wormPreviewContext.ellipse(screenX + 10, screenY - 7, 23, 14, 0, 0, TAU);
      wormPreviewContext.fill();
      wormPreviewContext.restore();
    }

    const surfaceY = WORM_PREVIEW_MOTION.groundY - simulation.camera.y;
    if (surfaceY < height) {
      const groundTop = Math.max(0, surfaceY);
      wormPreviewContext.fillStyle = palette.soil;
      wormPreviewContext.fillRect(0, groundTop, width, height - groundTop);

      const detailSpacing = 48;
      const startColumn = Math.floor(simulation.camera.x / detailSpacing) - 1;
      const endColumn = Math.ceil(
        (simulation.camera.x + width) / detailSpacing,
      );
      const startRow = Math.max(
        0,
        Math.floor(
          Math.max(WORM_PREVIEW_MOTION.groundY, simulation.camera.y) /
            detailSpacing,
        ) - 1,
      );
      const endRow = Math.ceil(
        (simulation.camera.y + height) / detailSpacing,
      );
      wormPreviewContext.save();
      for (let row = startRow; row <= endRow; row += 1) {
        for (let column = startColumn; column <= endColumn; column += 1) {
          const noise = wormPreviewDetailNoise(column, row);
          const worldX = (column + 0.15 + noise * 0.7) * detailSpacing;
          const worldY = (row + 0.18 + noise * 0.64) * detailSpacing;
          if (worldY < WORM_PREVIEW_MOTION.groundY) continue;
          const x = worldX - simulation.camera.x;
          const y = worldY - simulation.camera.y;
          wormPreviewContext.globalAlpha = 0.14 + noise * 0.14;
          wormPreviewContext.fillStyle =
            noise > 0.5 ? palette.soilLight : palette.soilDark;
          if (noise > 0.72) {
            wormPreviewContext.fillRect(x, y, 7 + noise * 8, 1.5);
          } else {
            wormPreviewContext.beginPath();
            wormPreviewContext.arc(x, y, 1 + noise * 1.6, 0, TAU);
            wormPreviewContext.fill();
          }
        }
      }
      wormPreviewContext.restore();
    }

    if (surfaceY >= -6 && surfaceY <= height + 6) {
      wormPreviewContext.fillStyle = palette.ink;
      wormPreviewContext.fillRect(0, surfaceY - 3, width, 5);
    }
  }

  function drawWormEditorPreviewTongue(
    simulation,
    headX,
    headY,
    headAngle,
  ) {
    if (
      !wormHasAbility(WORM_ABILITIES.TONGUE) ||
      simulation.tongueProgress <= 0.001
    ) {
      return;
    }
    const halfHeadWidth = WORM_SPRITE_METRICS.headWidth * 0.5;
    const forwardX = Math.cos(headAngle);
    const forwardY = Math.sin(headAngle);
    const back = {
      x: headX - forwardX * halfHeadWidth,
      y: headY - forwardY * halfHeadWidth,
    };
    const front = {
      x: headX + forwardX * halfHeadWidth,
      y: headY + forwardY * halfHeadWidth,
    };
    const aimAngle =
      headAngle + simulation.tongueAimOffset + simulation.tongueSwingOffset;
    const previewWormLength =
      Math.max(0, simulation.segments.length - 1) *
        WORM_SHAPE.segmentSpacing +
      WORM_SHAPE.headOffset +
      WORM_SPRITE_METRICS.headWidth * 0.5 +
      WORM_SHAPE.tailRadius;
    const curveLength =
      Math.max(
        0,
        previewWormLength * TONGUE_RULES.lengthMultiplier -
          halfHeadWidth * 2,
      ) * simulation.tongueProgress;
    const target = {
      x: front.x + Math.cos(aimAngle) * curveLength,
      y: front.y + Math.sin(aimAngle) * curveLength,
    };
    const geometry = {
      back,
      front,
      route: segmentedTongueRoute(
        front,
        headAngle,
        target,
        curveLength,
        WORM_SHAPE.segmentSpacing * TONGUE_RULES.segmentSpacingMultiplier,
      ),
    };
    const points = tongueCenterlinePoints(geometry);
    fillTaperedTongue(
      points,
      TONGUE_RULES.outerBaseWidth,
      palette.wormDark,
      wormPreviewContext,
      1,
    );
    fillTaperedTongue(
      points,
      TONGUE_RULES.innerBaseWidth,
      palette.tongue,
      wormPreviewContext,
      1,
    );
    drawTongueTextureSegments(
      wormPreviewContext,
      points,
      wormPainter.layers.tongue,
      1,
      WORM_SHAPE.segmentSpacing * TONGUE_RULES.segmentSpacingMultiplier,
    );
    drawTongueRingTextureSegments(
      wormPreviewContext,
      points,
      wormPainter.layers.tongueRing,
      1,
      WORM_SHAPE.segmentSpacing * TONGUE_RULES.segmentSpacingMultiplier,
    );
  }

  function drawWormEditorPreview() {
    if (!wormPreviewSimulation.initialized) {
      initializeWormPreviewSimulation();
    }
    drawWormPreviewBackground();
    const simulation = wormPreviewSimulation;
    const segments = simulation.segments;
    wormPreviewContext.save();
    wormPreviewContext.translate(-simulation.camera.x, -simulation.camera.y);
    const head = segments[0];
    const previewHeadAngle =
      simulation.speed > 0.5
        ? Math.atan2(simulation.velocity.y, simulation.velocity.x)
        : previewSegmentAngle(segments, 0);
    const previewHeadX =
      head.x + Math.cos(previewHeadAngle) * WORM_SHAPE.headOffset;
    const previewHeadY =
      head.y + Math.sin(previewHeadAngle) * WORM_SHAPE.headOffset;
    drawWormEditorPreviewTongue(
      simulation,
      previewHeadX,
      previewHeadY,
      previewHeadAngle,
    );
    const bodyLayout = createPreviewBodySpriteLayout(segments);
    drawPreviewCompositeBody(segments, bodyLayout);
    for (let index = 2; index < segments.length - 1; index += 2) {
      const radius = bodyLayout.fillRadii[index];
      const bandWidth = WORM_SPRITE_METRICS.segmentCanvasSize;
      const bandHeight =
        WORM_SPRITE_METRICS.segmentCanvasSize *
        (radius / WORM_SPRITE_METRICS.segmentFillRadius);
      wormPreviewContext.save();
      wormPreviewContext.translate(segments[index].x, segments[index].y);
      wormPreviewContext.rotate(bodyLayout.segmentAngles[index]);
      wormPreviewContext.drawImage(
        wormPainter.layers.segmentBand,
        -bandWidth * 0.5,
        -bandHeight * 0.5,
        bandWidth,
        bandHeight,
      );
      wormPreviewContext.restore();
    }

    drawJawSpriteSet(
      wormPreviewContext,
      wormPainter.layers,
      previewHeadX,
      previewHeadY,
      previewHeadAngle,
      simulation.mouthOpen,
      1,
      wormPainter.mirroredJawSource,
      wormPainter.mirroredMouthSource,
    );
    if (
      HALF_WORM_LAYER_SIDES[wormPainter.activeLayer] &&
      wormPainter.showReflectionLine
    ) {
      drawPreviewJawReflectionLine(
        previewHeadX,
        previewHeadY,
        previewHeadAngle,
      );
    }
    wormPreviewContext.restore();
  }

  function wormPaintPoint(event) {
    const rect = wormLayerCanvas.getBoundingClientRect();
    return {
      x: clamp(
        ((event.clientX - rect.left) / Math.max(1, rect.width)) * wormLayerCanvas.width,
        0,
        wormLayerCanvas.width,
      ),
      y: clamp(
        ((event.clientY - rect.top) / Math.max(1, rect.height)) * wormLayerCanvas.height,
        0,
        wormLayerCanvas.height,
      ),
    };
  }

  function applyWormPaintStroke(from, to, tool) {
    const activeLayerName = wormPainter.activeLayer;
    const layer = wormPainter.layers[activeLayerName];
    const width = layer.width;
    const height = layer.height;
    const strokes = [];
    const halfSide = HALF_WORM_LAYER_SIDES[activeLayerName];
    const isHalfLayer = Boolean(halfSide);
    const addStroke = (layerName, start, end) => {
      const key =
        `${layerName}:` +
        `${start.x.toFixed(3)},${start.y.toFixed(3)}:` +
        `${end.x.toFixed(3)},${end.y.toFixed(3)}`;
      if (!strokes.some((stroke) => stroke.key === key)) {
        strokes.push({ key, layerName, from: start, to: end });
      }
    };
    addStroke(activeLayerName, from, to);
    if (
      !isHalfLayer &&
      (wormPainter.symmetry === "horizontal" || wormPainter.symmetry === "both")
    ) {
      addStroke(
        activeLayerName,
        { x: from.x, y: height - from.y },
        { x: to.x, y: height - to.y },
      );
    }
    if (wormPainter.symmetry === "vertical" || wormPainter.symmetry === "both") {
      addStroke(
        activeLayerName,
        { x: width - from.x, y: from.y },
        { x: width - to.x, y: to.y },
      );
    }
    if (!isHalfLayer && wormPainter.symmetry === "both") {
      addStroke(
        activeLayerName,
        { x: width - from.x, y: height - from.y },
        { x: width - to.x, y: height - to.y },
      );
    }

    strokes.forEach((stroke) => {
      const layerContext = wormPainter.layers[stroke.layerName].getContext("2d");
      layerContext.save();
      if (halfSide) {
        layerContext.beginPath();
        layerContext.rect(
          0,
          halfSide === "upper" ? 0 : height * 0.5,
          width,
          height * 0.5,
        );
        layerContext.clip();
      }
      layerContext.globalCompositeOperation =
        tool === "erase" ? "destination-out" : "source-over";
      layerContext.strokeStyle = wormPainter.color;
      layerContext.fillStyle = wormPainter.color;
      layerContext.lineWidth = wormPainter.brushSize;
      layerContext.lineCap = "round";
      layerContext.lineJoin = "round";
      layerContext.beginPath();
      layerContext.moveTo(stroke.from.x, stroke.from.y);
      layerContext.lineTo(stroke.to.x, stroke.to.y);
      layerContext.stroke();
      if (
        magnitude(
          stroke.to.x - stroke.from.x,
          stroke.to.y - stroke.from.y,
        ) < 0.01
      ) {
        layerContext.beginPath();
        layerContext.arc(
          stroke.to.x,
          stroke.to.y,
          wormPainter.brushSize * 0.5,
          0,
          TAU,
        );
        layerContext.fill();
      }
      layerContext.restore();
    });
    markWormPainterBodyCompositeDirty(activeLayerName);
    renderWormPaintCanvas();
    drawWormEditorPreview();
  }

  function wormPaintFillSeeds(point, width, height, isHalfLayer) {
    const x = clamp(Math.floor(point.x), 0, width - 1);
    const y = clamp(Math.floor(point.y), 0, height - 1);
    const seeds = [];
    const addSeed = (seedX, seedY) => {
      const key = `${seedX},${seedY}`;
      if (!seeds.some((seed) => seed.key === key)) {
        seeds.push({ key, x: seedX, y: seedY });
      }
    };
    addSeed(x, y);
    if (
      !isHalfLayer &&
      (wormPainter.symmetry === "horizontal" || wormPainter.symmetry === "both")
    ) {
      addSeed(x, height - 1 - y);
    }
    if (wormPainter.symmetry === "vertical" || wormPainter.symmetry === "both") {
      addSeed(width - 1 - x, y);
    }
    if (!isHalfLayer && wormPainter.symmetry === "both") {
      addSeed(width - 1 - x, height - 1 - y);
    }
    return seeds;
  }

  function wormPaintReplacementColor(tool) {
    if (tool === "erase") return [0, 0, 0, 0];
    const hex = wormPainter.color.slice(1);
    return [
      Number.parseInt(hex.slice(0, 2), 16),
      Number.parseInt(hex.slice(2, 4), 16),
      Number.parseInt(hex.slice(4, 6), 16),
      255,
    ];
  }

  function applyWormPaintFill(point, tool = "paint") {
    const activeLayerName = wormPainter.activeLayer;
    const layer = wormPainter.layers[activeLayerName];
    const layerContext = layer.getContext("2d");
    const width = layer.width;
    const height = layer.height;
    const halfSide = HALF_WORM_LAYER_SIDES[activeLayerName];
    const halfBoundary = Math.floor(height * 0.5);
    const minimumY = halfSide === "lower" ? halfBoundary : 0;
    const maximumY = halfSide === "upper" ? halfBoundary : height;
    const imageData = layerContext.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    const replacement = wormPaintReplacementColor(tool);
    const queue = new Int32Array(width * height);

    wormPaintFillSeeds(point, width, height, Boolean(halfSide)).forEach((seed) => {
      if (seed.y < minimumY || seed.y >= maximumY) return;
      const startIndex = seed.y * width + seed.x;
      const startOffset = startIndex * 4;
      const target = [
        pixels[startOffset],
        pixels[startOffset + 1],
        pixels[startOffset + 2],
        pixels[startOffset + 3],
      ];
      if (target.every((channel, index) => channel === replacement[index])) return;

      let readIndex = 0;
      let writeIndex = 0;
      const pixelMatchesTarget = (index) => {
        const offset = index * 4;
        return (
          pixels[offset] === target[0] &&
          pixels[offset + 1] === target[1] &&
          pixels[offset + 2] === target[2] &&
          pixels[offset + 3] === target[3]
        );
      };
      const replaceAndEnqueue = (index) => {
        if (!pixelMatchesTarget(index)) return;
        const offset = index * 4;
        pixels[offset] = replacement[0];
        pixels[offset + 1] = replacement[1];
        pixels[offset + 2] = replacement[2];
        pixels[offset + 3] = replacement[3];
        queue[writeIndex] = index;
        writeIndex += 1;
      };

      replaceAndEnqueue(startIndex);
      while (readIndex < writeIndex) {
        const index = queue[readIndex];
        readIndex += 1;
        const x = index % width;
        const y = Math.floor(index / width);
        if (x > 0) replaceAndEnqueue(index - 1);
        if (x < width - 1) replaceAndEnqueue(index + 1);
        if (y > minimumY) replaceAndEnqueue(index - width);
        if (y < maximumY - 1) replaceAndEnqueue(index + width);
      }
    });

    layerContext.putImageData(imageData, 0, 0);
    markWormPainterBodyCompositeDirty(activeLayerName);
    renderWormPaintCanvas();
    drawWormEditorPreview();
  }

  async function openWormAppearanceEditor() {
    clearControlKeys();
    closeWorldSelect();
    closeWormTypeSelect();
    game.menuOpen = true;
    wormPainter.open = true;
    wormEditorTypeName.textContent = activeWormType().label;
    initializeWormPreviewSimulation();
    wormPainter.drawing = false;
    wormPainter.pointerId = null;
    wormEditorElement.classList.add("visible");
    wormEditorElement.setAttribute("aria-hidden", "false");
    updateWormPaintStatus("Loading active PNG layers…");
    try {
      await loadActiveWormIntoEditor();
    } catch {
      await loadDefaultWormIntoEditor();
    }
    if (!wormPainter.open) return;
    setWormPaintLayer(wormPainter.mirroredJawSource || "headUpper");
    setWormPaintTool("paint");
    drawWormEditorPreview();
  }

  function closeWormAppearanceEditor() {
    wormPainter.open = false;
    wormPreviewSimulation.initialized = false;
    wormPainter.drawing = false;
    wormPainter.pointerId = null;
    wormPainter.lastPoint = null;
    wormEditorElement.classList.remove("visible");
    wormEditorElement.setAttribute("aria-hidden", "true");
    syncMenuOpenState();
  }

  function collectWormPainterSprites() {
    return Object.fromEntries(
      Object.entries(wormPainter.layers).map(([name, layer]) => [
        name,
        layer.toDataURL("image/png"),
      ]),
    );
  }

  function createWormPackage() {
    return {
      format: WORM_PACKAGE_FORMAT,
      version: WORM_PACKAGE_VERSION,
      wormTypeId: game.activeWormTypeId,
      wormTypeName: activeWormType().label,
      exportedAt: new Date().toISOString(),
      mirroredJawSource: wormPainter.mirroredJawSource,
      mirroredMouthSource: wormPainter.mirroredMouthSource,
      sprites: collectWormPainterSprites(),
    };
  }

  function exportWormPackage() {
    const packageData = createWormPackage();
    const contents = JSON.stringify(packageData, null, 2);
    const blob = new Blob([contents], { type: "application/json" });
    const objectUrl = URL.createObjectURL(blob);
    const download = document.createElement("a");
    const date = packageData.exportedAt.slice(0, 10);
    download.href = objectUrl;
    download.download = `${game.activeWormTypeId}-appearance-${date}.worm.json`;
    document.body.appendChild(download);
    download.click();
    download.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    updateWormPaintStatus(`Exported ${download.download}`);
  }

  async function importWormPackage(file) {
    if (file.size > WORM_PACKAGE_MAX_BYTES) {
      throw new Error("Worm package is too large");
    }

    const packageData = JSON.parse(await file.text());
    if (
      packageData?.format !== WORM_PACKAGE_FORMAT ||
      packageData?.version !== WORM_PACKAGE_VERSION ||
      !savedSpriteSetIsValid(
        packageData?.sprites,
        CORE_WORM_LAYER_NAMES,
      )
    ) {
      throw new Error("Not a compatible WORM appearance package");
    }

    const packageSprites = withTongueSpriteFallbacks(packageData.sprites);
    const loadedSprites = await Promise.all(
      Object.entries(WORM_LAYER_DEFINITIONS).map(async ([name]) => [
        name,
        await loadImageSource(packageSprites[name]),
      ]),
    );
    loadedSprites.forEach(([name, image]) =>
      copyImageToWormLayer(name, image),
    );
    wormPainter.mirroredJawSource = normalizeMirroredJawSource(
      packageData.mirroredJawSource,
    );
    wormPainter.mirroredMouthSource = normalizeMirroredMouthSource(
      packageData.mirroredMouthSource,
    );

    const editableLayer =
      wormPainter.mirroredJawSource ||
      wormPainter.mirroredMouthSource ||
      "headUpper";
    setWormPaintLayer(editableLayer);
    drawWormEditorPreview();
    updateWormPaintStatus(
      `Imported ${file.name} · Save worm to keep it`,
    );
  }

  function saveWormAppearance() {
    const sprites = collectWormPainterSprites();
    try {
      window.localStorage.setItem(
        wormAppearanceStorageKey(),
        JSON.stringify({
          version: 1,
          wormTypeId: game.activeWormTypeId,
          updatedAt: Date.now(),
          mirroredJawSource: wormPainter.mirroredJawSource,
          mirroredMouthSource: wormPainter.mirroredMouthSource,
          sprites,
        }),
      );
    } catch {
      updateWormPaintStatus("Could not save · Browser storage is unavailable or full");
      return;
    }
    applyWormSpriteSources(
      sprites,
      wormPainter.mirroredJawSource,
      wormPainter.mirroredMouthSource,
    );
    closeWormAppearanceEditor();
  }


  function spawnParticles(x, y, count, kind, sizeScale = 1) {
    const effectScale = Math.sqrt(sizeScale);
    for (let index = 0; index < count; index += 1) {
      const angle =
        kind === "dirt"
          ? Math.atan2(-game.velocity.y, -game.velocity.x) + (Math.random() - 0.5) * 1.8
          : Math.random() * TAU;
      const force =
        kind === "dirt"
          ? 35 + Math.random() * 150
          : kind === "splatter"
            ? (55 + Math.random() * 190) * effectScale
            : (80 + Math.random() * 210) * effectScale;
      const life =
        kind === "splatter"
          ? 0.24 + Math.random() * 0.35
          : 0.35 + Math.random() * 0.45;
      game.particles.push({
        x,
        y,
        vx: Math.cos(angle) * force,
        vy:
          Math.sin(angle) * force -
          (kind === "burst" || kind === "beetle" || kind === "dragonfly" || kind === "vulture" || kind === "mole" || kind === "rabbit" || kind === "meat" || kind === "stone" || kind === "growth" || kind === "splatter"
            ? 70
            : 0),
        life,
        maxLife: life,
        size: (1.5 + Math.random() * 4) * effectScale,
        tone: Math.random(),
        kind,
        renderLayer:
          kind === "splatter" && index % 2 === 0 ? "front" : "back",
      });
    }
    if (game.particles.length > BITE_SPLATTER_RULES.particleLimit) {
      game.particles.splice(
        0,
        game.particles.length - BITE_SPLATTER_RULES.particleLimit,
      );
    }
  }

  function spawnBiteSplatter(
    x,
    y,
    biteAngle,
    sizeScale = 1,
    count = BITE_SPLATTER_RULES.baseCount,
  ) {
    const effectScale = Math.sqrt(Math.max(0.25, sizeScale));
    const tangentX = Math.cos(biteAngle);
    const tangentY = Math.sin(biteAngle);
    const normalX = -tangentY;
    const normalY = tangentX;
    for (let index = 0; index < count; index += 1) {
      const side = index % 2 === 0 ? -1 : 1;
      const sprayAngle =
        biteAngle +
        side * BITE_SPLATTER_RULES.sideAngle +
        (Math.random() - 0.5) * BITE_SPLATTER_RULES.angleSpread;
      const force = lerp(
        BITE_SPLATTER_RULES.minimumSpeed,
        BITE_SPLATTER_RULES.maximumSpeed,
        Math.random(),
      ) * effectScale;
      const life = lerp(
        BITE_SPLATTER_RULES.minimumLife,
        BITE_SPLATTER_RULES.maximumLife,
        Math.random(),
      );
      const mouthJitter = (Math.random() - 0.5) * 5 * effectScale;
      const sideJitter = side * Math.random() * 3 * effectScale;
      game.particles.push({
        x: x + tangentX * mouthJitter + normalX * sideJitter,
        y: y + tangentY * mouthJitter + normalY * sideJitter,
        vx:
          Math.cos(sprayAngle) * force +
          game.velocity.x * BITE_SPLATTER_RULES.velocityCarry,
        vy:
          Math.sin(sprayAngle) * force +
          game.velocity.y * BITE_SPLATTER_RULES.velocityCarry,
        life,
        maxLife: life,
        size: (0.55 + Math.random() * 1.35) * effectScale,
        tone: Math.random(),
        kind: "splatter",
        renderLayer: index % 4 < 2 ? "front" : "back",
      });
    }
    if (game.particles.length > BITE_SPLATTER_RULES.particleLimit) {
      game.particles.splice(
        0,
        game.particles.length - BITE_SPLATTER_RULES.particleLimit,
      );
    }
  }

  function updateParticles(dt) {
    game.particles = game.particles.filter((particle) => {
      particle.life -= dt;
      if (particle.life <= 0) return false;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= Math.pow(0.08, dt);
      particle.vy +=
        (particle.kind === "burst"
          ? 440
          : particle.kind === "beetle" || particle.kind === "dragonfly" || particle.kind === "vulture" || particle.kind === "mole" || particle.kind === "rabbit" || particle.kind === "meat" || particle.kind === "stone"
            ? 300
          : particle.kind === "growth"
              ? 220
              : particle.kind === "splatter"
                ? BITE_SPLATTER_RULES.gravity
              : 240) * dt;
      return true;
    });
  }

  function initializeBodyPath() {
    const bodyLength = (game.segments.length - 1) * wormSegmentSpacing();
    const sampleSpacing = bodyPathSampleSpacing();
    game.bodyPath = [];
    game.bodyPathStartIndex = 0;
    for (
      let distance = bodyLength;
      distance > 0;
      distance -= sampleSpacing
    ) {
      game.bodyPath.push({
        x: game.head.x - Math.cos(game.heading) * distance,
        y: game.head.y - Math.sin(game.heading) * distance,
      });
    }
    game.bodyPath.push({ x: game.head.x, y: game.head.y });
  }

  function bodyPathSampleSpacing() {
    return Math.max(
      BODY_PATH_RULES.minimumSampleSpacing,
      wormSegmentSpacing() / BODY_PATH_RULES.samplesPerSegment,
    );
  }

  function recordHeadPath() {
    const last = game.bodyPath[game.bodyPath.length - 1];
    const dx = game.head.x - last.x;
    const dy = game.head.y - last.y;
    const distance = magnitude(dx, dy);
    if (distance < 0.01) return false;

    const steps = Math.max(
      1,
      Math.ceil(distance / bodyPathSampleSpacing()),
    );
    for (let step = 1; step <= steps; step += 1) {
      const amount = step / steps;
      game.bodyPath.push({
        x: lerp(last.x, game.head.x, amount),
        y: lerp(last.y, game.head.y, amount),
      });
    }

    const keepLength = game.segments.length * wormSegmentSpacing() + 40;
    let retainedLength = 0;
    let startIndex = game.bodyPath.length - 1;
    while (
      startIndex > game.bodyPathStartIndex &&
      retainedLength < keepLength
    ) {
      const newer = game.bodyPath[startIndex];
      const older = game.bodyPath[startIndex - 1];
      retainedLength += magnitude(newer.x - older.x, newer.y - older.y);
      startIndex -= 1;
    }
    game.bodyPathStartIndex = startIndex;
    if (
      game.bodyPathStartIndex >= BODY_PATH_RULES.compactDiscardedPrefixAt
    ) {
      compactBodyPath();
    }
    return true;
  }

  function updateSegments() {
    if (
      game.segments.length === 0 ||
      game.bodyPath.length <= game.bodyPathStartIndex
    ) {
      return;
    }

    const spacing = wormSegmentSpacing();
    let pathIndex = game.bodyPath.length - 1;
    let traversedDistance = 0;
    let newer = game.bodyPath[pathIndex];
    let older = pathIndex > game.bodyPathStartIndex
      ? game.bodyPath[pathIndex - 1]
      : newer;
    let sectionLength = magnitude(newer.x - older.x, newer.y - older.y);

    // Segment distances increase from head to tail, so one cursor can walk
    // backward through the path for the entire body. The old implementation
    // restarted at the head for every segment, making long worms approach
    // quadratic work as both their segment count and spacing grew.
    game.segments.forEach((segment, segmentIndex) => {
      const targetDistance = segmentIndex * spacing;
      while (
        pathIndex > game.bodyPathStartIndex &&
        traversedDistance + sectionLength < targetDistance
      ) {
        traversedDistance += sectionLength;
        pathIndex -= 1;
        newer = game.bodyPath[pathIndex];
        older = pathIndex > game.bodyPathStartIndex
          ? game.bodyPath[pathIndex - 1]
          : newer;
        sectionLength = magnitude(newer.x - older.x, newer.y - older.y);
      }

      if (pathIndex <= game.bodyPathStartIndex) {
        segment.x = game.bodyPath[game.bodyPathStartIndex].x;
        segment.y = game.bodyPath[game.bodyPathStartIndex].y;
        return;
      }

      const distanceIntoSection = targetDistance - traversedDistance;
      const amount = sectionLength > 0
        ? clamp(distanceIntoSection / sectionLength, 0, 1)
        : 0;
      segment.x = lerp(newer.x, older.x, amount);
      segment.y = lerp(newer.y, older.y, amount);
    });
  }

  function rebuildBodyPathFromSegments() {
    const points = [...game.segments].reverse();
    if (points.length === 0) {
      initializeBodyPath();
      return;
    }

    points[points.length - 1] = game.head;
    game.bodyPath = [{ x: points[0].x, y: points[0].y }];
    game.bodyPathStartIndex = 0;
    const sampleSpacing = bodyPathSampleSpacing();
    for (let index = 1; index < points.length; index += 1) {
      const older = points[index - 1];
      const newer = points[index];
      const distance = magnitude(newer.x - older.x, newer.y - older.y);
      const steps = Math.max(1, Math.ceil(distance / sampleSpacing));
      for (let step = 1; step <= steps; step += 1) {
        const amount = step / steps;
        game.bodyPath.push({
          x: lerp(older.x, newer.x, amount),
          y: lerp(older.y, newer.y, amount),
        });
      }
    }
  }

  function bodyPathLength() {
    let length = 0;
    for (
      let index = game.bodyPathStartIndex + 1;
      index < game.bodyPath.length;
      index += 1
    ) {
      const older = game.bodyPath[index - 1];
      const newer = game.bodyPath[index];
      length += magnitude(newer.x - older.x, newer.y - older.y);
    }
    return length;
  }

  function compactBodyPath() {
    if (game.bodyPathStartIndex <= 0) return;
    game.bodyPath = game.bodyPath.slice(game.bodyPathStartIndex);
    game.bodyPathStartIndex = 0;
  }

  function extendBodyPath(requiredLength) {
    const missingLength = requiredLength - bodyPathLength();
    if (
      missingLength <= 0 ||
      game.bodyPath.length - game.bodyPathStartIndex < 2
    ) {
      return;
    }
    compactBodyPath();
    const oldest = game.bodyPath[0];
    const next = game.bodyPath[1];
    let directionX = oldest.x - next.x;
    let directionY = oldest.y - next.y;
    const directionLength = magnitude(directionX, directionY);
    if (directionLength < 0.001) {
      directionX = -Math.cos(game.heading);
      directionY = -Math.sin(game.heading);
    } else {
      directionX /= directionLength;
      directionY /= directionLength;
    }
    const sampleSpacing = bodyPathSampleSpacing();
    const steps = Math.ceil(missingLength / sampleSpacing);
    const extension = [];
    for (let step = steps; step > 0; step -= 1) {
      extension.push({
        x: oldest.x + directionX * step * sampleSpacing,
        y: oldest.y + directionY * step * sampleSpacing,
      });
    }
    game.bodyPath.unshift(...extension);
  }

  function setEffectiveWormLevel(level, showGrowthEffect = false) {
    const nextLevel = clamp(
      Math.floor(Number(level) || 0),
      0,
      DEV_WORM_LEVEL_MAX,
    );
    const previousLevel = game.growthLevel;
    const previousBoostCapacity = boostCapacity();
    game.growthLevel = nextLevel;

    const desiredSegmentCount = wormSegmentCount();
    const tail = game.segments[game.segments.length - 1] || game.head;
    while (game.segments.length < desiredSegmentCount) {
      game.segments.push({ x: tail.x, y: tail.y });
    }
    if (game.segments.length > desiredSegmentCount) {
      game.segments.splice(desiredSegmentCount);
    }
    extendBodyPath((desiredSegmentCount - 1) * wormSegmentSpacing() + 6);
    updateSegments();

    const nextBoostCapacity = boostCapacity();
    if (nextBoostCapacity > previousBoostCapacity) {
      game.boostCharge = Math.min(
        nextBoostCapacity,
        game.boostCharge + nextBoostCapacity - previousBoostCapacity,
      );
    } else {
      game.boostCharge = Math.min(game.boostCharge, nextBoostCapacity);
    }

    const levelsGained = nextLevel - previousLevel;
    if (showGrowthEffect && levelsGained > 0) {
      spawnParticles(
        game.head.x,
        game.head.y,
        16 + levelsGained * 6,
        "growth",
      );
    }
  }

  function awardScore(points) {
    game.score += points;
    game.growthProgress += points;
    let levelsGained = 0;
    while (game.growthProgress >= game.growthCost) {
      game.growthProgress -= game.growthCost;
      game.scoreGrowthLevel += 1;
      game.growthCost = growthCostForLevel(game.scoreGrowthLevel);
      levelsGained += 1;
    }
    if (levelsGained > 0 && game.growthLevelOverride === null) {
      setEffectiveWormLevel(game.scoreGrowthLevel, true);
    }
    syncDevWormLevelControl();
  }

  function getWormHeadAngle() {
    if (game.latchAttack?.phase === "biting") {
      return game.latchAttack.lockAngle;
    }
    const tongueGrapple = activeHeavyTongueGrapple();
    const grappleTarget = activeTongueTarget(tongueGrapple);
    if (grappleTarget) {
      const targetOffsetX = grappleTarget.x - game.head.x;
      const targetOffsetY = grappleTarget.y - game.head.y;
      if (magnitude(targetOffsetX, targetOffsetY) > 0.0001) {
        return Math.atan2(targetOffsetY, targetOffsetX);
      }
    }
    if (game.stoneSurfaceContact) return game.heading;
    if (game.speed > 0.5) {
      const velocityMagnitude = magnitude(game.velocity.x, game.velocity.y);
      if (velocityMagnitude > 0.5) {
        return Math.atan2(game.velocity.y, game.velocity.x);
      }
    }
    if (game.segments.length > 1) {
      return Math.atan2(
        game.segments[0].y - game.segments[1].y,
        game.segments[0].x - game.segments[1].x,
      );
    }
    return game.heading;
  }

  function getEatHitboxPose() {
    const angle = getWormHeadAngle();
    const headOffset = wormDimension("headOffset");
    return {
      x: game.head.x + Math.cos(angle) * headOffset,
      y: game.head.y + Math.sin(angle) * headOffset,
      angle,
    };
  }

  function spitterSprayIsActive() {
    return (
      spitterPointer.pointerId !== null &&
      wormHasAbility(WORM_ABILITIES.ACID) &&
      game.levelLoaded &&
      game.started &&
      !game.paused &&
      !game.menuOpen
    );
  }

  function spitterHasHeadGuidedAcid() {
    for (let index = 0; index < game.acidParticles.length; index += 1) {
      if (game.acidParticles[index].headGuideActive) return true;
    }
    return false;
  }

  function spitterHeadPoseShouldRemainActive() {
    return spitterSprayIsActive() || spitterHasHeadGuidedAcid();
  }

  function spitterCranePoseIsActive() {
    return (
      spitterHeadPoseShouldRemainActive() &&
      !game.inGround &&
      Number.isFinite(game.spitterAimAngle) &&
      game.segments.length >= 2
    );
  }

  function spitterAimWorldPoint() {
    const zoom = cameraZoom();
    return {
      x:
        game.head.x +
        (spitterPointer.screenX - game.viewport.width * 0.5) / zoom,
      y:
        game.head.y +
        (spitterPointer.screenY - game.viewport.height * 0.5) / zoom,
    };
  }

  function updateSpitterAim(dt) {
    if (!spitterSprayIsActive()) {
      game.acidEmissionAccumulator = 0;
      // A released pointer stops emission, but the rendered head holds its
      // last pose until every already-emitted carrier finishes the full
      // head-local launch guide.
      if (game.inGround || !spitterHasHeadGuidedAcid()) {
        game.spitterAimAngle = null;
      }
      return;
    }
    if (game.inGround) {
      game.spitterAimAngle = null;
      return;
    }

    const target = spitterAimWorldPoint();
    const origin = game.segments[0] || game.head;
    const targetX = nearestPeriodicWorldX(target.x, origin.x);
    const desiredAngle = Math.atan2(target.y - origin.y, targetX - origin.x);
    if (!Number.isFinite(game.spitterAimAngle)) {
      game.spitterAimAngle = getWormHeadAngle();
    }
    const difference = Math.atan2(
      Math.sin(desiredAngle - game.spitterAimAngle),
      Math.cos(desiredAngle - game.spitterAimAngle),
    );
    game.spitterAimAngle += clamp(
      difference,
      -ACID_RULES.aimTurnSpeed * dt,
      ACID_RULES.aimTurnSpeed * dt,
    );
  }

  function buildSpitterCraneRenderState() {
    const sourceSegments = game.segments;
    const renderState = spitterCraneRenderState;
    const aiming = spitterCranePoseIsActive();

    if (!aiming || sourceSegments.length < 2) {
      renderState.outputSegments = sourceSegments;
      const pose = getEatHitboxPose();
      renderState.headPose.x = pose.x;
      renderState.headPose.y = pose.y;
      renderState.headPose.angle = pose.angle;
      return renderState;
    }

    while (renderState.segments.length < sourceSegments.length) {
      renderState.segments.push({ x: 0, y: 0 });
    }
    renderState.segments.length = sourceSegments.length;
    for (let index = 0; index < sourceSegments.length; index += 1) {
      renderState.segments[index].x = sourceSegments[index].x;
      renderState.segments[index].y = sourceSegments[index].y;
    }

    const craneSegmentCount = clamp(
      Math.floor(sourceSegments.length * ACID_RULES.craneBodyFraction),
      1,
      sourceSegments.length - 1,
    );
    const anchorIndex = craneSegmentCount;
    const anchor = sourceSegments[anchorIndex];
    const forwardNeighbor = sourceSegments[Math.max(0, anchorIndex - 1)];
    const baseAngle = Math.atan2(
      forwardNeighbor.y - anchor.y,
      forwardNeighbor.x - anchor.x,
    );
    const turn = Math.atan2(
      Math.sin(game.spitterAimAngle - baseAngle),
      Math.cos(game.spitterAimAngle - baseAngle),
    );
    const spacing = wormSegmentSpacing();
    let x = anchor.x;
    let y = anchor.y;
    for (let index = anchorIndex - 1; index >= 0; index -= 1) {
      const progress = (anchorIndex - index) / Math.max(1, anchorIndex);
      const easedProgress = progress * progress * (3 - 2 * progress);
      const linkAngle = baseAngle + turn * easedProgress;
      x += Math.cos(linkAngle) * spacing;
      y += Math.sin(linkAngle) * spacing;
      renderState.segments[index].x = x;
      renderState.segments[index].y = y;
    }

    const headBase = renderState.segments[0];
    const headOffset = wormDimension("headOffset");
    renderState.outputSegments = renderState.segments;
    renderState.headPose.x =
      headBase.x + Math.cos(game.spitterAimAngle) * headOffset;
    renderState.headPose.y =
      headBase.y + Math.sin(game.spitterAimAngle) * headOffset;
    renderState.headPose.angle = game.spitterAimAngle;
    return renderState;
  }

  function spitterAcidNozzlePose() {
    const renderState = buildSpitterCraneRenderState();
    const pose = renderState.headPose;
    const throatOffset = WORM_SPRITE_METRICS.jawHingeX * wormScale();
    return {
      x: pose.x + Math.cos(pose.angle) * throatOffset,
      y: pose.y + Math.sin(pose.angle) * throatOffset,
      angle: pose.angle,
    };
  }

  function wormVisualLength() {
    const bodyLength =
      Math.max(0, game.segments.length - 1) * wormSegmentSpacing();
    const headLength =
      wormDimension("headOffset") +
      WORM_SPRITE_METRICS.headWidth * wormScale() * 0.5;
    return bodyLength + headLength + wormDimension("tailRadius");
  }

  function tongueHeadAnchors() {
    const pose = getEatHitboxPose();
    const halfHeadWidth =
      WORM_SPRITE_METRICS.headWidth * wormScale() * 0.5;
    const forwardX = Math.cos(pose.angle);
    const forwardY = Math.sin(pose.angle);
    return {
      pose,
      back: {
        x: pose.x - forwardX * halfHeadWidth,
        y: pose.y - forwardY * halfHeadWidth,
      },
      front: {
        x: pose.x + forwardX * halfHeadWidth,
        y: pose.y + forwardY * halfHeadWidth,
      },
    };
  }

  function segmentedTongueRoute(
    front,
    angle,
    target,
    maximumCurveLength,
    segmentLength,
    progress = 1,
  ) {
    const points = [];
    const linkLength = Math.max(1, segmentLength);
    const maximumSegmentCount = Math.max(
      1,
      Math.ceil(maximumCurveLength / linkLength),
    );
    let remainingLength =
      maximumCurveLength * clamp(progress, 0, 1);
    let currentX = front.x;
    let currentY = front.y;
    let currentAngle = angle;
    let segmentIndex = 0;

    while (remainingLength > 0.0001) {
      const targetOffsetX = target.x - currentX;
      const targetOffsetY = target.y - currentY;
      const targetDistance = magnitude(targetOffsetX, targetOffsetY);
      if (targetDistance < 0.0001) break;

      const targetAngle = Math.atan2(targetOffsetY, targetOffsetX);
      const angleDifference = Math.atan2(
        Math.sin(targetAngle - currentAngle),
        Math.cos(targetAngle - currentAngle),
      );
      const stepLength = Math.min(linkLength, remainingLength);
      const turnProgress =
        maximumSegmentCount > 1
          ? segmentIndex / (maximumSegmentCount - 1)
          : 1;
      const turnLimit = lerp(
        TONGUE_RULES.firstSegmentTurnLimit,
        TONGUE_RULES.lastSegmentTurnLimit,
        turnProgress,
      );

      if (
        targetDistance <= stepLength &&
        Math.abs(angleDifference) <= turnLimit
      ) {
        points.push({ x: target.x, y: target.y });
        break;
      }

      currentAngle += clamp(
        angleDifference,
        -turnLimit,
        turnLimit,
      );
      currentX += Math.cos(currentAngle) * stepLength;
      currentY += Math.sin(currentAngle) * stepLength;
      points.push({ x: currentX, y: currentY });
      remainingLength -= stepLength;
      segmentIndex += 1;
    }

    return { points };
  }

  function rearTongueRoute(
    front,
    angle,
    target,
    maximumCurveLength,
    segmentLength,
    progress = 1,
  ) {
    const offsetX = target.x - front.x;
    const offsetY = target.y - front.y;
    const targetDistance = magnitude(offsetX, offsetY);
    if (targetDistance < 0.0001) return { points: [] };

    const directionX = offsetX / targetDistance;
    const directionY = offsetY / targetDistance;
    const linkLength = Math.max(1, segmentLength);
    const targetAngle = Math.atan2(offsetY, offsetX);
    const angleDifference = Math.atan2(
      Math.sin(targetAngle - angle),
      Math.cos(targetAngle - angle),
    );
    const normalX = -directionY;
    const normalY = directionX;
    const detourSide = angleDifference < 0 ? 1 : -1;
    const bendDistance = Math.min(
      maximumCurveLength * 0.22,
      targetDistance * 0.35,
      linkLength * 2.5,
    );
    const clearance = Math.min(
      Math.max(
        linkLength * 1.5,
        TONGUE_RULES.outerBaseWidth * wormScale() * 2.25,
      ),
      targetDistance * 0.3,
    );
    const controlDistance = Math.min(linkLength, targetDistance * 0.15);
    const control = {
      x: front.x + Math.cos(angle) * controlDistance,
      y: front.y + Math.sin(angle) * controlDistance,
    };
    const bend = {
      x:
        front.x +
        directionX * bendDistance +
        normalX * clearance * detourSide,
      y:
        front.y +
        directionY * bendDistance +
        normalY * clearance * detourSide,
    };
    const guidePoints = [{ x: front.x, y: front.y }];
    const curveSamples = 8;
    for (let sample = 1; sample <= curveSamples; sample += 1) {
      const amount = sample / curveSamples;
      const inverse = 1 - amount;
      guidePoints.push({
        x:
          inverse * inverse * front.x +
          2 * inverse * amount * control.x +
          amount * amount * bend.x,
        y:
          inverse * inverse * front.y +
          2 * inverse * amount * control.y +
          amount * amount * bend.y,
      });
    }
    guidePoints.push({ x: target.x, y: target.y });

    const metrics = tonguePathMetrics(guidePoints);
    const routeLength = Math.min(
      metrics.totalLength,
      maximumCurveLength * clamp(progress, 0, 1),
    );
    const points = [];
    let distance = Math.min(linkLength, routeLength);
    while (distance < routeLength) {
      const point = tonguePathSample(guidePoints, metrics, distance);
      points.push({ x: point.x, y: point.y });
      distance += linkLength;
    }
    if (routeLength > 0) {
      const point = tonguePathSample(guidePoints, metrics, routeLength);
      points.push({
        x: point.x,
        y: point.y,
      });
    }
    return { points };
  }

  function getTongueGeometry(tongue, progress = tongue?.progress ?? 0) {
    if (!tongue) return null;
    const { pose, back, front } = tongueHeadAnchors();
    const maximumLength =
      wormVisualLength() * TONGUE_RULES.lengthMultiplier;
    // The editable/visible tongue length describes the flexible portion
    // beyond the mouth. The straight rear-to-front head passage is extra and
    // must not reduce the tongue's usable targeting range.
    const maximumCurveLength = maximumLength;
    const lockedTarget = activeTongueTarget(tongue);
    const target = lockedTarget && !tongue.freefallNodes
      ? { x: lockedTarget.x, y: lockedTarget.y }
      : tongue.aimOnly &&
          Number.isFinite(tongue.selectionX) &&
          Number.isFinite(tongue.selectionY)
        ? { x: tongue.selectionX, y: tongue.selectionY }
      : {
          x: game.head.x + tongue.aimOffsetX,
          y: game.head.y + tongue.aimOffsetY,
        };
    const targetAngle = Math.atan2(target.y - front.y, target.x - front.x);
    const targetAngleDifference = Math.abs(
      Math.atan2(
        Math.sin(targetAngle - pose.angle),
        Math.cos(targetAngle - pose.angle),
      ),
    );
    const useRearAim =
      !tongue.freefallNodes &&
      targetAngleDifference >= TONGUE_RULES.rearAimThreshold;
    const tongueSegmentLength =
      wormSegmentSpacing() * TONGUE_RULES.segmentSpacingMultiplier;

    const route = tongue.freefallNodes
      ? {
          points: tongue.freefallNodes.map((node) => ({
            x: node.x,
            y: node.y,
          })),
        }
      : useRearAim
        ? rearTongueRoute(
            front,
            pose.angle,
            target,
            maximumCurveLength,
            tongueSegmentLength,
            progress,
          )
        : segmentedTongueRoute(
            front,
            pose.angle,
            target,
            maximumCurveLength,
            tongueSegmentLength,
            progress,
          );

    return {
      pose,
      back,
      front,
      route,
      maximumLength,
    };
  }

  function stoneSurfaceWheelRadius(headRadius = wormDimension("collisionRadius")) {
    return Math.max(
      4,
      headRadius * STONE_RULES.surfaceWheelRadiusMultiplier,
    );
  }

  function getEatConeGeometry() {
    const scale = wormScale();
    return {
      pivotOffset: WORM_SPRITE_METRICS.jawHingeX * scale,
      range:
        (WORM_SPRITE_METRICS.headWidth * 0.5 -
          WORM_SPRITE_METRICS.jawHingeX) *
        scale,
      halfAngle: MOUTH_BEHAVIOR.maxJawAngle,
    };
  }

  function getEatAnimationConeGeometry() {
    const hitboxCone = getEatConeGeometry();
    return {
      pivotOffset: hitboxCone.pivotOffset,
      range: hitboxCone.range * EAT_ANIMATION_CONE.rangeMultiplier,
      halfAngle:
        hitboxCone.halfAngle * EAT_ANIMATION_CONE.halfAngleMultiplier,
    };
  }

  function getEatConeWorldPoints(pose = getEatHitboxPose()) {
    const cone = getEatConeGeometry();
    const cosine = Math.cos(pose.angle);
    const sine = Math.sin(pose.angle);
    const pivotX = pose.x + cosine * cone.pivotOffset;
    const pivotY = pose.y + sine * cone.pivotOffset;
    return {
      pose,
      cone,
      pivotX,
      pivotY,
      wideX: pivotX + cosine * cone.range,
      wideY: pivotY + sine * cone.range,
    };
  }

  function getEatAnimationConeWorldPoints(pose = getEatHitboxPose()) {
    const cone = getEatAnimationConeGeometry();
    const cosine = Math.cos(pose.angle);
    const sine = Math.sin(pose.angle);
    const pivotX = pose.x + cosine * cone.pivotOffset;
    const pivotY = pose.y + sine * cone.pivotOffset;
    return {
      pose,
      cone,
      pivotX,
      pivotY,
      wideX: pivotX + cosine * cone.range,
      wideY: pivotY + sine * cone.range,
    };
  }

  function getEatHitboxSweep() {
    const current = getEatHitboxPose();
    const previous = game.previousEatHitbox || current;
    const angleDelta = Math.atan2(
      Math.sin(current.angle - previous.angle),
      Math.cos(current.angle - previous.angle),
    );
    const travelDistance = magnitude(
      current.x - previous.x,
      current.y - previous.y,
    );
    const steps = Math.max(
      1,
      Math.ceil(travelDistance / 4),
      Math.ceil(Math.abs(angleDelta) / 0.08),
    );
    return { previous, current, angleDelta, steps };
  }

  function eatHitboxPoseAlongSweep(sweep, step) {
    const amount = step / sweep.steps;
    return {
      x: lerp(sweep.previous.x, sweep.current.x, amount),
      y: lerp(sweep.previous.y, sweep.current.y, amount),
      angle: sweep.previous.angle + sweep.angleDelta * amount,
    };
  }

  function squaredDistanceToSegment(px, py, startX, startY, endX, endY) {
    const segmentX = endX - startX;
    const segmentY = endY - startY;
    const lengthSquared = segmentX * segmentX + segmentY * segmentY;
    const amount =
      lengthSquared > 0
        ? clamp(
            ((px - startX) * segmentX + (py - startY) * segmentY) /
              lengthSquared,
            0,
            1,
          )
        : 0;
    const differenceX = px - lerp(startX, endX, amount);
    const differenceY = py - lerp(startY, endY, amount);
    return differenceX * differenceX + differenceY * differenceY;
  }

  function targetOverlapsEatConeAtPose(target, pose, cone) {
    const cosine = Math.cos(pose.angle);
    const sine = Math.sin(pose.angle);
    const pivotX = pose.x + cosine * cone.pivotOffset;
    const pivotY = pose.y + sine * cone.pivotOffset;
    const dx = target.x - pivotX;
    const dy = target.y - pivotY;
    const localX = dx * cosine + dy * sine;
    const localY = -dx * sine + dy * cosine;
    const distanceSquared = localX * localX + localY * localY;
    const distance = Math.sqrt(distanceSquared);
    const absoluteAngle = Math.abs(Math.atan2(localY, localX));
    const radiusSquared = target.radius * target.radius;

    if (distance <= cone.range && absoluteAngle <= cone.halfAngle) return true;

    const edgeX = Math.cos(cone.halfAngle) * cone.range;
    const edgeY = Math.sin(cone.halfAngle) * cone.range;
    let closestDistanceSquared = Math.min(
      squaredDistanceToSegment(localX, localY, 0, 0, edgeX, edgeY),
      squaredDistanceToSegment(localX, localY, 0, 0, edgeX, -edgeY),
    );
    if (absoluteAngle <= cone.halfAngle) {
      const distanceFromArc = Math.max(0, distance - cone.range);
      closestDistanceSquared = Math.min(
        closestDistanceSquared,
        distanceFromArc * distanceFromArc,
      );
    }
    return closestDistanceSquared <= radiusSquared;
  }

  function targetTouchesEatCone(target, sweep, cone) {
    for (let step = 0; step <= sweep.steps; step += 1) {
      if (
        targetOverlapsEatConeAtPose(
          target,
          eatHitboxPoseAlongSweep(sweep, step),
          cone,
        )
      ) {
        return true;
      }
    }
    return false;
  }

  function spawnSwarmTargets(consumedTarget, count = 2) {
    const enemyDefinition = ENEMY_DEFINITIONS[consumedTarget.kind];
    const random = seededRandom(
      hashString(
        `${game.activeWorldId}:${consumedTarget.id}:${game.targetsEaten}:${game.score}:swarm`,
      ),
    );
    const sourceColumn = Math.floor(consumedTarget.x / BLOCK_SIZE);
    const sourceRow = Math.floor(consumedTarget.y / BLOCK_SIZE);
    const minimumDistance = Math.max(BLOCK_SIZE * 5, consumedTarget.radius * 2.5);
    const maximumDistance = Math.max(BLOCK_SIZE * 14, consumedTarget.radius * 5);
    const eatCone = getEatConeGeometry();
    const headClearance =
      eatCone.range +
      consumedTarget.radius +
      BLOCK_SIZE * 2;
    const candidates = [];

    for (let row = sourceRow - 14; row <= sourceRow + 14; row += 1) {
      for (let column = sourceColumn - 14; column <= sourceColumn + 14; column += 1) {
        const block = getBlockAtGrid(column, row);
        if (!block || block.type !== consumedTarget.regionType) continue;
        const x = (column + 0.5) * BLOCK_SIZE;
        const y = (row + 0.5) * BLOCK_SIZE;
        const sourceDistance = magnitude(x - consumedTarget.x, y - consumedTarget.y);
        if (sourceDistance < minimumDistance || sourceDistance > maximumDistance) continue;
        if (magnitude(x - game.head.x, y - game.head.y) < headClearance) continue;
        if (
          game.targets.some(
            (target) =>
              magnitude(x - target.x, y - target.y) <
              target.radius + enemyDefinition.radius + 4,
          )
        ) {
          continue;
        }
        candidates.push({ x, y, regionType: block.type });
      }
    }

    const spawned = [];
    while (spawned.length < count && candidates.length > 0) {
      const candidate = takeRandomCandidate(candidates, random);
      if (
        spawned.some(
          (target) =>
            magnitude(candidate.x - target.x, candidate.y - target.y) <
            target.radius + enemyDefinition.radius + BLOCK_SIZE,
        )
      ) {
        continue;
      }
      spawned.push(
        createEnemyTarget(
          consumedTarget.kind,
          candidate.x,
          candidate.y,
          candidate.regionType,
          random,
        ),
      );
    }

    // Sparse custom terrain may not have two matching blocks around the death.
    // A radial fallback preserves the two-for-one rule while staying nearby.
    for (let attempt = 0; spawned.length < count && attempt < 64; attempt += 1) {
      const angle = random() * TAU;
      const distance = lerp(minimumDistance, maximumDistance, random());
      const x = consumedTarget.x + Math.cos(angle) * distance;
      const y = clamp(
        consumedTarget.y + Math.sin(angle) * distance,
        enemyDefinition.radius,
        game.height - enemyDefinition.radius,
      );
      if (magnitude(x - game.head.x, y - game.head.y) < headClearance) continue;
      if (
        [...game.targets, ...spawned].some(
          (target) =>
            magnitude(x - target.x, y - target.y) <
            target.radius + enemyDefinition.radius + BLOCK_SIZE,
        )
      ) {
        continue;
      }
      const regionType = getBlockAtWorld(x, y)?.type || consumedTarget.regionType;
      spawned.push(
        createEnemyTarget(consumedTarget.kind, x, y, regionType, random),
      );
    }

    // The world is much larger than the spawn radius, so this is only a final
    // guard for extreme edge cases such as a heavily crowded test map.
    while (spawned.length < count) {
      const angle = (spawned.length / count) * TAU + random() * 0.4;
      const distance = maximumDistance;
      const x = consumedTarget.x + Math.cos(angle) * distance;
      const y = clamp(
        consumedTarget.y + Math.sin(angle) * distance,
        enemyDefinition.radius,
        game.height - enemyDefinition.radius,
      );
      const regionType = getBlockAtWorld(x, y)?.type || consumedTarget.regionType;
      spawned.push(
        createEnemyTarget(consumedTarget.kind, x, y, regionType, random),
      );
    }

    game.targets.push(...spawned);
    game.totalTargets += spawned.length;
  }

  function enemyMoveSpeed(target) {
    return ENEMY_MOTION.moveSpeed * target.sizeScale;
  }

  function enemyBurrowSpeed(target) {
    return ENEMY_MOTION.burrowSpeed * target.sizeScale;
  }

  function planEnemyTurn(target, turnAmount, onWorldFloor = false) {
    const turnDuration = Math.abs(turnAmount) / ENEMY_MOTION.turnSpeed;
    target.movementMode = onWorldFloor ? "floor-turning" : "turning";
    target.turnDirection = turnAmount < 0 ? -1 : 1;
    target.turnRemaining = Math.abs(turnAmount);
    target.moveRemaining =
      enemyMoveSpeed(target) *
      turnDuration *
      ENEMY_MOTION.moveToTurnDurationRatio;
    target.vx = 0;
    target.vy = 0;
  }

  function chooseEnemyTurn(target, onWorldFloor = false) {
    if (onWorldFloor) {
      const desiredAngle = Math.random() < 0.5 ? 0 : Math.PI;
      let turnAmount = Math.atan2(
        Math.sin(desiredAngle - target.angle),
        Math.cos(desiredAngle - target.angle),
      );
      if (Math.abs(turnAmount) < 0.001) {
        turnAmount = Math.random() < 0.5 ? -Math.PI : Math.PI;
      }
      planEnemyTurn(target, turnAmount, true);
      return;
    }
    planEnemyTurn(
      target,
      randomRange(
        -ENEMY_MOTION.maximumTurnAngle,
        ENEMY_MOTION.maximumTurnAngle,
      ),
    );
  }

  function beginEnemyMove(target, onWorldFloor = false) {
    const moveSpeed = enemyMoveSpeed(target);
    target.movementMode = onWorldFloor ? "floor-moving" : "moving";
    target.vx = Math.cos(target.angle) * moveSpeed;
    target.vy = onWorldFloor
      ? 0
      : Math.sin(target.angle) * moveSpeed;
  }

  function advanceEnemyAnimation(target, dt, frameRate) {
    target.animationProgress =
      (target.animationProgress + dt * frameRate) % 2;
    target.animationFrame = Math.floor(target.animationProgress);
  }

  function distanceToGroundBelowEnemy(target, maximumDistance) {
    const step = Math.max(1, game.map.cellSize * 0.2);
    for (let distance = 0; distance <= maximumDistance; distance += step) {
      if (
        getBlockAtWorld(target.x, target.y + distance)?.type ===
        BLOCK_TYPES.GROUND
      ) {
        return distance;
      }
    }
    return null;
  }

  function beginEnemyBurrow(target, distanceToGround = 0) {
    const burrowSpeed = enemyBurrowSpeed(target);
    target.movementMode = "burrowing";
    target.angle = Math.PI * 0.5;
    target.vx = 0;
    target.vy = burrowSpeed;
    target.burrowRemaining =
      distanceToGround +
      game.map.cellSize * ENEMY_MOTION.burrowDistanceBlocks * target.sizeScale;
  }

  function beginEnemyFall(target) {
    const moveSpeed = enemyMoveSpeed(target);
    target.movementMode = "falling";
    target.vx = Math.cos(target.angle) * moveSpeed * 0.72;
    target.vy = Math.max(
      0,
      Math.sin(target.angle) * moveSpeed,
    );
    target.regionType = BLOCK_TYPES.AIR;
  }

  function keepEnemyInsideWorld(target) {
    const wrappedX = nearestPeriodicWorldX(target.x);
    const horizontalShift = wrappedX - target.x;
    if (horizontalShift !== 0) {
      target.x = wrappedX;
      if (Number.isFinite(target.panicOrbitCenterX)) {
        target.panicOrbitCenterX += horizontalShift;
      }
      if (Number.isFinite(target.boostDropReleaseX)) {
        target.boostDropReleaseX += horizontalShift;
      }
    }
    target.y = clamp(target.y, target.radius, game.height - target.radius);
  }

  function terrainSurfaceYBelow(x, startY) {
    const size = game.map.cellSize;
    const column = wrapWorldColumn(Math.floor(x / size));
    let row = clamp(
      Math.floor(startY / size),
      0,
      game.map.rows - 1,
    );
    const isSolid = (candidateRow) => {
      const block = getBlockAtGrid(column, candidateRow);
      return block && block.type !== BLOCK_TYPES.AIR;
    };

    // A newly spawned dragonfly can originate in a terrain candidate. Walk
    // upward to that cluster's exposed top instead of treating its interior
    // row as the surface.
    if (isSolid(row)) {
      while (row > 0 && isSolid(row - 1)) row -= 1;
      return row * size;
    }
    while (row < game.map.rows && !isSolid(row)) row += 1;
    return row < game.map.rows ? row * size : game.height;
  }

  function dragonflyBaseHoverYAt(
    target,
    x = target.x,
    y = target.y,
  ) {
    const surfaceY = terrainSurfaceYBelow(x, y);
    const clearance =
      target.radius +
      DRAGONFLY_MOTION.hoverClearanceBlocks * game.map.cellSize;
    return clamp(
      surfaceY - clearance,
      target.radius,
      game.height - target.radius,
    );
  }

  function dragonflyHoverY(target) {
    const bob =
      Math.sin(target.hoverPhase) * DRAGONFLY_MOTION.hoverBobAmplitude;
    return clamp(
      dragonflyBaseHoverYAt(target) + bob,
      target.radius,
      game.height - target.radius,
    );
  }

  function accelerateDragonflyVertically(
    target,
    currentY,
    desiredY,
    dt,
    velocityProperty,
  ) {
    const distance = desiredY - currentY;
    const desiredVelocity = clamp(
      distance * DRAGONFLY_MOTION.verticalResponse,
      -DRAGONFLY_MOTION.maximumVerticalSpeed,
      DRAGONFLY_MOTION.maximumVerticalSpeed,
    );
    const nextVelocity = moveToward(
      Number(target[velocityProperty]) || 0,
      desiredVelocity,
      DRAGONFLY_MOTION.verticalAcceleration * dt,
    );
    const nextY = currentY + nextVelocity * dt;

    if (
      Math.abs(distance) < 0.01 ||
      (distance < 0 && nextY <= desiredY) ||
      (distance > 0 && nextY >= desiredY)
    ) {
      target[velocityProperty] = 0;
      return desiredY;
    }

    target[velocityProperty] = nextVelocity;
    return nextY;
  }

  function dragonflyMaximumTerrainSafeYAt(
    target,
    x = target.x,
    y = target.y,
  ) {
    return clamp(
      terrainSurfaceYBelow(x, y) - target.radius,
      target.radius,
      game.height - target.radius,
    );
  }

  function initializeDragonflyTarget(target, random) {
    target.flightDirection = random() < 0.5 ? -1 : 1;
    target.angle = target.flightDirection < 0 ? Math.PI : 0;
    target.hoverPhase = random() * TAU;
    target.flightPhaseRemaining = lerp(
      DRAGONFLY_MOTION.minimumHoverDuration,
      DRAGONFLY_MOTION.maximumHoverDuration,
      random(),
    );
    target.movementMode = "dragonfly-hovering";
    target.regionType = BLOCK_TYPES.AIR;
    target.vx = 0;
    target.vy = 0;
    target.verticalFollowVelocity = 0;
    target.panicCenterVerticalVelocity = 0;
    target.y = dragonflyHoverY(target);
  }

  function beginDragonflyHover(target) {
    target.movementMode = "dragonfly-hovering";
    target.flightPhaseRemaining = randomRange(
      DRAGONFLY_MOTION.minimumHoverDuration,
      DRAGONFLY_MOTION.maximumHoverDuration,
    );
    target.vx = 0;
    target.vy = 0;
  }

  function beginDragonflyMove(target) {
    target.flightDirection = Math.random() < 0.5 ? -1 : 1;
    target.angle = target.flightDirection < 0 ? Math.PI : 0;
    target.movementMode = "dragonfly-moving";
    target.flightPhaseRemaining = randomRange(
      DRAGONFLY_MOTION.minimumMoveDuration,
      DRAGONFLY_MOTION.maximumMoveDuration,
    );
    target.vx = target.flightDirection * DRAGONFLY_MOTION.moveSpeed;
    target.vy = 0;
  }

  function retargetDragonflyPanicOrbit(target) {
    target.panicOrbitRadius = randomRange(
      DRAGONFLY_MOTION.minimumPanicOrbitRadius,
      DRAGONFLY_MOTION.maximumPanicOrbitRadius,
    );
    // Reanchor at the bottom of the next circle. This retains the current
    // world position instead of teleporting when the radius or direction
    // changes, while keeping the rest of the loop above the normal hover line.
    target.panicOrbitAngle = Math.PI * 0.5;
    target.panicOrbitCenterX = target.x;
    target.panicOrbitCenterY = target.y - target.panicOrbitRadius;
    target.panicOrbitDirection = Math.random() < 0.5 ? -1 : 1;
    target.panicAngularSpeed = randomRange(
      DRAGONFLY_MOTION.minimumPanicAngularSpeed,
      DRAGONFLY_MOTION.maximumPanicAngularSpeed,
    );
    target.panicDriftSpeed = randomRange(
      -DRAGONFLY_MOTION.maximumPanicDriftSpeed,
      DRAGONFLY_MOTION.maximumPanicDriftSpeed,
    );
    target.panicRetargetTimer = randomRange(
      DRAGONFLY_MOTION.minimumPanicRetargetDuration,
      DRAGONFLY_MOTION.maximumPanicRetargetDuration,
    );
  }

  function beginDragonflyPanic(target) {
    target.movementMode = "dragonfly-panicking";
    target.panicCenterVerticalVelocity =
      Number(target.verticalFollowVelocity) || target.vy || 0;
    retargetDragonflyPanicOrbit(target);
  }

  function updateDragonflyPanic(target, dt) {
    const previousX = target.x;
    const previousY = target.y;
    target.panicRetargetTimer -= dt;
    if (target.panicRetargetTimer <= 0) {
      retargetDragonflyPanicOrbit(target);
    }

    const radius = target.panicOrbitRadius;
    target.panicOrbitCenterX += target.panicDriftSpeed * dt;

    target.panicOrbitAngle =
      (target.panicOrbitAngle +
        target.panicOrbitDirection * target.panicAngularSpeed * dt +
        TAU) %
      TAU;
    const safeHoverY = dragonflyBaseHoverYAt(
      target,
      target.panicOrbitCenterX,
      target.y,
    );
    const desiredCenterY = safeHoverY - radius;
    target.panicOrbitCenterY = accelerateDragonflyVertically(
      target,
      target.panicOrbitCenterY,
      desiredCenterY,
      dt,
      "panicCenterVerticalVelocity",
    );

    target.x =
      target.panicOrbitCenterX +
      Math.cos(target.panicOrbitAngle) * radius;
    target.y =
      target.panicOrbitCenterY +
      Math.sin(target.panicOrbitAngle) * radius;
    const maximumTerrainSafeY = dragonflyMaximumTerrainSafeYAt(
      target,
      target.x,
      target.y,
    );
    if (target.y > maximumTerrainSafeY) {
      target.panicOrbitCenterY -= target.y - maximumTerrainSafeY;
      target.y = maximumTerrainSafeY;
      target.panicCenterVerticalVelocity = Math.min(
        0,
        target.panicCenterVerticalVelocity,
      );
    }
    const clampedY = clamp(
      target.y,
      target.radius,
      game.height - target.radius,
    );
    target.panicOrbitCenterY += clampedY - target.y;
    target.y = clampedY;

    target.vx = dt > 0 ? (target.x - previousX) / dt : 0;
    target.vy = dt > 0 ? (target.y - previousY) / dt : 0;
    if (Math.abs(target.vx) > 1) {
      target.flightDirection = target.vx < 0 ? -1 : 1;
      target.angle = target.flightDirection < 0 ? Math.PI : 0;
    }
    advanceEnemyAnimation(
      target,
      dt,
      DRAGONFLY_MOTION.panicWingFps,
    );
    target.regionType = BLOCK_TYPES.AIR;
  }

  function updateDragonfly(target, dt) {
    const wormDistanceSquared =
      (target.x - game.head.x) ** 2 +
      (target.y - game.head.y) ** 2;
    const panicking = target.movementMode === "dragonfly-panicking";
    const proximityRadius = panicking
      ? DRAGONFLY_MOTION.wormReleaseRadius
      : DRAGONFLY_MOTION.wormSenseRadius;
    if (wormDistanceSquared <= proximityRadius * proximityRadius) {
      if (!panicking) beginDragonflyPanic(target);
    } else if (panicking) {
      target.verticalFollowVelocity =
        Number(target.panicCenterVerticalVelocity) || target.vy || 0;
      beginDragonflyHover(target);
    }
    if (target.movementMode === "dragonfly-panicking") {
      updateDragonflyPanic(target, dt);
      return;
    }

    let remainingTime = dt;
    let phaseTransitions = 0;
    while (remainingTime > 0.00001 && phaseTransitions < 4) {
      if (target.flightPhaseRemaining <= 0.00001) {
        if (target.movementMode === "dragonfly-moving") {
          beginDragonflyHover(target);
        } else {
          beginDragonflyMove(target);
        }
        phaseTransitions += 1;
        continue;
      }

      const phaseTime = Math.min(
        remainingTime,
        target.flightPhaseRemaining,
      );
      if (target.movementMode === "dragonfly-moving") {
        target.x +=
          target.flightDirection * DRAGONFLY_MOTION.moveSpeed * phaseTime;
        advanceEnemyAnimation(
          target,
          phaseTime,
          DRAGONFLY_MOTION.movingWingFps,
        );
      } else {
        advanceEnemyAnimation(
          target,
          phaseTime,
          DRAGONFLY_MOTION.hoveringWingFps,
        );
      }
      target.flightPhaseRemaining = Math.max(
        0,
        target.flightPhaseRemaining - phaseTime,
      );
      remainingTime -= phaseTime;
    }

    const previousY = target.y;
    target.hoverPhase =
      (target.hoverPhase + DRAGONFLY_MOTION.hoverBobAngularSpeed * dt) % TAU;
    const desiredY = dragonflyHoverY(target);
    target.y = accelerateDragonflyVertically(
      target,
      target.y,
      desiredY,
      dt,
      "verticalFollowVelocity",
    );
    // Height changes use acceleration. This correction only prevents the
    // sprite from remaining embedded if a very tall cliff reaches it before
    // it can finish climbing, and never snaps it to the full hover altitude.
    const maximumTerrainSafeY = dragonflyMaximumTerrainSafeYAt(target);
    if (target.y > maximumTerrainSafeY) {
      target.y = maximumTerrainSafeY;
      target.verticalFollowVelocity = Math.min(
        0,
        target.verticalFollowVelocity,
      );
    }
    target.vx = target.movementMode === "dragonfly-moving"
      ? target.flightDirection * DRAGONFLY_MOTION.moveSpeed
      : 0;
    target.vy = dt > 0 ? (target.y - previousY) / dt : 0;
    target.regionType = BLOCK_TYPES.AIR;
  }

  function vultureBaseHoverYAt(
    target,
    x = target.x,
    y = target.y,
  ) {
    const surfaceY = terrainSurfaceYBelow(x, y);
    const clearance =
      target.radius +
      VULTURE_MOTION.hoverClearanceBlocks * game.map.cellSize;
    return clamp(
      surfaceY - clearance,
      target.radius,
      game.height - target.radius,
    );
  }

  function initializeVultureTarget(target, random) {
    target.flightDirection = random() < 0.5 ? -1 : 1;
    target.angle = target.flightDirection < 0 ? Math.PI : 0;
    target.vultureTravelRemaining =
      lerp(
        VULTURE_MOTION.minimumTravelBlocks,
        VULTURE_MOTION.maximumTravelBlocks,
        random(),
      ) * game.map.cellSize;
    target.vultureBobPhase = random() * TAU;
    target.vultureBaseY = vultureBaseHoverYAt(target);
    target.y = clamp(
      target.vultureBaseY +
        Math.sin(target.vultureBobPhase) * VULTURE_MOTION.bobAmplitude,
      target.radius,
      game.height - target.radius,
    );
    target.movementMode = "vulture-patrolling";
    target.regionType = BLOCK_TYPES.AIR;
    target.vx = target.flightDirection * VULTURE_MOTION.moveSpeed;
    target.vy = 0;
  }

  function chooseVultureTravelDistance(target, random = Math.random) {
    target.vultureTravelRemaining =
      lerp(
        VULTURE_MOTION.minimumTravelBlocks,
        VULTURE_MOTION.maximumTravelBlocks,
        random(),
      ) * game.map.cellSize;
  }

  function updateVulture(target, dt) {
    const previousY = target.y;
    let remainingDistance = VULTURE_MOTION.moveSpeed * dt;
    for (
      let reflection = 0;
      reflection < 4 && remainingDistance > 0.0001;
      reflection += 1
    ) {
      const travelDistance = Math.min(
        remainingDistance,
        target.vultureTravelRemaining,
      );
      target.x += target.flightDirection * travelDistance;
      remainingDistance -= travelDistance;
      target.vultureTravelRemaining = Math.max(
        0,
        target.vultureTravelRemaining - travelDistance,
      );

      const completedTravel = target.vultureTravelRemaining <= 0.0001;
      if (completedTravel) {
        target.flightDirection *= -1;
        chooseVultureTravelDistance(target);
      } else {
        break;
      }
    }

    target.angle = target.flightDirection < 0 ? Math.PI : 0;
    target.vultureBobPhase =
      (target.vultureBobPhase + VULTURE_MOTION.bobAngularSpeed * dt) % TAU;
    const desiredBaseY = vultureBaseHoverYAt(target);
    target.vultureBaseY = desiredBaseY < target.vultureBaseY
      ? desiredBaseY
      : moveToward(
          target.vultureBaseY,
          desiredBaseY,
          VULTURE_MOTION.verticalFollowSpeed * dt,
        );
    target.y = clamp(
      target.vultureBaseY +
        Math.sin(target.vultureBobPhase) * VULTURE_MOTION.bobAmplitude,
      target.radius,
      game.height - target.radius,
    );
    target.vx = target.flightDirection * VULTURE_MOTION.moveSpeed;
    target.vy = dt > 0 ? (target.y - previousY) / dt : 0;
    target.regionType = BLOCK_TYPES.AIR;
    advanceEnemyAnimation(target, dt, VULTURE_MOTION.wingFps);
  }

  function updateSequencedEnemy(target, dt) {
    const moveSpeed = enemyMoveSpeed(target);
    let remainingTime = dt;
    let phaseTransitions = 0;
    const onWorldFloor = target.movementMode.startsWith("floor-");

    while (remainingTime > 0.00001 && phaseTransitions < 8) {
      const turning = target.movementMode.endsWith("turning");
      if (turning) {
        const turnTime = Math.min(
          remainingTime,
          target.turnRemaining / ENEMY_MOTION.turnSpeed,
        );
        const turnStep = ENEMY_MOTION.turnSpeed * turnTime;
        target.angle += target.turnDirection * turnStep;
        target.turnRemaining = Math.max(0, target.turnRemaining - turnStep);
        remainingTime -= turnTime;
        advanceEnemyAnimation(
          target,
          turnTime,
          ENEMY_MOTION.turningScurryFps,
        );
        if (target.turnRemaining <= 0.00001) {
          beginEnemyMove(target, onWorldFloor);
          phaseTransitions += 1;
        }
        continue;
      }

      const moveTime = Math.min(
        remainingTime,
        target.moveRemaining / moveSpeed,
      );
      const distance = moveSpeed * moveTime;
      target.x += Math.cos(target.angle) * distance;
      if (onWorldFloor) {
        target.y = game.height - target.radius;
      } else {
        target.y += Math.sin(target.angle) * distance;
      }
      target.moveRemaining = Math.max(0, target.moveRemaining - distance);
      remainingTime -= moveTime;
      advanceEnemyAnimation(
        target,
        moveTime,
        ENEMY_MOTION.movingScurryFps,
      );
      keepEnemyInsideWorld(target);

      if (onWorldFloor) {
        const groundDistance = distanceToGroundBelowEnemy(
          target,
          target.radius,
        );
        if (groundDistance !== null) {
          beginEnemyBurrow(target, groundDistance);
          return;
        }
      } else {
        const block = getBlockAtWorld(target.x, target.y);
        if (block?.type === BLOCK_TYPES.GROUND) {
          target.regionType = BLOCK_TYPES.GROUND;
        } else {
          target.regionType = BLOCK_TYPES.AIR;
          const groundDistance = distanceToGroundBelowEnemy(
            target,
            target.radius + game.map.cellSize,
          );
          if (groundDistance === null) beginEnemyFall(target);
          else beginEnemyBurrow(target, groundDistance);
          return;
        }
      }

      if (target.moveRemaining <= 0.00001) {
        chooseEnemyTurn(target, onWorldFloor);
        phaseTransitions += 1;
      }
    }
  }

  function updateBurrowingEnemy(target, dt) {
    const burrowSpeed = enemyBurrowSpeed(target);
    const distance = Math.min(
      target.burrowRemaining,
      burrowSpeed * dt,
    );
    target.angle = Math.PI * 0.5;
    target.y += distance;
    target.burrowRemaining -= distance;
    advanceEnemyAnimation(
      target,
      distance / burrowSpeed,
      ENEMY_MOTION.movingScurryFps,
    );
    keepEnemyInsideWorld(target);

    const block = getBlockAtWorld(target.x, target.y);
    target.regionType = block?.type || BLOCK_TYPES.AIR;
    if (target.y >= game.height - target.radius) {
      target.y = game.height - target.radius;
      if (block?.type === BLOCK_TYPES.GROUND) {
        chooseEnemyTurn(target);
      } else {
        chooseEnemyTurn(target, true);
      }
      return;
    }

    if (target.burrowRemaining > 0) return;
    if (block?.type === BLOCK_TYPES.GROUND) {
      chooseEnemyTurn(target);
    } else {
      beginEnemyFall(target);
    }
  }

  function updateFallingEnemy(target, dt) {
    target.vx *= Math.pow(ENEMY_MOTION.airDrag, dt);
    target.vy = Math.min(
      ENEMY_MOTION.maximumFallSpeed,
      target.vy + worldGravityAcceleration() * dt,
    );
    target.x += target.vx * dt;
    target.y += target.vy * dt;
    keepEnemyInsideWorld(target);
    if (magnitude(target.vx, target.vy) > 0.1) {
      target.angle = Math.atan2(target.vy, target.vx);
    }

    const block = getBlockAtWorld(target.x, target.y);
    if (block?.type === BLOCK_TYPES.GROUND) {
      target.regionType = BLOCK_TYPES.GROUND;
      beginEnemyBurrow(target);
      return;
    }

    target.regionType = BLOCK_TYPES.AIR;
    const groundDistance = distanceToGroundBelowEnemy(
      target,
      target.radius + Math.max(2, target.vy * dt),
    );
    if (groundDistance !== null) {
      beginEnemyBurrow(target, groundDistance);
      return;
    }
    if (target.y >= game.height - target.radius) {
      target.y = game.height - target.radius;
      chooseEnemyTurn(target, true);
    }
  }

  function findSolidBlockCollision(
    startX,
    startY,
    endX,
    endY,
    radius,
  ) {
    const size = game.map.cellSize;
    const minimumColumn = Math.floor(
      (Math.min(startX, endX) - radius) / size,
    );
    const maximumColumn = Math.floor(
      (Math.max(startX, endX) + radius) / size,
    );
    const minimumRow = clamp(
      Math.floor((Math.min(startY, endY) - radius) / size),
      0,
      game.map.rows - 1,
    );
    const maximumRow = clamp(
      Math.floor((Math.max(startY, endY) + radius) / size),
      0,
      game.map.rows - 1,
    );
    let earliestCollision = null;

    for (let row = minimumRow; row <= maximumRow; row += 1) {
      for (let column = minimumColumn; column <= maximumColumn; column += 1) {
        const block = getBlockAtGrid(column, row);
        if (!block || block.type === BLOCK_TYPES.AIR) continue;
        const collision = sweepPointAgainstAabb(
          startX,
          startY,
          endX,
          endY,
          column * size - radius,
          row * size - radius,
          (column + 1) * size + radius,
          (row + 1) * size + radius,
        );
        if (!collision) continue;
        const isEarlier =
          !earliestCollision ||
          collision.time < earliestCollision.time - 0.000001;
        const isShallowerStartOverlap =
          earliestCollision &&
          Math.abs(collision.time - earliestCollision.time) <= 0.000001 &&
          collision.startsInside &&
          collision.penetration <
            (earliestCollision.penetration ?? Infinity);
        if (isEarlier || isShallowerStartOverlap) {
          earliestCollision = { ...collision, block };
        }
      }
    }
    return earliestCollision;
  }

  function moveAirborneMeat(target, dt) {
    let remainingTime = dt;
    for (
      let impact = 0;
      impact < MEAT_MOTION.maximumCollisionsPerFrame &&
      remainingTime > 0.000001;
      impact += 1
    ) {
      const startX = target.x;
      const startY = target.y;
      const endX = startX + target.vx * remainingTime;
      const endY = startY + target.vy * remainingTime;
      const collision = findSolidBlockCollision(
        startX,
        startY,
        endX,
        endY,
        target.radius,
      );
      if (!collision) {
        target.x = endX;
        target.y = endY;
        break;
      }

      const collisionTime = clamp(collision.time, 0, 1);
      target.x = lerp(startX, endX, collisionTime);
      target.y = lerp(startY, endY, collisionTime);
      const separation =
        (collision.startsInside ? collision.penetration || 0 : 0) +
        MEAT_MOTION.collisionInset;
      target.x += collision.normalX * separation;
      target.y += collision.normalY * separation;

      const normalVelocity =
        target.vx * collision.normalX +
        target.vy * collision.normalY;
      if (normalVelocity < 0) {
        const tangentVelocityX =
          target.vx - collision.normalX * normalVelocity;
        const tangentVelocityY =
          target.vy - collision.normalY * normalVelocity;
        const reboundSpeed =
          -normalVelocity > MEAT_MOTION.restingImpactSpeed
            ? -normalVelocity * MEAT_MOTION.surfaceRestitution
            : 0;
        target.vx =
          tangentVelocityX * MEAT_MOTION.surfaceFriction +
          collision.normalX * reboundSpeed;
        target.vy =
          tangentVelocityY * MEAT_MOTION.surfaceFriction +
          collision.normalY * reboundSpeed;
        target.spin *= MEAT_MOTION.impactSpinRetention;
      }
      remainingTime *= 1 - collisionTime;
    }
  }

  function updateDroppedMeat(target, dt) {
    const startingBlock = getBlockAtWorld(target.x, target.y);
    if (!startingBlock || startingBlock.type === BLOCK_TYPES.AIR) {
      target.meatAirborne = true;
    }

    if (target.meatAirborne) {
      target.vy = Math.min(
        MEAT_MOTION.maximumFallSpeed,
        target.vy + worldGravityAcceleration() * dt,
      );
      target.vx *= Math.pow(MEAT_MOTION.airDrag, dt);
      moveAirborneMeat(target, dt);
    } else {
      target.vx *= Math.pow(MEAT_MOTION.embeddedDrag, dt);
      target.vy *= Math.pow(MEAT_MOTION.embeddedDrag, dt);
      target.x += target.vx * dt;
      target.y += target.vy * dt;
      const endingBlock = getBlockAtWorld(target.x, target.y);
      if (!endingBlock || endingBlock.type === BLOCK_TYPES.AIR) {
        target.meatAirborne = true;
      }
    }

    target.angle += target.spin * dt;
    target.regionType =
      getBlockAtWorld(target.x, target.y)?.type || BLOCK_TYPES.AIR;
    keepEnemyInsideWorld(target);
  }

  function rabbitRestingSurfaceY(target) {
    const sampleSpacing = Math.max(2, game.map.cellSize * 0.5);
    let surfaceY = game.height;
    for (
      let offset = -target.radius;
      offset <= target.radius;
      offset += sampleSpacing
    ) {
      surfaceY = Math.min(
        surfaceY,
        terrainSurfaceYBelow(
          target.x + offset,
          target.y,
        ),
      );
    }
    return surfaceY;
  }

  function setRabbitResting(target, random = Math.random) {
    target.movementMode = "rabbit-resting";
    target.rabbitRestRemaining = lerp(
      RABBIT_MOTION.minimumRestDuration,
      RABBIT_MOTION.maximumRestDuration,
      random(),
    );
    target.vx = 0;
    target.vy = 0;
    target.animationProgress = 0;
    target.animationFrame = 0;
    target.regionType = BLOCK_TYPES.AIR;
  }

  function initializeRabbitTarget(target, random) {
    target.rabbitDirection = random() < 0.5 ? -1 : 1;
    target.angle = target.rabbitDirection < 0 ? Math.PI : 0;
    target.y = clamp(
      rabbitRestingSurfaceY(target) - target.radius,
      target.radius,
      game.height - target.radius,
    );
    setRabbitResting(target, random);
  }

  function beginRabbitJump(target) {
    const direction = Math.random() < 0.5 ? -1 : 1;
    target.rabbitDirection = direction;
    target.angle = direction < 0 ? Math.PI : 0;
    target.movementMode = "rabbit-jumping";
    target.vx = direction * RABBIT_MOTION.horizontalSpeed;
    target.vy = -RABBIT_MOTION.jumpSpeed;
    target.animationProgress = 1;
    target.animationFrame = 1;
    target.regionType = BLOCK_TYPES.AIR;
  }

  function updateRabbit(target, dt) {
    if (target.movementMode !== "rabbit-jumping") {
      target.rabbitRestRemaining = Math.max(
        0,
        (target.rabbitRestRemaining || 0) - dt,
      );
      if (target.rabbitRestRemaining <= 0) beginRabbitJump(target);
      return;
    }

    target.vy = Math.min(
      RABBIT_MOTION.maximumFallSpeed,
      target.vy + worldGravityAcceleration() * dt,
    );
    let remainingTime = dt;
    for (
      let impact = 0;
      impact < RABBIT_MOTION.maximumCollisionsPerFrame &&
      remainingTime > 0.000001;
      impact += 1
    ) {
      const startX = target.x;
      const startY = target.y;
      const endX = startX + target.vx * remainingTime;
      const endY = startY + target.vy * remainingTime;
      const collision = findSolidBlockCollision(
        startX,
        startY,
        endX,
        endY,
        target.radius,
      );
      if (!collision) {
        target.x = endX;
        target.y = endY;
        break;
      }

      const collisionTime = clamp(collision.time, 0, 1);
      target.x = lerp(startX, endX, collisionTime);
      target.y = lerp(startY, endY, collisionTime);
      const separation =
        (collision.startsInside ? collision.penetration || 0 : 0) +
        RABBIT_MOTION.collisionInset;
      target.x += collision.normalX * separation;
      target.y += collision.normalY * separation;
      const normalVelocity =
        target.vx * collision.normalX +
        target.vy * collision.normalY;

      if (
        collision.normalY < -0.5 &&
        target.vy >= 0 &&
        normalVelocity < 0
      ) {
        setRabbitResting(target);
        return;
      }

      if (normalVelocity < 0) {
        const retention = collision.normalY > 0.5
          ? RABBIT_MOTION.ceilingBounceRetention
          : RABBIT_MOTION.wallBounceRetention;
        target.vx -=
          collision.normalX * normalVelocity * (1 + retention);
        target.vy -=
          collision.normalY * normalVelocity * (1 + retention);
        if (Math.abs(target.vx) > 0.5) {
          target.rabbitDirection = target.vx < 0 ? -1 : 1;
          target.angle = target.rabbitDirection < 0 ? Math.PI : 0;
        }
      }
      remainingTime *= 1 - collisionTime;
    }

    if (target.y < target.radius) {
      target.y = target.radius;
      target.vy = Math.abs(target.vy) * RABBIT_MOTION.ceilingBounceRetention;
    } else if (target.y >= game.height - target.radius && target.vy >= 0) {
      target.y = game.height - target.radius;
      setRabbitResting(target);
      return;
    }
    target.animationProgress = 1;
    target.animationFrame = 1;
    target.regionType =
      getBlockAtWorld(target.x, target.y)?.type || BLOCK_TYPES.AIR;
  }

  function updateParalyzedEnemy(target, dt) {
    const previousX = target.x;
    const previousY = target.y;
    target.vx = (Number(target.vx) || 0) * Math.pow(ENEMY_MOTION.airDrag, dt);
    target.vy = Math.min(
      ENEMY_MOTION.maximumFallSpeed,
      (Number(target.vy) || 0) + worldGravityAcceleration() * dt,
    );
    target.x += target.vx * dt;
    target.y += target.vy * dt;
    keepEnemyInsideWorld(target);

    const block = getBlockAtWorld(target.x, target.y);
    if (block?.type && block.type !== BLOCK_TYPES.AIR) {
      target.x = previousX;
      target.y = previousY;
      target.vx *= 0.2;
      target.vy = 0;
      target.regionType = block.type;
      return;
    }
    target.regionType = BLOCK_TYPES.AIR;
  }

  function updateTargets(dt) {
    game.targets.forEach((target) => {
      keepEnemyInsideWorld(target);
      // Acid particles update after enemies. Preserve this frame's starting
      // position so a fast particle and a fast enemy are tested in their
      // shared moving reference frame instead of only against the endpoint.
      target.acidPreviousX = target.x;
      target.acidPreviousY = target.y;
      target.healthBarTimer = Math.max(
        0,
        (Number(target.healthBarTimer) || 0) - dt,
      );
      // `game.latchAttack` is the sole owner of the latched state. Recover
      // defensively if an older save/session or a future transition ever
      // leaves a target flagged without that ownership; otherwise the early
      // return below would freeze it and every special targeter would skip it.
      if (target.latched && game.latchAttack?.target !== target) {
        target.latched = false;
        target.boostLatchHitboxDisabled = true;
      }
      if (target.tongueCaptured) return;
      if (target.paralyzed) {
        updateParalyzedEnemy(target, dt);
        return;
      }
      if (target.latched) {
        if (
          game.latchAttack?.target === target &&
          game.latchAttack.phase === "biting"
        ) {
          advanceEnemyAnimation(
            target,
            dt,
            ENEMY_MOTION.movingScurryFps *
              BOOST_LATCH_RULES.scurryAnimationMultiplier,
          );
        }
        return;
      }
      target.biteBounceCooldown = Math.max(
        0,
        (target.biteBounceCooldown || 0) - dt,
      );
      if (target.kind === ENEMY_TYPES.RABBIT) {
        updateRabbit(target, dt);
      } else if (target.kind === ENEMY_TYPES.MEAT) {
        updateDroppedMeat(target, dt);
      } else if (
        ENEMY_DEFINITIONS[target.kind]?.flightBehavior === "dragonfly"
      ) {
        updateDragonfly(target, dt);
      } else if (
        ENEMY_DEFINITIONS[target.kind]?.flightBehavior === "vulture"
      ) {
        updateVulture(target, dt);
      } else if (target.movementMode === "burrowing") {
        updateBurrowingEnemy(target, dt);
      } else if (target.movementMode === "falling") {
        updateFallingEnemy(target, dt);
      } else {
        updateSequencedEnemy(target, dt);
      }
    });
  }

  function acidParticleSizeScale() {
    return clamp(Math.sqrt(wormScale() / ENTITY_SCALE), 1, 2.15);
  }

  function acidParticlesPerSecond() {
    const levelScale =
      1 +
      Math.sqrt(Math.max(0, game.growthLevel)) *
        ACID_RULES.particlesPerSecondSqrtLevelScale;
    return Math.min(
      ACID_RULES.maximumParticlesPerSecond,
      ACID_RULES.particlesPerSecond * levelScale,
    );
  }

  function acidLevelRatio() {
    return clamp(
      Math.max(0, game.growthLevel) / ACID_RULES.maximumScalingLevel,
      0,
      1,
    );
  }

  function acidVisualDropletCount() {
    const expectedCount =
      ACID_RULES.baseVisualDropletsPerParticle *
      lerp(
        ACID_RULES.minimumVisualDensityMultiplier,
        ACID_RULES.maximumVisualDensityMultiplier,
        acidLevelRatio(),
      );
    const tiers = ACID_RULES.visualDensityTiers;
    if (expectedCount <= tiers[0]) return tiers[0];
    for (let index = 1; index < tiers.length; index += 1) {
      const upper = tiers[index];
      if (expectedCount > upper) continue;
      const lower = tiers[index - 1];
      const upperChance = (expectedCount - lower) / (upper - lower);
      return Math.random() < upperChance ? upper : lower;
    }
    return tiers[tiers.length - 1];
  }

  function acidNozzleSpeed() {
    return lerp(
      ACID_RULES.minimumNozzleSpeed,
      ACID_RULES.maximumNozzleSpeed,
      acidLevelRatio(),
    );
  }

  function acidParticleLifetimeBonus() {
    return ACID_RULES.maximumLifeBonus * acidLevelRatio();
  }

  function acidParticleRenderRadius(particle) {
    const fade = clamp(particle.life / ACID_RULES.fadeDuration, 0, 1);
    return particle.radius * Math.pow(fade, 0.72);
  }

  function clearAcidParticles() {
    for (let index = 0; index < game.acidParticles.length; index += 1) {
      const particle = game.acidParticles[index];
      particle.active = false;
      particle.latchedTarget = null;
      game.acidParticlePool.push(particle);
    }
    game.acidParticles.length = 0;
    game.acidLastEmittedParticle = null;
    game.acidEmissionAccumulator = 0;
    game.spitterAimAngle = null;
    acidLatchedTargetSeconds.clear();
    acidActiveTargets.clear();
  }

  function releaseAcidParticle(index) {
    const particle = game.acidParticles[index];
    particle.active = false;
    // Do not let the pool retain an otherwise unreachable enemy object after
    // a kill, capture, reset, or world unload.
    particle.latchedTarget = null;
    particle.latchNormalX = 0;
    particle.latchNormalY = 0;
    if (game.acidLastEmittedParticle === particle) {
      game.acidLastEmittedParticle = null;
    }
    const lastIndex = game.acidParticles.length - 1;
    if (index !== lastIndex) {
      game.acidParticles[index] = game.acidParticles[lastIndex];
    }
    game.acidParticles.pop();
    game.acidParticlePool.push(particle);
  }

  function spawnAcidParticle(nozzle) {
    if (game.acidParticles.length >= ACID_RULES.maximumParticles) return false;
    const particle = game.acidParticlePool.pop() || {};
    const sizeScale = acidParticleSizeScale();
    const radiusVariation = lerp(
      1 - ACID_RULES.particleRadiusVariance,
      1 + ACID_RULES.particleRadiusVariance,
      Math.random(),
    );
    const flowWobble =
      Math.sin(game.elapsed * ACID_RULES.flowWobbleFrequency) *
      ACID_RULES.flowWobbleAngle;
    const angle =
      nozzle.angle +
      flowWobble +
      (Math.random() * 2 - 1) * ACID_RULES.spreadAngle;
    const normalX = -Math.sin(nozzle.angle);
    const normalY = Math.cos(nozzle.angle);
    const nozzleJitter =
      (Math.random() * 2 - 1) * sizeScale * ACID_RULES.nozzleJitter;
    const jetSpeed =
      acidNozzleSpeed() *
      lerp(
        1 - ACID_RULES.nozzleSpeedVariance,
        1 + ACID_RULES.nozzleSpeedVariance,
        Math.random(),
      );
    const lateralSpeed =
      (Math.random() * 2 - 1) * ACID_RULES.lateralSpeedJitter * sizeScale;
    // Keep the worm's launch momentum separate from the nozzle jet. The
    // half-speed soil multiplier applies only to the jet, while underground
    // friction can still dissipate both parts of the particle's motion.
    const inheritedVelocityX = game.velocity.x;
    const inheritedVelocityY = game.velocity.y;
    particle.active = true;
    particle.generation = ++game.acidParticleGeneration;
    particle.x = nozzle.x + normalX * nozzleJitter;
    particle.y = nozzle.y + normalY * nozzleJitter;
    particle.previousX = particle.x;
    particle.previousY = particle.y;
    const relativeVelocityX =
      Math.cos(angle) * jetSpeed + normalX * lateralSpeed;
    const relativeVelocityY =
      Math.sin(angle) * jetSpeed + normalY * lateralSpeed;
    const guideSpeed = Math.max(
      0.0001,
      magnitude(relativeVelocityX, relativeVelocityY),
    );
    const nozzleCosine = Math.cos(nozzle.angle);
    const nozzleSine = Math.sin(nozzle.angle);
    const spawnOffsetX = particle.x - nozzle.x;
    const spawnOffsetY = particle.y - nozzle.y;
    particle.headGuideActive = true;
    particle.headGuideStartX =
      spawnOffsetX * nozzleCosine + spawnOffsetY * nozzleSine;
    particle.headGuideStartY =
      -spawnOffsetX * nozzleSine + spawnOffsetY * nozzleCosine;
    particle.headGuideDirectionX =
      (relativeVelocityX * nozzleCosine +
        relativeVelocityY * nozzleSine) /
      guideSpeed;
    particle.headGuideDirectionY =
      (-relativeVelocityX * nozzleSine +
        relativeVelocityY * nozzleCosine) /
      guideSpeed;
    particle.headGuideSpeed = guideSpeed;
    particle.headGuideDistance = 0;
    particle.headGuideLength =
      WORM_SPRITE_METRICS.headWidth * wormScale();
    particle.headGuideScale = wormScale();
    particle.headGuidePoseX = nozzle.x;
    particle.headGuidePoseY = nozzle.y;
    particle.headGuidePoseAngle = nozzle.angle;
    particle.headGuidePoseMode = spitterCranePoseIsActive() ? 1 : 0;
    particle.inheritedVx = inheritedVelocityX;
    particle.inheritedVy = inheritedVelocityY;
    particle.vx = relativeVelocityX + inheritedVelocityX;
    particle.vy = relativeVelocityY + inheritedVelocityY;
    particle.radius = ACID_RULES.particleRadius * sizeScale * radiusVariation;
    const lifetimeBonus = acidParticleLifetimeBonus();
    particle.life = lerp(
      ACID_RULES.minimumLife + lifetimeBonus,
      ACID_RULES.maximumLife + lifetimeBonus,
      Math.random(),
    );
    particle.maximumLife = particle.life;
    particle.visualDropletCount = acidVisualDropletCount();
    particle.visualVariant =
      particle.generation % ACID_RULES.visualClusterVariants;
    particle.collisionEpoch = 0;
    particle.latchedTarget = null;
    particle.latchNormalX = 0;
    particle.latchNormalY = 0;
    particle.acidWorldMotionTime = 0;
    const previous = game.acidLastEmittedParticle;
    particle.link = previous?.active ? previous : null;
    particle.linkGeneration = particle.link?.generation ?? -1;
    game.acidLastEmittedParticle = particle;
    game.acidParticles.push(particle);
    return true;
  }

  function emitSpitterAcid(dt, nozzlePose = null) {
    if (!spitterSprayIsActive()) return;
    game.acidEmissionAccumulator = Math.min(
      ACID_RULES.maximumEmissionsPerFrame,
      game.acidEmissionAccumulator + acidParticlesPerSecond() * dt,
    );
    const emissionCount = Math.min(
      ACID_RULES.maximumEmissionsPerFrame,
      Math.floor(game.acidEmissionAccumulator),
    );
    if (emissionCount <= 0) return;
    const nozzle = nozzlePose || spitterAcidNozzlePose();
    let emitted = 0;
    while (emitted < emissionCount && spawnAcidParticle(nozzle)) {
      emitted += 1;
      game.acidEmissionAccumulator -= 1;
    }
    if (game.acidParticles.length >= ACID_RULES.maximumParticles) {
      game.acidEmissionAccumulator = 0;
    }
  }

  function acidPointIsInUndergroundSoil(x, y) {
    const size = game.map.cellSize;
    const row = Math.floor(y / size);
    if (row < 0 || row >= game.map.rows) return false;
    const column = wrapWorldColumn(Math.floor(x / size));
    const blockIndex = row * game.map.columns + column;
    const tileValue = game.map.tiles[blockIndex];
    return (
      tileValue === MATERIAL_TILE_VALUES[BLOCK_TYPES.GROUND] ||
      (tileValue === TUNNELED_GROUND_TILE_VALUE &&
        game.map.acidTunnelDecayRecords.has(blockIndex))
    );
  }

  function tunnelGroundTilesTouchedByAcid(
    startX,
    startY,
    endX,
    endY,
    radius,
    remainingLife,
  ) {
    if (remainingLife <= 0 || game.map.columns <= 0) return;
    const size = game.map.cellSize;
    const minimumColumn = Math.floor(
      (Math.min(startX, endX) - radius) / size,
    );
    const maximumColumn = Math.floor(
      (Math.max(startX, endX) + radius) / size,
    );
    const minimumRow = clamp(
      Math.floor((Math.min(startY, endY) - radius) / size),
      0,
      game.map.rows - 1,
    );
    const maximumRow = clamp(
      Math.floor((Math.max(startY, endY) + radius) / size),
      0,
      game.map.rows - 1,
    );
    const groundValue = MATERIAL_TILE_VALUES[BLOCK_TYPES.GROUND];

    for (let row = minimumRow; row <= maximumRow; row += 1) {
      const rowOffset = row * game.map.columns;
      for (
        let column = minimumColumn;
        column <= maximumColumn;
        column += 1
      ) {
        const wrappedColumn = wrapWorldColumn(column);
        const blockIndex = rowOffset + wrappedColumn;
        const tileValue = game.map.tiles[blockIndex];
        const acidOwnedTunnel =
          tileValue === TUNNELED_GROUND_TILE_VALUE &&
          game.map.acidTunnelDecayRecords.has(blockIndex);
        if (tileValue !== groundValue && !acidOwnedTunnel) continue;
        if (tileValue === groundValue && acidTunnelTilesRemaining <= 0) {
          continue;
        }
        if (
          !sweepPointAgainstAabb(
            startX,
            startY,
            endX,
            endY,
            column * size - radius,
            row * size - radius,
            (column + 1) * size + radius,
            (row + 1) * size + radius,
          )
        ) {
          continue;
        }
        if (
          tunnelGroundTileWithAcid(
            wrappedColumn,
            row,
            blockIndex,
            remainingLife,
          )
        ) {
          acidTunnelTilesRemaining -= 1;
          acidTunnelTilesChanged += 1;
        }
      }
    }
  }

  function findAcidBlockCollision(
    startX,
    startY,
    endX,
    endY,
    radius,
  ) {
    const size = game.map.cellSize;
    const minimumColumn = Math.floor(
      (Math.min(startX, endX) - radius) / size,
    );
    const maximumColumn = Math.floor(
      (Math.max(startX, endX) + radius) / size,
    );
    const minimumRow = clamp(
      Math.floor((Math.min(startY, endY) - radius) / size),
      0,
      game.map.rows - 1,
    );
    const maximumRow = clamp(
      Math.floor((Math.max(startY, endY) + radius) / size),
      0,
      game.map.rows - 1,
    );
    let earliestCollision = null;

    for (let row = minimumRow; row <= maximumRow; row += 1) {
      const rowOffset = row * game.map.columns;
      for (let column = minimumColumn; column <= maximumColumn; column += 1) {
        const wrappedColumn = wrapWorldColumn(column);
        const blockIndex = rowOffset + wrappedColumn;
        const tileValue = game.map.tiles[blockIndex];
        if (
          tileValue === 0 ||
          tileValue === MATERIAL_TILE_VALUES[BLOCK_TYPES.GROUND] ||
          tileValue === TUNNELED_GROUND_TILE_VALUE
        ) {
          continue;
        }
        const collision = sweepPointAgainstAabb(
          startX,
          startY,
          endX,
          endY,
          column * size - radius,
          row * size - radius,
          (column + 1) * size + radius,
          (row + 1) * size + radius,
        );
        if (!collision) continue;
        const isEarlier =
          !earliestCollision ||
          collision.time < earliestCollision.time - 0.000001;
        const isShallowerStartOverlap =
          earliestCollision &&
          Math.abs(collision.time - earliestCollision.time) <= 0.000001 &&
          collision.startsInside &&
          collision.penetration <
            (earliestCollision.penetration ?? Infinity);
        if (isEarlier || isShallowerStartOverlap) {
          earliestCollision = {
            ...collision,
            tileValue,
            column: wrappedColumn,
            row,
            blockIndex,
          };
        }
      }
    }
    return earliestCollision;
  }

  function moveAcidParticle(particle, dt, recordPrevious = true) {
    if (recordPrevious) {
      particle.previousX = particle.x;
      particle.previousY = particle.y;
    }
    particle.inheritedVx = Number.isFinite(particle.inheritedVx)
      ? particle.inheritedVx
      : 0;
    particle.inheritedVy = Number.isFinite(particle.inheritedVy)
      ? particle.inheritedVy
      : 0;
    const drag = Math.pow(ACID_RULES.airDrag, dt);
    particle.vx =
      particle.inheritedVx +
      (particle.vx - particle.inheritedVx) * drag;
    const maximumFallSpeed = acidNozzleSpeed() * 2.5;
    const relativeVelocityX = particle.vx - particle.inheritedVx;
    const relativeVelocityY = particle.vy - particle.inheritedVy;
    const possibleAirRelativeVelocityY = Math.min(
      maximumFallSpeed,
      relativeVelocityY + ACID_RULES.gravity * dt,
    );
    const soilScale = ACID_RULES.soilSpeedMultiplier;
    const unrestrictedDistance =
      Math.max(
        magnitude(particle.vx, particle.vy),
        magnitude(
          particle.vx,
          particle.inheritedVy + possibleAirRelativeVelocityY,
        ),
        magnitude(
          particle.inheritedVx + relativeVelocityX * soilScale,
          particle.inheritedVy + relativeVelocityY * soilScale,
        ),
        magnitude(
          particle.inheritedVx + relativeVelocityX * soilScale,
          particle.inheritedVy + possibleAirRelativeVelocityY * soilScale,
        ),
      ) * dt;
    const movementSubsteps = clamp(
      Math.ceil(
        unrestrictedDistance / Math.max(1, game.map.cellSize * 0.5),
      ),
      1,
      ACID_RULES.maximumMovementSubsteps,
    );
    const substepDuration = dt / movementSubsteps;
    let collisionCount = 0;
    movement: for (let step = 0; step < movementSubsteps; step += 1) {
      // Soil slows the stream but does not pull it downward. Apply gravity in
      // small medium-aware steps so crossing a surface changes behavior
      // promptly without adding a terrain scan or extra collision pass.
      const inUndergroundSoil = acidPointIsInUndergroundSoil(
        particle.x,
        particle.y,
      );
      if (inUndergroundSoil) {
        const soilRetention = Math.pow(
          ACID_RULES.soilVelocityRetentionPerSecond,
          substepDuration,
        );
        particle.vx *= soilRetention;
        particle.vy *= soilRetention;
        particle.inheritedVx *= soilRetention;
        particle.inheritedVy *= soilRetention;
      } else {
        const nextRelativeVelocityY = Math.min(
          maximumFallSpeed,
          particle.vy -
            particle.inheritedVy +
            ACID_RULES.gravity * substepDuration,
        );
        particle.vy = particle.inheritedVy + nextRelativeVelocityY;
      }
      let remainingTime = substepDuration;
      while (remainingTime > 0.000001) {
        const startX = particle.x;
        const startY = particle.y;
        const movementScale = acidPointIsInUndergroundSoil(startX, startY)
          ? ACID_RULES.soilSpeedMultiplier
          : 1;
        const effectiveVelocityX = lerp(
          particle.inheritedVx,
          particle.vx,
          movementScale,
        );
        const effectiveVelocityY = lerp(
          particle.inheritedVy,
          particle.vy,
          movementScale,
        );
        const endX = startX + effectiveVelocityX * remainingTime;
        const endY = startY + effectiveVelocityY * remainingTime;
        const collision = findAcidBlockCollision(
          startX,
          startY,
          endX,
          endY,
          particle.radius,
        );
        if (!collision) {
          tunnelGroundTilesTouchedByAcid(
            startX,
            startY,
            endX,
            endY,
            particle.radius,
            particle.life,
          );
          particle.x = endX;
          particle.y = endY;
          break;
        }

        collisionCount += 1;
        particle.collisionEpoch += 1;
        const collisionTime = clamp(collision.time, 0, 1);
        particle.x = lerp(startX, endX, collisionTime);
        particle.y = lerp(startY, endY, collisionTime);
        tunnelGroundTilesTouchedByAcid(
          startX,
          startY,
          particle.x,
          particle.y,
          particle.radius,
          particle.life,
        );
        const separation =
          (collision.startsInside ? collision.penetration || 0 : 0) +
          ACID_RULES.collisionInset;
        particle.x += collision.normalX * separation;
        particle.y += collision.normalY * separation;
        const normalVelocity =
          effectiveVelocityX * collision.normalX +
          effectiveVelocityY * collision.normalY;
        if (normalVelocity < 0) {
          // The collision response is a linear transform. Apply it to the
          // stored launch and full-speed vectors independently so their
          // medium-weighted sum receives the exact same rebound.
          const fullNormalVelocity =
            particle.vx * collision.normalX +
            particle.vy * collision.normalY;
          const inheritedNormalVelocity =
            particle.inheritedVx * collision.normalX +
            particle.inheritedVy * collision.normalY;
          particle.vx =
            (particle.vx - collision.normalX * fullNormalVelocity) *
              ACID_RULES.surfaceFriction -
            collision.normalX *
              fullNormalVelocity *
              ACID_RULES.restitution;
          particle.vy =
            (particle.vy - collision.normalY * fullNormalVelocity) *
              ACID_RULES.surfaceFriction -
            collision.normalY *
              fullNormalVelocity *
              ACID_RULES.restitution;
          particle.inheritedVx =
            (particle.inheritedVx -
              collision.normalX * inheritedNormalVelocity) *
              ACID_RULES.surfaceFriction -
            collision.normalX *
              inheritedNormalVelocity *
              ACID_RULES.restitution;
          particle.inheritedVy =
            (particle.inheritedVy -
              collision.normalY * inheritedNormalVelocity) *
              ACID_RULES.surfaceFriction -
            collision.normalY *
              inheritedNormalVelocity *
              ACID_RULES.restitution;
        }
        if (collisionCount >= ACID_RULES.maximumCollisionsPerFrame) {
          break movement;
        }
        remainingTime *= collisionTime <= 0.000001 ? 0.2 : 1 - collisionTime;
      }
    }
  }

  function rebaseHeadGuidedAcidParticle(particle, previousPose) {
    const particleX = nearestPeriodicWorldX(particle.x, previousPose.x);
    const offsetX = particleX - previousPose.x;
    const offsetY = particle.y - previousPose.y;
    const cosine = Math.cos(previousPose.angle);
    const sine = Math.sin(previousPose.angle);
    const localX = cosine * offsetX + sine * offsetY;
    const localY = -sine * offsetX + cosine * offsetY;
    const guideDistance = clamp(
      Number(particle.headGuideDistance) || 0,
      0,
      Math.max(0, Number(particle.headGuideLength) || 0),
    );

    // Absorb a discrete visual-pose change into the line's local origin. The
    // particle keeps its exact world position, original ray direction, speed,
    // accumulated distance, and stored full-image length.
    particle.x = particleX;
    particle.headGuideStartX =
      localX - particle.headGuideDirectionX * guideDistance;
    particle.headGuideStartY =
      localY - particle.headGuideDirectionY * guideDistance;
    particle.headGuidePoseX = previousPose.x;
    particle.headGuidePoseY = previousPose.y;
    particle.headGuidePoseAngle = previousPose.angle;
  }

  function safePreviousAcidGuidePose(currentPose) {
    const headX = nearestPeriodicWorldX(game.head.x, game.previous.x);
    const physicalDeltaX = headX - game.previous.x;
    const physicalDeltaY = game.head.y - game.previous.y;
    const previousAngle = Number.isFinite(game.previousEatHitbox?.angle)
      ? game.previousEatHitbox.angle
      : getWormHeadAngle();
    const currentAngle = getWormHeadAngle();
    const physicalAngleDelta = Math.atan2(
      Math.sin(currentAngle - previousAngle),
      Math.cos(currentAngle - previousAngle),
    );
    return {
      x: currentPose.x - physicalDeltaX,
      y: currentPose.y - physicalDeltaY,
      angle: currentPose.angle - physicalAngleDelta,
    };
  }

  function setHeadGuidedAcidParticleState(
    particle,
    poseX,
    poseY,
    poseAngle,
    guideDistance,
    wormVelocityX,
    wormVelocityY,
  ) {
    const localX =
      particle.headGuideStartX +
      particle.headGuideDirectionX * guideDistance;
    const localY =
      particle.headGuideStartY +
      particle.headGuideDirectionY * guideDistance;
    const cosine = Math.cos(poseAngle);
    const sine = Math.sin(poseAngle);
    const offsetX = cosine * localX - sine * localY;
    const offsetY = sine * localX + cosine * localY;
    const localVelocityX =
      particle.headGuideDirectionX * particle.headGuideSpeed;
    const localVelocityY =
      particle.headGuideDirectionY * particle.headGuideSpeed;
    const jetVelocityX =
      cosine * localVelocityX - sine * localVelocityY;
    const jetVelocityY =
      sine * localVelocityX + cosine * localVelocityY;
    particle.x = poseX + offsetX;
    particle.y = poseY + offsetY;
    // The rotating head-local guide already supplies the final aim direction.
    // Inherit only the worm's real physical momentum at separation; treating
    // crane translation or angular lever-arm motion as velocity produced an
    // enormous extra sideways kick as the level-scaled head grew.
    particle.inheritedVx = wormVelocityX;
    particle.inheritedVy = wormVelocityY;
    particle.vx = wormVelocityX + jetVelocityX;
    particle.vy = wormVelocityY + jetVelocityY;
  }

  function moveHeadGuidedAcidParticle(particle, dt, currentPose) {
    particle.acidWorldMotionTime = 0;
    const previousPoseX = Number.isFinite(particle.headGuidePoseX)
      ? particle.headGuidePoseX
      : currentPose.x;
    const previousPoseY = Number.isFinite(particle.headGuidePoseY)
      ? particle.headGuidePoseY
      : currentPose.y;
    const previousPoseAngle = Number.isFinite(particle.headGuidePoseAngle)
      ? particle.headGuidePoseAngle
      : currentPose.angle;
    const currentPoseX = nearestPeriodicWorldX(currentPose.x, previousPoseX);
    const poseDeltaX = currentPoseX - previousPoseX;
    const poseDeltaY = currentPose.y - previousPoseY;
    const poseAngleDelta = Math.atan2(
      Math.sin(currentPose.angle - previousPoseAngle),
      Math.cos(currentPose.angle - previousPoseAngle),
    );
    const guideSpeed = Math.max(
      0.0001,
      Number(particle.headGuideSpeed) || 0,
    );
    const guideLength = Math.max(
      0,
      Number(particle.headGuideLength) || 0,
    );
    const startingDistance = clamp(
      Number(particle.headGuideDistance) || 0,
      0,
      guideLength,
    );

    if (dt <= 0) {
      particle.previousX = particle.x;
      particle.previousY = particle.y;
      return;
    }
    if (guideLength <= 0) {
      particle.headGuideActive = false;
      particle.acidWorldMotionTime = dt;
      moveAcidParticle(particle, dt);
      return;
    }

    const wormVelocityX = Number(game.velocity.x) || 0;
    const wormVelocityY = Number(game.velocity.y) || 0;
    const distanceThisFrame = guideSpeed * dt;
    const reachesEdge =
      startingDistance + distanceThisFrame >= guideLength - 0.000001;
    const edgeFraction = reachesEdge
      ? clamp(
          (guideLength - startingDistance) /
            Math.max(0.0001, distanceThisFrame),
          0,
          1,
        )
      : 1;
    const candidateDistance = reachesEdge
      ? guideLength
      : startingDistance + distanceThisFrame;
    const candidatePoseX = previousPoseX + poseDeltaX * edgeFraction;
    const candidatePoseY = previousPoseY + poseDeltaY * edgeFraction;
    const candidatePoseAngle =
      previousPoseAngle + poseAngleDelta * edgeFraction;

    setHeadGuidedAcidParticleState(
      particle,
      candidatePoseX,
      candidatePoseY,
      candidatePoseAngle,
      candidateDistance,
      wormVelocityX,
      wormVelocityY,
    );

    const releaseFraction = reachesEdge ? edgeFraction : null;

    if (releaseFraction !== null) {
      const releaseDistance = Math.min(
        guideLength,
        startingDistance + distanceThisFrame * releaseFraction,
      );
      const releasePoseX = previousPoseX + poseDeltaX * releaseFraction;
      const releasePoseY = previousPoseY + poseDeltaY * releaseFraction;
      const releasePoseAngle =
        previousPoseAngle + poseAngleDelta * releaseFraction;
      setHeadGuidedAcidParticleState(
        particle,
        releasePoseX,
        releasePoseY,
        releasePoseAngle,
        releaseDistance,
        wormVelocityX,
        wormVelocityY,
      );
      particle.headGuideDistance = releaseDistance;
      particle.headGuideActive = false;
      // The guide itself is kinematic and non-interactive. Begin the physical
      // sweep at its edge so damage, tunneling, gravity, and collisions only
      // apply after the particle has actually been launched into the world.
      particle.previousX = particle.x;
      particle.previousY = particle.y;
      const remainingTime = dt * (1 - releaseFraction);
      particle.acidWorldMotionTime = remainingTime;
      if (remainingTime > 0.000001) {
        moveAcidParticle(particle, remainingTime, false);
      }
      return;
    }

    particle.headGuideDistance = candidateDistance;
    particle.headGuidePoseX = currentPoseX;
    particle.headGuidePoseY = currentPose.y;
    particle.headGuidePoseAngle =
      previousPoseAngle + poseAngleDelta;
    particle.previousX = particle.x;
    particle.previousY = particle.y;
  }

  function acidTargetCanHoldParticle(target) {
    return (
      acidActiveTargets.has(target) &&
      target.kind !== ENEMY_TYPES.MEAT &&
      target.health > 0 &&
      !target.tongueCaptured
    );
  }

  function acidParticleTargetContact(
    particle,
    target,
    targetStartFraction,
    output,
  ) {
    const startX = particle.previousX;
    const startY = particle.previousY;
    const endX = particle.x;
    const endY = particle.y;
    const particleReferenceX = (startX + endX) * 0.5;
    const targetEndX = nearestPeriodicWorldX(target.x, particleReferenceX);
    const targetPreviousX = nearestPeriodicWorldX(
      Number.isFinite(target.acidPreviousX)
        ? target.acidPreviousX
        : target.x,
      targetEndX,
    );
    const targetPreviousY = Number.isFinite(target.acidPreviousY)
      ? target.acidPreviousY
      : target.y;
    const targetStartX = lerp(
      targetPreviousX,
      targetEndX,
      targetStartFraction,
    );
    const targetStartY = lerp(
      targetPreviousY,
      target.y,
      targetStartFraction,
    );
    const relativeStartX = startX - targetStartX;
    const relativeStartY = startY - targetStartY;
    const relativeEndX = endX - targetEndX;
    const relativeEndY = endY - target.y;
    const radius = particle.radius + target.radius;

    if (
      (relativeStartX < -radius && relativeEndX < -radius) ||
      (relativeStartX > radius && relativeEndX > radius) ||
      (relativeStartY < -radius && relativeEndY < -radius) ||
      (relativeStartY > radius && relativeEndY > radius)
    ) {
      return false;
    }

    const relativeMovementX = relativeEndX - relativeStartX;
    const relativeMovementY = relativeEndY - relativeStartY;
    const startDistanceSquared =
      relativeStartX * relativeStartX +
      relativeStartY * relativeStartY;
    const radiusSquared = radius * radius;
    let contactTime = 0;
    if (startDistanceSquared > radiusSquared) {
      const movementLengthSquared =
        relativeMovementX * relativeMovementX +
        relativeMovementY * relativeMovementY;
      if (movementLengthSquared <= 0.000001) return false;
      const projection =
        relativeStartX * relativeMovementX +
        relativeStartY * relativeMovementY;
      const discriminant =
        projection * projection -
        movementLengthSquared * (startDistanceSquared - radiusSquared);
      if (discriminant < 0) return false;
      contactTime =
        (-projection - Math.sqrt(Math.max(0, discriminant))) /
        movementLengthSquared;
      if (contactTime < -0.000001 || contactTime > 1.000001) return false;
      contactTime = clamp(contactTime, 0, 1);
    }

    let normalX =
      relativeStartX + relativeMovementX * contactTime;
    let normalY =
      relativeStartY + relativeMovementY * contactTime;
    const normalLength = magnitude(normalX, normalY);
    if (normalLength > 0.0001) {
      normalX /= normalLength;
      normalY /= normalLength;
    } else {
      const movementLength = magnitude(
        relativeMovementX,
        relativeMovementY,
      );
      if (movementLength > 0.0001) {
        normalX = -relativeMovementX / movementLength;
        normalY = -relativeMovementY / movementLength;
      } else {
        normalX = Math.cos(Number(target.angle) || 0);
        normalY = Math.sin(Number(target.angle) || 0);
      }
    }

    output.time = contactTime;
    output.normalX = normalX;
    output.normalY = normalY;
    output.centerDistanceSquared =
      normalLength > 0.0001
        ? normalLength * normalLength
        : startDistanceSquared;
    return true;
  }

  function attachAcidParticleToTarget(
    particle,
    target,
    normalX,
    normalY,
  ) {
    particle.latchedTarget = target;
    particle.latchNormalX = normalX;
    particle.latchNormalY = normalY;
    particle.headGuideActive = false;
    particle.link = null;
    particle.linkGeneration = -1;
    particle.collisionEpoch = (Number(particle.collisionEpoch) || 0) + 1;
    // Contact starts a fresh attached phase. Restore this carrier's original
    // randomized lifespan once, then let it count down normally on the host.
    particle.life = particle.maximumLife;
    if (game.acidLastEmittedParticle === particle) {
      game.acidLastEmittedParticle = null;
    }

    const targetX = nearestPeriodicWorldX(target.x, particle.x);
    particle.x = targetX + normalX * target.radius;
    particle.y = target.y + normalY * target.radius;
    particle.previousX = particle.x;
    particle.previousY = particle.y;
    particle.inheritedVx = Number(target.vx) || 0;
    particle.inheritedVy = Number(target.vy) || 0;
    particle.vx = particle.inheritedVx;
    particle.vy = particle.inheritedVy;
  }

  function addAcidLatchedTargetTime(target, duration) {
    if (duration <= 0) return;
    acidLatchedTargetSeconds.set(
      target,
      (acidLatchedTargetSeconds.get(target) || 0) + duration,
    );
  }

  function updateLatchedAcidParticle(particle, dt) {
    const target = particle.latchedTarget;
    if (!acidTargetCanHoldParticle(target)) {
      particle.latchedTarget = null;
      particle.latchNormalX = 0;
      particle.latchNormalY = 0;
      return false;
    }

    const previousX = particle.x;
    const previousY = particle.y;
    const targetX = nearestPeriodicWorldX(target.x, previousX);
    particle.x = targetX + particle.latchNormalX * target.radius;
    particle.y = target.y + particle.latchNormalY * target.radius;
    if (dt > 0) {
      particle.inheritedVx = (particle.x - previousX) / dt;
      particle.inheritedVy = (particle.y - previousY) / dt;
      particle.vx = particle.inheritedVx;
      particle.vy = particle.inheritedVy;
    }
    // A stuck carrier contributes through its persistent attachment rather
    // than sweeping damage through everything its host passed this frame.
    particle.previousX = particle.x;
    particle.previousY = particle.y;
    addAcidLatchedTargetTime(target, dt);
    return true;
  }

  function releaseAcidParticlesAttachedToTargets(targets) {
    for (let index = game.acidParticles.length - 1; index >= 0; index -= 1) {
      if (!targets.has(game.acidParticles[index].latchedTarget)) continue;
      releaseAcidParticle(index);
    }
  }

  function applyLatchedAcidDamage() {
    if (acidLatchedTargetSeconds.size === 0) return;
    const biteDamage = wormBiteDamage();
    const perParticleDamagePerSecond =
      biteDamage /
      ACID_RULES.damageReferenceDuration /
      ACID_RULES.latchedDamageDivisor;
    const defeatedTargets = [];
    acidLatchedTargetSeconds.forEach((attachedSeconds, target) => {
      if (!acidTargetCanHoldParticle(target) || attachedSeconds <= 0) return;
      target.health = Math.max(
        0,
        target.health - perParticleDamagePerSecond * attachedSeconds,
      );
      target.healthBarTimer = ENEMY_HEALTH_BAR.duration;
      if (target.health <= 0) defeatedTargets.push(target);
    });
    if (defeatedTargets.length === 0) return;

    const defeatedTargetSet = new Set(defeatedTargets);
    releaseAcidParticlesAttachedToTargets(defeatedTargetSet);
    const consumedTargets = [];
    defeatedTargets.forEach((target) => {
      const targetIndex = game.targets.indexOf(target);
      if (targetIndex < 0) return;
      if (game.latchAttack?.target === target) {
        target.latched = false;
        game.latchAttack.targetDefeated = true;
        game.latchAttack.releasePending = true;
      }
      game.targets.splice(targetIndex, 1);
      acidActiveTargets.delete(target);
      if (enemyIsHardPrey(target, biteDamage)) {
        explodeTargetIntoMeat(target);
      } else {
        consumedTargets.push(target);
      }
    });
    finishConsumedTargets(consumedTargets, false);
    if (game.latchAttack?.targetDefeated) {
      releaseBoostLatchAttack(true, false);
      game.boosting = false;
    }
  }

  function updateAcidAbility(dt) {
    updateSpitterAim(dt);
    acidLatchedTargetSeconds.clear();
    acidActiveTargets.clear();
    for (let index = 0; index < game.targets.length; index += 1) {
      acidActiveTargets.add(game.targets[index]);
    }
    acidTunnelTilesRemaining = ACID_RULES.maximumTunneledTilesPerFrame;
    acidTunnelTilesChanged = 0;
    const sprayActive = spitterSprayIsActive();
    const guidedAcidIsActive = spitterHasHeadGuidedAcid();
    const guidePose =
      sprayActive || guidedAcidIsActive ? spitterAcidNozzlePose() : null;
    const guidePoseMode = spitterCranePoseIsActive() ? 1 : 0;
    const previousGuidePose = guidePose
      ? safePreviousAcidGuidePose(guidePose)
      : null;
    const currentWormScale = wormScale();

    for (let index = game.acidParticles.length - 1; index >= 0; index -= 1) {
      const particle = game.acidParticles[index];
      const liveDuration = Math.min(dt, Math.max(0, particle.life));
      particle.life -= dt;
      particle.acidWorldMotionTime = 0;
      if (particle.latchedTarget) {
        const remainsLatched = updateLatchedAcidParticle(
          particle,
          liveDuration,
        );
        if (particle.life <= 0) {
          releaseAcidParticle(index);
          continue;
        }
        if (remainsLatched) continue;
      }
      if (particle.life <= 0) {
        releaseAcidParticle(index);
        continue;
      }
      if (particle.headGuideActive && guidePose) {
        if (
          particle.headGuidePoseMode !== guidePoseMode ||
          Math.abs(particle.headGuideScale - currentWormScale) >= 0.000001
        ) {
          rebaseHeadGuidedAcidParticle(particle, previousGuidePose);
          particle.headGuidePoseMode = guidePoseMode;
          particle.headGuideScale = currentWormScale;
        }
        moveHeadGuidedAcidParticle(particle, dt, guidePose);
      } else {
        // Level teardown/type changes clear particles directly. This fallback
        // only protects malformed state where a guided carrier lost its pose.
        particle.headGuideActive = false;
        particle.acidWorldMotionTime = dt;
        moveAcidParticle(particle, dt);
      }
      if (
        !particle.headGuideActive &&
        (particle.y + particle.radius < 0 ||
          particle.y - particle.radius > game.height)
      ) {
        releaseAcidParticle(index);
        continue;
      }
    }
    // Emit after advancing existing drops. New particles now begin at the
    // current throat instead of receiving a second, frame-sized copy of the
    // worm's movement immediately after the nozzle itself has moved.
    emitSpitterAcid(dt, guidePose);
    // A physical carrier can attach to exactly one enemy. Choose its earliest
    // swept impact so overlapping hurtboxes cannot claim the same particle.
    for (
      let particleIndex = 0;
      particleIndex < game.acidParticles.length;
      particleIndex += 1
    ) {
      const particle = game.acidParticles[particleIndex];
      if (particle.headGuideActive || particle.latchedTarget) continue;
      const motionTime = clamp(
        Number(particle.acidWorldMotionTime) || 0,
        0,
        dt,
      );
      if (motionTime <= 0) continue;
      const targetStartFraction = dt > 0 ? 1 - motionTime / dt : 0;
      let bestTarget = null;
      let bestTime = Infinity;
      let bestCenterDistanceSquared = Infinity;
      let bestNormalX = 1;
      let bestNormalY = 0;
      for (
        let targetIndex = 0;
        targetIndex < game.targets.length;
        targetIndex += 1
      ) {
        const target = game.targets[targetIndex];
        if (!acidTargetCanHoldParticle(target)) continue;
        if (
          !acidParticleTargetContact(
            particle,
            target,
            targetStartFraction,
            acidTargetContactScratch,
          )
        ) {
          continue;
        }
        const timeDifference = acidTargetContactScratch.time - bestTime;
        const isEarlier = timeDifference < -0.000001;
        const isCloserTie =
          Math.abs(timeDifference) <= 0.000001 &&
          (acidTargetContactScratch.centerDistanceSquared <
            bestCenterDistanceSquared - 0.000001 ||
            (Math.abs(
              acidTargetContactScratch.centerDistanceSquared -
                bestCenterDistanceSquared,
            ) <= 0.000001 &&
              (bestTarget === null || target.id < bestTarget.id)));
        if (!isEarlier && !isCloserTie) continue;
        bestTarget = target;
        bestTime = acidTargetContactScratch.time;
        bestCenterDistanceSquared =
          acidTargetContactScratch.centerDistanceSquared;
        bestNormalX = acidTargetContactScratch.normalX;
        bestNormalY = acidTargetContactScratch.normalY;
      }
      if (bestTarget) {
        attachAcidParticleToTarget(
          particle,
          bestTarget,
          bestNormalX,
          bestNormalY,
        );
        addAcidLatchedTargetTime(
          bestTarget,
          motionTime * (1 - bestTime),
        );
      }
    }
    applyLatchedAcidDamage();
    if (acidTunnelTilesChanged > 0) {
      game.minimapTerrainRevision += 1;
    }
  }

  function meatPieceCountForScore(scoreValue) {
    const totalPoints = Math.max(1, Math.round(Number(scoreValue) || 0));
    const desiredPieces = clamp(
      Math.round(Math.sqrt(totalPoints)) + 1,
      BOOST_LATCH_RULES.meatMinimumPieces,
      BOOST_LATCH_RULES.meatMaximumPieces,
    );
    return Math.min(totalPoints, desiredPieces);
  }

  function meatScatterVelocity(angle, scatterSpeed) {
    const multiplier = BOOST_LATCH_RULES.meatScatterVelocityMultiplier;
    return {
      x: Math.cos(angle) * scatterSpeed * multiplier,
      y: (Math.sin(angle) * scatterSpeed - 28) * multiplier,
    };
  }

  function spawnMeatDrops(target) {
    const totalPoints = Math.max(1, Math.round(target.scoreValue));
    const pieceCount = meatPieceCountForScore(totalPoints);
    const pointsPerPiece = Math.floor(totalPoints / pieceCount);
    const extraPointPieces = totalPoints % pieceCount;
    const random = seededRandom(
      hashString(`${game.activeWorldId}:${target.id}:${game.elapsed}:meat`),
    );
    const pieces = [];

    for (let index = 0; index < pieceCount; index += 1) {
      const angle =
        (index / pieceCount) * TAU + (random() - 0.5) * 0.7;
      const distance = target.radius * (0.12 + random() * 0.36);
      const x = target.x + Math.cos(angle) * distance;
      const y = clamp(
        target.y + Math.sin(angle) * distance,
        ENEMY_DEFINITIONS[ENEMY_TYPES.MEAT].radius,
        game.height - ENEMY_DEFINITIONS[ENEMY_TYPES.MEAT].radius,
      );
      const regionType =
        getBlockAtWorld(x, y)?.type || BLOCK_TYPES.AIR;
      const piece = createEnemyTarget(
        ENEMY_TYPES.MEAT,
        x,
        y,
        regionType,
        random,
      );
      const scatterSpeed = 32 + random() * 72;
      piece.scoreValue =
        pointsPerPiece + (index < extraPointPieces ? 1 : 0);
      piece.health = 1;
      piece.maxHealth = 1;
      piece.boostDropReleaseX = game.head.x;
      piece.boostDropReleaseY = game.head.y;
      piece.boostDropReleaseRadius =
        target.radius + wormDimension("headRadius");
      piece.boostDropMovementArmed = false;
      piece.movementMode = "meat";
      piece.meatAirborne = regionType === BLOCK_TYPES.AIR;
      const scatterVelocity = meatScatterVelocity(angle, scatterSpeed);
      piece.vx = scatterVelocity.x;
      piece.vy = scatterVelocity.y;
      piece.spin = (random() * 2 - 1) * 4.5;
      pieces.push(piece);
    }

    game.targets.push(...pieces);
    game.totalTargets += pieces.length;
  }

  function explodeTargetIntoMeat(target) {
    spawnParticles(
      target.x,
      target.y,
      Math.round(8 * Math.min(3, target.sizeScale)),
      target.kind,
      target.sizeScale,
    );
    spawnMeatDrops(target);
  }

  function enemyMaximumHealth(target) {
    const definitionHealth = ENEMY_DEFINITIONS[target.kind]?.health || 0;
    return Math.max(
      Number.isFinite(target.maxHealth) ? target.maxHealth : definitionHealth,
      Number.isFinite(target.health) ? target.health : 0,
    );
  }

  function preyClassForHealth(health, biteDamage = wormBiteDamage()) {
    const maximumHealth = Math.max(0, Number(health) || 0);
    const force = Math.max(0.001, Number(biteDamage) || 0.001);
    if (
      maximumHealth >
      force * COMBAT_RULES.hardPreyHealthMultiplier
    ) {
      return PREY_CLASSES.HARD;
    }
    if (maximumHealth > force) return PREY_CLASSES.NORMAL;
    return PREY_CLASSES.EASY;
  }

  function preyClassLabel(preyClass) {
    return `${preyClass[0].toUpperCase()}${preyClass.slice(1)} prey`;
  }

  function enemyPreyClass(target, biteDamage = wormBiteDamage()) {
    return preyClassForHealth(enemyMaximumHealth(target), biteDamage);
  }

  function enemyIsHardPrey(target, biteDamage = wormBiteDamage()) {
    return (
      target.kind !== ENEMY_TYPES.MEAT &&
      enemyPreyClass(target, biteDamage) === PREY_CLASSES.HARD
    );
  }

  function nearestBoostLatchTarget() {
    const maximumDistance = MOUTH_BEHAVIOR.proximityRadius * wormScale();
    let nearestTarget = null;
    let nearestDistanceSquared = Infinity;

    game.targets.forEach((target) => {
      if (
        target.kind === ENEMY_TYPES.MEAT ||
        target.latched ||
        target.tongueCaptured ||
        targetHasActiveTongue(target) ||
        target.paralyzed ||
        target.boostLatchHitboxDisabled ||
        !enemyIsHardPrey(target)
      ) {
        return;
      }
      const dx = target.x - game.head.x;
      const dy = target.y - game.head.y;
      const distanceSquared = dx * dx + dy * dy;
      const targetMaximumDistance = maximumDistance + target.radius;
      if (
        distanceSquared > targetMaximumDistance * targetMaximumDistance ||
        distanceSquared >= nearestDistanceSquared
      ) {
        return;
      }
      nearestTarget = target;
      nearestDistanceSquared = distanceSquared;
    });
    return nearestTarget;
  }

  function beginBoostLatchAttack(
    target,
    lockImmediately = false,
    forcedLockAngle = null,
  ) {
    // A latch is single-owner state. Replacing it would strand the previous
    // target with `latched = true` and make that enemy frozen/untargetable.
    if (!target || game.latchAttack) return false;
    game.heading = Number.isFinite(forcedLockAngle)
      ? forcedLockAngle
      : getWormHeadAngle();
    target.latched = true;
    target.boostLatchHitboxDisabled = false;
    target.vx = 0;
    target.vy = 0;
    game.latchAttack = {
      target,
      phase: "approach",
      lockAngle: game.heading,
      bodyVelocities: null,
      bitesCompleted: 0,
      biteDamage: wormBiteDamage(),
      releasePending: false,
      targetDefeated: false,
    };
    game.boostLatchReady = false;
    game.boosting = true;
    if (lockImmediately) lockBoostLatchOnTarget(game.latchAttack);
    return true;
  }

  function airborneBoostLatchCollisionTarget(eatHitboxSweep, eatCone) {
    if (
      game.inGround ||
      game.onStoneSurface ||
      game.tongues.some((tongue) => tongue.heavyHold) ||
      !game.boostLatchReady ||
      !keys.boost ||
      keys.down ||
      game.boostCharge <= 0 ||
      game.capturedTargets.length > 0
    ) {
      return null;
    }

    let nearestTarget = null;
    let nearestDistanceSquared = Infinity;
    game.targets.forEach((target) => {
      if (
        target.kind === ENEMY_TYPES.MEAT ||
        target.latched ||
        target.tongueCaptured ||
        targetHasActiveTongue(target) ||
        target.paralyzed ||
        target.boostLatchHitboxDisabled ||
        target.biteBounceCooldown > 0 ||
        !enemyIsHardPrey(target) ||
        !targetTouchesEatCone(target, eatHitboxSweep, eatCone)
      ) {
        return;
      }
      const dx = target.x - game.head.x;
      const dy = target.y - game.head.y;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared >= nearestDistanceSquared) return;
      nearestTarget = target;
      nearestDistanceSquared = distanceSquared;
    });
    return nearestTarget;
  }

  function survivingTargetBounceSpeed() {
    const deceleration = motion.coastDeceleration;
    const distance =
      BOOST_LATCH_RULES.survivingTargetBounceDistanceBlocks * BLOCK_SIZE;
    // Ground movement subtracts deceleration before advancing position. Solve
    // for the launch speed using a step just above the largest supported game
    // delta so the coast still reaches the requested distance at 30 FPS.
    const stepSpeedLoss =
      deceleration * BOOST_LATCH_RULES.bounceCoastPredictionStep;
    const coastDistanceSpeed = (
      stepSpeedLoss +
      Math.sqrt(
        stepSpeedLoss * stepSpeedLoss +
          8 * deceleration * distance,
      )
    ) / 2;
    return (
      coastDistanceSpeed *
      BOOST_LATCH_RULES.survivingTargetBounceVelocityMultiplier
    );
  }

  function releaseBoostLatchAttack(
    cancelBiteAnimation = false,
    bounceAwayFromTarget = false,
  ) {
    const latch = game.latchAttack;
    if (!latch) return;
    const shouldBounceAway =
      bounceAwayFromTarget &&
      latch.phase === "biting" &&
      !latch.targetDefeated;
    if (!latch.targetDefeated) {
      latch.target.latched = false;
      latch.target.boostLatchHitboxDisabled = true;
    }
    if (latch.phase === "biting") rebuildBodyPathFromSegments();
    game.latchAttack = null;
    if (shouldBounceAway) {
      let directionX = game.head.x - latch.target.x;
      let directionY = game.head.y - latch.target.y;
      const directionLength = magnitude(directionX, directionY);
      if (directionLength > 0.001) {
        directionX /= directionLength;
        directionY /= directionLength;
      } else {
        directionX = -Math.cos(latch.lockAngle);
        directionY = -Math.sin(latch.lockAngle);
      }
      game.speed = survivingTargetBounceSpeed();
      game.velocity.x = directionX * game.speed;
      game.velocity.y = directionY * game.speed;
      game.heading = Math.atan2(directionY, directionX);
      game.shake = Math.max(game.shake, 3.5);
    } else {
      game.speed = 0;
      game.velocity.x = 0;
      game.velocity.y = 0;
    }
    if (cancelBiteAnimation) {
      game.mouthChewTimer = 0;
      game.mouthBitePhase = "idle";
      game.mouthBiteHoldTimer = 0;
      game.mouthOpen = 0;
    }
  }

  function lockBoostLatchOnTarget(latch) {
    const arrivalVelocity = { ...game.velocity };
    latch.phase = "biting";
    latch.lockAngle = game.heading;
    const headOffset = wormDimension("headOffset");
    game.head.x =
      latch.target.x - Math.cos(latch.lockAngle) * headOffset;
    game.head.y =
      latch.target.y - Math.sin(latch.lockAngle) * headOffset;
    latch.bodyVelocities = game.segments.map((_, index) => {
      if (index < 2) return { x: 0, y: 0 };
      const carry = lerp(
        1,
        0.38,
        index / Math.max(1, game.segments.length - 1),
      );
      return {
        x: arrivalVelocity.x * carry,
        y: arrivalVelocity.y * carry,
      };
    });
    game.speed = 0;
    game.velocity.x = 0;
    game.velocity.y = 0;
    triggerMouthBite(BOOST_LATCH_RULES.bitesPerAttack);
  }

  function updateBoostLatchApproach(latch, dt) {
    const substeps = Math.max(
      1,
      Math.ceil(dt / BOOST_LATCH_RULES.approachSubstep),
    );
    const stepTime = dt / substeps;
    const headOffset = wormDimension("headOffset");
    const maximumSpeed =
      wormMaximumSpeed() * BOOST_LATCH_RULES.approachSpeedMultiplier;
    const acceleration =
      motion.acceleration * BOOST_LATCH_RULES.approachAccelerationMultiplier;
    const turnSpeed =
      motion.groundTurnSpeed * BOOST_LATCH_RULES.approachTurnSpeedMultiplier;

    for (let step = 0; step < substeps; step += 1) {
      const visualHeadX = game.head.x + Math.cos(game.heading) * headOffset;
      const visualHeadY = game.head.y + Math.sin(game.heading) * headOffset;
      const dx = latch.target.x - visualHeadX;
      const dy = latch.target.y - visualHeadY;
      const distance = magnitude(dx, dy);
      if (distance <= BOOST_LATCH_RULES.approachArrivalDistance) {
        lockBoostLatchOnTarget(latch);
        return;
      }

      const desiredAngle = Math.atan2(dy, dx);
      const angleDifference = Math.atan2(
        Math.sin(desiredAngle - game.heading),
        Math.cos(desiredAngle - game.heading),
      );
      game.heading += clamp(
        angleDifference,
        -turnSpeed * stepTime,
        turnSpeed * stepTime,
      );

      const targetSpeed = Math.min(
        maximumSpeed,
        Math.max(150 * wormScale(), distance * 8),
      );
      game.speed = moveToward(
        game.speed,
        targetSpeed,
        acceleration * stepTime,
      );
      game.velocity.x = Math.cos(game.heading) * game.speed;
      game.velocity.y = Math.sin(game.heading) * game.speed;
      game.head.x += game.velocity.x * stepTime;
      game.head.y += game.velocity.y * stepTime;

      const nextVisualHeadX =
        game.head.x + Math.cos(game.heading) * headOffset;
      const nextVisualHeadY =
        game.head.y + Math.sin(game.heading) * headOffset;
      const nextDx = latch.target.x - nextVisualHeadX;
      const nextDy = latch.target.y - nextVisualHeadY;
      const nextDistance = magnitude(nextDx, nextDy);
      const crossedTarget = dx * nextDx + dy * nextDy <= 0;
      if (
        nextDistance <= BOOST_LATCH_RULES.approachArrivalDistance ||
        (crossedTarget && nextDistance <= game.speed * stepTime * 1.25)
      ) {
        lockBoostLatchOnTarget(latch);
        return;
      }
    }
  }

  function updateBoostLatchBody(dt) {
    const latch = game.latchAttack;
    if (
      !latch ||
      latch.phase !== "biting" ||
      !latch.bodyVelocities ||
      game.segments.length === 0
    ) {
      return;
    }

    const oldPositions = game.segments.map((segment) => ({
      x: segment.x,
      y: segment.y,
    }));
    for (let index = 2; index < game.segments.length; index += 1) {
      const velocity = latch.bodyVelocities[index];
      game.segments[index].x += velocity.x * dt;
      game.segments[index].y += velocity.y * dt;
    }

    const spacing = wormSegmentSpacing();
    for (
      let iteration = 0;
      iteration < BOOST_LATCH_RULES.bodyConstraintIterations;
      iteration += 1
    ) {
      game.segments[0].x = game.head.x;
      game.segments[0].y = game.head.y;
      if (game.segments.length > 1) {
        game.segments[1].x = game.head.x - Math.cos(latch.lockAngle) * spacing;
        game.segments[1].y = game.head.y - Math.sin(latch.lockAngle) * spacing;
      }
      for (let index = 2; index < game.segments.length; index += 1) {
        const leader = game.segments[index - 1];
        const segment = game.segments[index];
        let dx = segment.x - leader.x;
        let dy = segment.y - leader.y;
        let distance = magnitude(dx, dy);
        if (distance < 0.0001) {
          dx = -Math.cos(latch.lockAngle);
          dy = -Math.sin(latch.lockAngle);
          distance = 1;
        }
        const correction = (distance - spacing) / distance;
        if (index === 2) {
          segment.x -= dx * correction;
          segment.y -= dy * correction;
        } else {
          const halfCorrection = correction * 0.5;
          leader.x += dx * halfCorrection;
          leader.y += dy * halfCorrection;
          segment.x -= dx * halfCorrection;
          segment.y -= dy * halfCorrection;
        }
      }
    }
    game.segments[0].x = game.head.x;
    game.segments[0].y = game.head.y;
    if (game.segments.length > 1) {
      game.segments[1].x = game.head.x - Math.cos(latch.lockAngle) * spacing;
      game.segments[1].y = game.head.y - Math.sin(latch.lockAngle) * spacing;
    }

    const retention = Math.pow(
      BOOST_LATCH_RULES.bodyMotionRetention,
      dt,
    );
    const maximumBodySpeed =
      wormMaximumSpeed() * BOOST_LATCH_RULES.approachSpeedMultiplier;
    for (let index = 0; index < game.segments.length; index += 1) {
      if (index < 2) {
        latch.bodyVelocities[index].x = 0;
        latch.bodyVelocities[index].y = 0;
        continue;
      }
      const displacementX = game.segments[index].x - oldPositions[index].x;
      const displacementY = game.segments[index].y - oldPositions[index].y;
      const displacement = magnitude(displacementX, displacementY);
      const velocityScale =
        displacement > 0 && dt > 0
          ? Math.min(maximumBodySpeed, displacement / dt) / displacement
          : 0;
      latch.bodyVelocities[index].x =
        displacementX * velocityScale * retention;
      latch.bodyVelocities[index].y =
        displacementY * velocityScale * retention;
    }
  }

  function updateBoostLatchAttack(dt) {
    const latch = game.latchAttack;
    if (!latch) return;
    if (latch.phase === "approach") {
      updateBoostLatchApproach(latch, dt);
      return;
    }

    const headOffset = wormDimension("headOffset");
    game.head.x =
      latch.target.x - Math.cos(latch.lockAngle) * headOffset;
    game.head.y =
      latch.target.y - Math.sin(latch.lockAngle) * headOffset;
    game.speed = 0;
    game.velocity.x = 0;
    game.velocity.y = 0;
  }

  function applyBoostLatchBite() {
    const latch = game.latchAttack;
    if (!latch || latch.phase !== "biting" || latch.releasePending) return;
    const target = latch.target;
    latch.bitesCompleted += 1;

    const impactAngle = latch.lockAngle;
    const impactX =
      target.x - Math.cos(impactAngle) * target.radius * 0.62;
    const impactY =
      target.y - Math.sin(impactAngle) * target.radius * 0.62;
    spawnBiteSplatter(
      impactX,
      impactY,
      impactAngle,
      target.sizeScale,
      Math.max(
        BITE_SPLATTER_RULES.baseCount,
        Math.round(15 * Math.min(2.5, target.sizeScale)),
      ),
    );
    game.shake = Math.max(game.shake, 3.5);

    if (latch.bitesCompleted < BOOST_LATCH_RULES.bitesPerAttack) return;
    target.health = Math.max(0, target.health - latch.biteDamage);

    if (target.health <= 0) {
      const targetIndex = game.targets.indexOf(target);
      if (targetIndex >= 0) game.targets.splice(targetIndex, 1);
      target.latched = false;
      latch.targetDefeated = true;
      explodeTargetIntoMeat(target);
      latch.releasePending = true;
    } else {
      target.healthBarTimer = ENEMY_HEALTH_BAR.duration;
      latch.releasePending = true;
    }
  }

  function enemyIsNearHead() {
    const proximityRadius = MOUTH_BEHAVIOR.proximityRadius * wormScale();
    return game.targets.some((target) => {
      const dx = target.x - game.head.x;
      const dy = target.y - game.head.y;
      const targetProximityRadius = proximityRadius + target.radius;
      return dx * dx + dy * dy <= targetProximityRadius * targetProximityRadius;
    });
  }

  function triggerMouthBite(biteCount = 1) {
    const requestedDuration =
      MOUTH_BEHAVIOR.chewLoopDuration * Math.max(1, biteCount);
    game.mouthChewTimer = Math.max(
      game.mouthChewTimer,
      requestedDuration,
    );
    if (game.mouthBitePhase === "idle") {
      game.mouthBitePhase = game.mouthOpen <= 0.02 ? "opening" : "closing";
      game.mouthBiteHoldTimer = 0;
    }
  }

  function triggerSingleCappedMouthBite() {
    const oneBiteDuration = MOUTH_BEHAVIOR.chewLoopDuration;
    if (game.mouthChewTimer >= oneBiteDuration) return;
    triggerMouthBite(1);
  }

  function emitCapturedBiteSplatter() {
    applyBoostLatchBite();
    const biteAngle = getEatAnimationConeWorldPoints().pose.angle;
    game.capturedTargets.forEach((target) => {
      if (target.splatterBitesRemaining <= 0) return;
      target.splatterBitesRemaining -= 1;
      const effectCountScale = Math.min(2.5, target.sizeScale);
      const currentSizeScale =
        target.sizeScale * (target.captureScale ?? 1);
      spawnBiteSplatter(
        target.x,
        target.y,
        biteAngle,
        currentSizeScale,
        Math.max(
          BITE_SPLATTER_RULES.baseCount,
          Math.round(15 * effectCountScale),
        ),
      );
    });
  }

  function advanceMouthChew(dt) {
    let remaining = dt;
    for (let transition = 0; transition < 8 && remaining > 0; transition += 1) {
      if (game.mouthBitePhase === "closing") {
        const timeToClose = game.mouthOpen / MOUTH_BEHAVIOR.closeRate;
        if (remaining < timeToClose) {
          game.mouthOpen -= MOUTH_BEHAVIOR.closeRate * remaining;
          return;
        }
        game.mouthOpen = 0;
        remaining -= timeToClose;
        emitCapturedBiteSplatter();
        game.mouthBitePhase = "holding";
        game.mouthBiteHoldTimer = MOUTH_BEHAVIOR.biteHold;
        continue;
      }

      if (game.mouthBitePhase === "holding") {
        if (remaining < game.mouthBiteHoldTimer) {
          game.mouthBiteHoldTimer -= remaining;
          return;
        }
        remaining -= game.mouthBiteHoldTimer;
        game.mouthBiteHoldTimer = 0;
        game.mouthBitePhase = "opening";
        continue;
      }

      if (game.mouthBitePhase === "opening") {
        const timeToOpen = (1 - game.mouthOpen) / MOUTH_BEHAVIOR.openRate;
        if (remaining < timeToOpen) {
          game.mouthOpen += MOUTH_BEHAVIOR.openRate * remaining;
          return;
        }
        game.mouthOpen = 1;
        remaining -= timeToOpen;
        game.mouthBitePhase = "closing";
        continue;
      }

      return;
    }
  }

  function wormTongueCapacity() {
    if (!wormHasAbility(WORM_ABILITIES.TONGUE)) return 0;
    return Math.floor(game.growthLevel / 3) + 1;
  }

  function tongueTargetingRadius() {
    return TONGUE_RULES.targetingRadiusBlocks * game.map.cellSize;
  }

  function activeTongueTarget(tongue) {
    if (!Number.isFinite(tongue?.targetId)) return null;
    return game.targets.find((target) => target.id === tongue.targetId) || null;
  }

  function targetHasActiveTongue(target) {
    return game.tongues.some((tongue) => tongue.targetId === target.id);
  }

  function removeTongue(tongue) {
    const index = game.tongues.indexOf(tongue);
    if (index >= 0) game.tongues.splice(index, 1);
  }

  function activeHeavyTongueGrapple() {
    return game.tongues.find(
      (tongue) =>
        tongue.phase === "heavy-grappled" &&
        Boolean(activeTongueTarget(tongue)),
    ) || null;
  }

  function handOffHeavyGrappleBody(tongue) {
    if (!tongue?.grappleBodyVelocities) return;
    if (game.segments[0]) {
      game.segments[0].x = game.head.x;
      game.segments[0].y = game.head.y;
    }
    rebuildBodyPathFromSegments();
    delete tongue.grappleBodyVelocities;
  }

  function tongueTargetIsUnavailable(target, claimedTargetIds) {
    return (
      target.latched ||
      target.tongueCaptured ||
      target.paralyzed ||
      target.boostLatchHitboxDisabled ||
      claimedTargetIds.has(target.id)
    );
  }

  function prioritizedTongueTargets(x, y, maximumCount) {
    const radiusSquared = tongueTargetingRadius() ** 2;
    const claimedTargetIds = new Set(
      game.tongues.map((tongue) => tongue.targetId),
    );
    const candidates = [];

    game.targets.forEach((target) => {
      if (
        tongueTargetIsUnavailable(target, claimedTargetIds) ||
        enemyIsHardPrey(target)
      ) {
        return;
      }
      const dx = target.x - x;
      const dy = target.y - y;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared > radiusSquared) return;
      candidates.push({ target, distanceSquared });
    });
    candidates.sort(
      (first, second) =>
        (Number(second.target.scoreValue) || 0) -
          (Number(first.target.scoreValue) || 0) ||
        first.distanceSquared - second.distanceSquared ||
        first.target.id - second.target.id,
    );
    return candidates
      .slice(0, maximumCount)
      .map((candidate) => candidate.target);
  }

  function wormCanStartHeavyTongueGrapple() {
    return (
      wormHasAbility(WORM_ABILITIES.TONGUE) &&
      getBlockAtWorld(game.head.x, game.head.y)?.type === BLOCK_TYPES.AIR &&
      !game.onStoneSurface &&
      !game.stoneSurfaceContact
    );
  }

  function prioritizedHardTongueTarget(x, y) {
    if (!wormCanStartHeavyTongueGrapple()) return null;
    const radiusSquared = tongueTargetingRadius() ** 2;
    const candidates = [];

    game.targets.forEach((target) => {
      if (
        target.latched ||
        target.tongueCaptured ||
        target.paralyzed ||
        target.boostLatchHitboxDisabled ||
        targetHasActiveTongue(target) ||
        !enemyIsHardPrey(target)
      ) {
        return;
      }
      const pointerDx = target.x - x;
      const pointerDy = target.y - y;
      const pointerDistanceSquared =
        pointerDx * pointerDx + pointerDy * pointerDy;
      if (pointerDistanceSquared > radiusSquared) return;
      candidates.push({ target, distanceSquared: pointerDistanceSquared });
    });
    candidates.sort(
      (first, second) =>
        (Number(second.target.scoreValue) || 0) -
          (Number(first.target.scoreValue) || 0) ||
        first.distanceSquared - second.distanceSquared ||
        first.target.id - second.target.id,
    );
    return candidates[0]?.target || null;
  }

  function tongueGeometryTouchesTarget(geometry, target) {
    const points = tongueCenterlinePoints(geometry);
    const collisionRadius =
      target.radius + TONGUE_RULES.outerBaseWidth * wormScale() * 0.5;
    const collisionRadiusSquared = collisionRadius * collisionRadius;
    for (let index = 1; index < points.length; index += 1) {
      if (
        squaredDistanceToSegment(
          target.x,
          target.y,
          points[index - 1].x,
          points[index - 1].y,
          points[index].x,
          points[index].y,
        ) <= collisionRadiusSquared
      ) {
        return true;
      }
    }
    return false;
  }

  function beginTongueCapture(
    tongue,
    target,
    geometry,
    paralyzeTarget = true,
  ) {
    if (geometry.route.points.length === 0) return false;
    const targetVelocityX = Number(target.vx) || 0;
    const targetVelocityY = Number(target.vy) || 0;
    const nodeCount = geometry.route.points.length;
    const nodes = geometry.route.points.map((point, index) => {
      const amount = (index + 1) / nodeCount;
      return {
        x: point.x,
        y: point.y,
        vx: lerp(game.velocity.x, targetVelocityX, amount),
        vy: lerp(game.velocity.y, targetVelocityY, amount),
      };
    });
    nodes[nodes.length - 1].x = target.x;
    nodes[nodes.length - 1].y = target.y;

    const restLengths = [];
    let previousX = geometry.front.x;
    let previousY = geometry.front.y;
    nodes.forEach((node) => {
      restLengths.push(
        Math.max(0.5, magnitude(node.x - previousX, node.y - previousY)),
      );
      previousX = node.x;
      previousY = node.y;
    });

    tongue.freefallNodes = nodes;
    tongue.freefallRestLengths = restLengths;
    tongue.captureProgress = Math.max(0.001, tongue.progress);
    tongue.phase = "captured-holding";
    tongue.holdRemaining = TONGUE_RULES.holdDuration;
    if (paralyzeTarget) {
      target.paralyzed = true;
      target.tongueCaptured = true;
      target.movementMode = "tongue-paralyzed";
      target.angle = tongueLastSegmentAngle(
        nodes,
        geometry.front,
        target.angle,
      );
      target.vx = 0;
      target.vy = 0;
    }
    return true;
  }

  function tongueLastSegmentAngle(nodes, front, fallbackAngle = 0) {
    if (!nodes?.length) return fallbackAngle;
    const tip = nodes[nodes.length - 1];
    const previous = nodes.length > 1 ? nodes[nodes.length - 2] : front;
    const dx = tip.x - previous.x;
    const dy = tip.y - previous.y;
    if (magnitude(dx, dy) < 0.0001) return fallbackAngle;
    return Math.atan2(dy, dx);
  }

  function beginHeavyTongueGrapple(tongue, target, geometry) {
    if (game.latchAttack) return false;
    if (!beginTongueCapture(tongue, target, geometry, false)) return false;

    const distanceToAnchor = magnitude(
      target.x - geometry.front.x,
      target.y - geometry.front.y,
    );
    const articulatedLength = tongue.freefallRestLengths.reduce(
      (total, length) => total + length,
      0,
    );
    const ropeLength = Math.max(distanceToAnchor, articulatedLength);
    tongue.phase = "heavy-grappled";
    tongue.grappleRopeLength = ropeLength;
    tongue.grappleInitialRopeLength = Math.max(0.001, ropeLength);
    tongue.grappleMaximumLength = Math.max(
      ropeLength,
      geometry.maximumLength,
    );
    if (distanceToAnchor > 0.0001) {
      tongue.grappleOutwardX =
        (geometry.front.x - target.x) / distanceToAnchor;
      tongue.grappleOutwardY =
        (geometry.front.y - target.y) / distanceToAnchor;
    } else {
      tongue.grappleOutwardX = -Math.cos(game.heading);
      tongue.grappleOutwardY = -Math.sin(game.heading);
    }
    tongue.grappleBodyVelocities = game.segments.map((_, index) => {
      const carry = lerp(
        1,
        0.62,
        index / Math.max(1, game.segments.length - 1),
      );
      return {
        x: game.velocity.x * carry,
        y: game.velocity.y * carry,
      };
    });
    endStoneSurfaceContact();
    return true;
  }

  function heavyTongueElasticLimit(tongue) {
    const restLength = Math.max(0, tongue.grappleRopeLength || 0);
    const maximumLength = Math.max(
      restLength,
      tongue.grappleMaximumLength || restLength,
    );
    return Math.max(
      restLength,
      maximumLength * TONGUE_GRAPPLE_RULES.maximumStretchRatio,
    );
  }

  function initializeTongueRetractionFromPose(tongue, geometry) {
    if (tongue.freefallNodes?.length) return true;
    if (!geometry?.route.points.length) return false;
    const target = activeTongueTarget(tongue);
    const targetVelocityX = Number(target?.vx) || 0;
    const targetVelocityY = Number(target?.vy) || 0;
    const nodeCount = geometry.route.points.length;
    const nodes = geometry.route.points.map((point, index) => {
      const amount = (index + 1) / nodeCount;
      return {
        x: point.x,
        y: point.y,
        vx: lerp(game.velocity.x, targetVelocityX, amount),
        vy: lerp(game.velocity.y, targetVelocityY, amount),
      };
    });
    const restLengths = [];
    let previousX = geometry.front.x;
    let previousY = geometry.front.y;
    nodes.forEach((node) => {
      restLengths.push(
        Math.max(0.5, magnitude(node.x - previousX, node.y - previousY)),
      );
      previousX = node.x;
      previousY = node.y;
    });
    tongue.freefallNodes = nodes;
    tongue.freefallRestLengths = restLengths;
    return true;
  }

  function beginHeldHeavyTongueRetraction(tongue) {
    if (!tongue?.heavyHold) return false;
    const wasGrappled = tongue.phase === "heavy-grappled";
    const releasedTarget = wasGrappled
      ? activeTongueTarget(tongue)
      : null;
    const releaseMomentum = wasGrappled
      ? {
          x: game.velocity.x,
          y: game.velocity.y,
          heading: game.heading,
        }
      : null;
    const geometry = getTongueGeometry(tongue, tongue.progress);
    initializeTongueRetractionFromPose(tongue, geometry);
    if (wasGrappled) {
      // The ordinary heavy-enemy mouth collision would otherwise fire on the
      // very next sweep and replace the preserved grapple momentum with a
      // bite bounce while the worm is still overlapping its former anchor.
      if (releasedTarget) releasedTarget.boostLatchHitboxDisabled = true;
      handOffHeavyGrappleBody(tongue);
    }
    tongue.targetId = null;
    tongue.heavyHold = false;
    delete tongue.holdPointerId;
    tongue.holdRemaining = 0;
    if (tongue.freefallNodes?.length) {
      tongue.captureProgress = Math.max(0.001, tongue.progress);
      tongue.phase = "captured-retracting";
    } else {
      tongue.phase = "retracting";
    }
    if (releaseMomentum) {
      game.velocity.x = releaseMomentum.x;
      game.velocity.y = releaseMomentum.y;
      game.speed = magnitude(releaseMomentum.x, releaseMomentum.y);
      game.heading = game.speed > 0.5
        ? Math.atan2(releaseMomentum.y, releaseMomentum.x)
        : releaseMomentum.heading;
    }
    return true;
  }

  function heavyTongueGrappleHeadTouchesAnchor(tongue) {
    const target = activeTongueTarget(tongue);
    if (!target) return false;
    const currentHeadPose = getEatHitboxPose();
    const previousHeadPose = game.previousEatHitbox || currentHeadPose;
    const collisionRadius =
      target.radius + wormDimension("collisionRadius");
    return (
      squaredDistanceToSegment(
        target.x,
        target.y,
        previousHeadPose.x,
        previousHeadPose.y,
        currentHeadPose.x,
        currentHeadPose.y,
      ) <= collisionRadius * collisionRadius
    );
  }

  function transferHeavyTongueGrappleToBite(tongue) {
    if (tongue?.phase !== "heavy-grappled" || game.latchAttack) return false;
    const target = activeTongueTarget(tongue);
    if (!target || !enemyIsHardPrey(target)) return false;
    const lockAngle = getWormHeadAngle();
    const geometry = getTongueGeometry(tongue, tongue.progress);
    initializeTongueRetractionFromPose(tongue, geometry);
    handOffHeavyGrappleBody(tongue);
    tongue.targetId = null;
    tongue.heavyHold = false;
    delete tongue.holdPointerId;
    tongue.holdRemaining = 0;
    if (tongue.freefallNodes?.length) {
      tongue.captureProgress = Math.max(0.001, tongue.progress);
      tongue.phase = "captured-retracting";
    } else {
      tongue.phase = "retracting";
    }
    return beginBoostLatchAttack(target, true, lockAngle);
  }

  function retractingTongueWormObstacles() {
    const { pose } = tongueHeadAnchors();
    const scale = wormScale();
    const clearance =
      TONGUE_RULES.outerBaseWidth * scale * 0.5 +
      TONGUE_RULES.retractAvoidancePadding * scale;
    return [
      {
        x: pose.x,
        y: pose.y,
        radius:
          (WORM_SPRITE_METRICS.headHeight * scale * 0.5 + clearance) *
          TONGUE_RULES.retractAvoidanceHitboxScale *
          TONGUE_RULES.retractAvoidanceFrontBias,
      },
      ...game.segments.map((segment, index) => ({
        x: segment.x,
        y: segment.y,
        radius:
          (bodyRadius(index, game.segments.length, true) + clearance) *
          TONGUE_RULES.retractAvoidanceHitboxScale *
          lerp(
            TONGUE_RULES.retractAvoidanceFrontBias,
            TONGUE_RULES.retractAvoidanceTailBias,
            index / Math.max(1, game.segments.length - 1),
          ),
      })),
    ];
  }

  function tongueLinkObstacleContact(
    start,
    end,
    obstacles,
    avoidanceSide,
  ) {
    const linkX = end.x - start.x;
    const linkY = end.y - start.y;
    const linkLengthSquared = linkX * linkX + linkY * linkY;
    let deepestContact = null;

    obstacles.forEach((obstacle) => {
      const startOffsetX = start.x - obstacle.x;
      const startOffsetY = start.y - obstacle.y;
      const endOffsetX = end.x - obstacle.x;
      const endOffsetY = end.y - obstacle.y;
      const startDistanceSquared =
        startOffsetX * startOffsetX + startOffsetY * startOffsetY;
      const endDistanceSquared =
        endOffsetX * endOffsetX + endOffsetY * endOffsetY;
      const outwardMotion = linkX * startOffsetX + linkY * startOffsetY;
      const boundaryTolerance = Math.max(0.25, wormScale()) ** 2;
      if (
        startDistanceSquared < obstacle.radius * obstacle.radius &&
        endDistanceSquared >= startDistanceSquared - boundaryTolerance &&
        outwardMotion >= -boundaryTolerance
      ) {
        return;
      }
      const amount =
        linkLengthSquared > 0.000001
          ? clamp(
              ((obstacle.x - start.x) * linkX +
                (obstacle.y - start.y) * linkY) /
                linkLengthSquared,
              0,
              1,
            )
          : 1;
      const closestX = start.x + linkX * amount;
      const closestY = start.y + linkY * amount;
      let normalX = closestX - obstacle.x;
      let normalY = closestY - obstacle.y;
      const distance = magnitude(normalX, normalY);
      if (distance >= obstacle.radius) return;

      if (distance > Math.max(0.25, wormScale())) {
        normalX /= distance;
        normalY /= distance;
      } else {
        const linkLength = Math.sqrt(linkLengthSquared);
        if (linkLength > 0.0001) {
          normalX = -linkY / linkLength;
          normalY = linkX / linkLength;
        } else {
          normalX = -Math.sin(getWormHeadAngle());
          normalY = Math.cos(getWormHeadAngle());
        }
        const preferredNormalX =
          -Math.sin(getWormHeadAngle()) * avoidanceSide;
        const preferredNormalY =
          Math.cos(getWormHeadAngle()) * avoidanceSide;
        if (
          normalX * preferredNormalX + normalY * preferredNormalY < 0
        ) {
          normalX *= -1;
          normalY *= -1;
        }
      }

      const penetration = obstacle.radius - distance;
      const depthRatio = penetration / Math.max(1, obstacle.radius);
      if (!deepestContact || depthRatio > deepestContact.depthRatio) {
        deepestContact = {
          amount,
          normalX,
          normalY,
          penetration,
          depthRatio,
        };
      }
    });
    return deepestContact;
  }

  function limitRetractingTongueNodeVelocity(node) {
    const speed = magnitude(node.vx, node.vy);
    if (
      speed <= TONGUE_RULES.retractAvoidanceMaximumSpeed ||
      speed < 0.0001
    ) {
      return;
    }
    const ratio = TONGUE_RULES.retractAvoidanceMaximumSpeed / speed;
    node.vx *= ratio;
    node.vy *= ratio;
  }

  function steerRetractingTongueAwayFromWorm(
    nodes,
    front,
    obstacles,
    avoidanceSide,
    dt,
  ) {
    const lookahead = TONGUE_RULES.retractAvoidanceLookahead;
    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes[index];
      const previous = index > 0 ? nodes[index - 1] : null;
      const predictedStart = previous
        ? {
            x: previous.x + previous.vx * lookahead,
            y: previous.y + previous.vy * lookahead,
          }
        : front;
      const predictedEnd = {
        x: node.x + node.vx * lookahead,
        y: node.y + node.vy * lookahead,
      };
      const contact = tongueLinkObstacleContact(
        predictedStart,
        predictedEnd,
        obstacles,
        avoidanceSide,
      );
      if (!contact) continue;

      const turnSpeed =
        TONGUE_RULES.retractAvoidanceTurnAcceleration *
        wormScale() *
        dt *
        (0.45 + contact.depthRatio);
      const nodeWeight = 0.7 + contact.amount * 0.3;
      node.vx += contact.normalX * turnSpeed * nodeWeight;
      node.vy += contact.normalY * turnSpeed * nodeWeight;
      limitRetractingTongueNodeVelocity(node);
      if (previous) {
        const previousWeight = (1 - contact.amount) * 0.35;
        previous.vx += contact.normalX * turnSpeed * previousWeight;
        previous.vy += contact.normalY * turnSpeed * previousWeight;
        limitRetractingTongueNodeVelocity(previous);
      }
    }
  }

  function separateRetractingTongueFromWorm(
    nodes,
    front,
    obstacles,
    avoidanceSide,
  ) {
    const maximumCorrection =
      TONGUE_RULES.retractAvoidanceMaximumCorrection * wormScale();
    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes[index];
      const previous = index > 0 ? nodes[index - 1] : null;
      const start = previous || front;
      const contact = tongueLinkObstacleContact(
        start,
        node,
        obstacles,
        avoidanceSide,
      );
      if (!contact) continue;

      const correction = Math.min(
        maximumCorrection,
        contact.penetration * 0.65 + 0.2 * wormScale(),
      );
      const nodeWeight = 0.65 + contact.amount * 0.35;
      node.x += contact.normalX * correction * nodeWeight;
      node.y += contact.normalY * correction * nodeWeight;
      if (previous) {
        const previousWeight = (1 - contact.amount) * 0.35;
        previous.x += contact.normalX * correction * previousWeight;
        previous.y += contact.normalY * correction * previousWeight;
      }
    }
  }

  function updateTongueFreefall(tongue, dt) {
    const nodes = tongue.freefallNodes;
    if (!nodes?.length) return;
    const target = activeTongueTarget(tongue);
    const { front } = tongueHeadAnchors();
    const grappled = tongue.phase === "heavy-grappled";
    const grappleVisualLength = grappled && target
      ? clamp(
          Math.max(
            tongue.grappleRopeLength,
            magnitude(target.x - front.x, target.y - front.y),
          ),
          0,
          heavyTongueElasticLimit(tongue),
        )
      : 0;
    const retractScale =
      tongue.phase === "captured-retracting"
        ? clamp(tongue.progress / tongue.captureProgress, 0, 1)
        : grappled
          ? clamp(
              grappleVisualLength /
                tongue.grappleInitialRopeLength,
              0.02,
              heavyTongueElasticLimit(tongue) /
                tongue.grappleInitialRopeLength,
            )
        : 1;
    const retracting = tongue.phase === "captured-retracting";
    const wormObstacles = retracting
      ? retractingTongueWormObstacles()
      : null;
    if (retracting && !tongue.retractAvoidanceSide) {
      const tip = nodes[nodes.length - 1];
      const { pose } = tongueHeadAnchors();
      const sideOffset =
        (tip.x - pose.x) * -Math.sin(pose.angle) +
        (tip.y - pose.y) * Math.cos(pose.angle);
      tongue.retractAvoidanceSide =
        Math.abs(sideOffset) > 0.01
          ? Math.sign(sideOffset)
          : tongue.targetId % 2 === 0
            ? 1
            : -1;
    }
    const drag = Math.pow(TONGUE_RULES.freefallDrag, dt);

    if (retracting) {
      steerRetractingTongueAwayFromWorm(
        nodes,
        front,
        wormObstacles,
        tongue.retractAvoidanceSide,
        dt,
      );
    }

    nodes.forEach((node, index) => {
      node.previousX = node.x;
      node.previousY = node.y;
      if (grappled && target && index === nodes.length - 1) {
        node.x = target.x;
        node.y = target.y;
        node.vx = 0;
        node.vy = 0;
        return;
      }
      node.vx *= drag;
      node.vy = Math.min(
        TONGUE_RULES.freefallMaximumSpeed,
        node.vy + TONGUE_RULES.freefallGravity * dt,
      );
      node.x += node.vx * dt;
      node.y += node.vy * dt;
    });

    for (
      let iteration = 0;
      iteration < TONGUE_RULES.freefallConstraintIterations;
      iteration += 1
    ) {
      for (let index = 0; index < nodes.length; index += 1) {
        const node = nodes[index];
        const previous = index > 0 ? nodes[index - 1] : null;
        const anchorX = previous ? previous.x : front.x;
        const anchorY = previous ? previous.y : front.y;
        const dx = node.x - anchorX;
        const dy = node.y - anchorY;
        const distance = magnitude(dx, dy);
        if (distance < 0.0001) continue;
        const desiredLength =
          tongue.freefallRestLengths[index] * retractScale;
        const correctionRatio = (distance - desiredLength) / distance;
        const correctionX = dx * correctionRatio;
        const correctionY = dy * correctionRatio;
        if (grappled && target && index === nodes.length - 1) {
          if (previous) {
            previous.x += correctionX;
            previous.y += correctionY;
          }
          node.x = target.x;
          node.y = target.y;
        } else if (previous) {
          previous.x += correctionX * 0.5;
          previous.y += correctionY * 0.5;
          node.x -= correctionX * 0.5;
          node.y -= correctionY * 0.5;
        } else {
          node.x -= correctionX;
          node.y -= correctionY;
        }
      }
      if (retracting) {
        separateRetractingTongueFromWorm(
          nodes,
          front,
          wormObstacles,
          tongue.retractAvoidanceSide,
        );
      }
    }

    nodes.forEach((node, index) => {
      if (grappled && target && index === nodes.length - 1) {
        node.x = target.x;
        node.y = target.y;
      }
      node.vx = dt > 0 ? (node.x - node.previousX) / dt : 0;
      node.vy = dt > 0 ? (node.y - node.previousY) / dt : 0;
      if (grappled && index === nodes.length - 1) {
        node.vx = 0;
        node.vy = 0;
      }
      if (retracting) limitRetractingTongueNodeVelocity(node);
      delete node.previousX;
      delete node.previousY;
    });
    if (target && !grappled) {
      const tip = nodes[nodes.length - 1];
      target.angle = tongueLastSegmentAngle(nodes, front, target.angle);
      target.x = tip.x;
      target.y = tip.y;
      target.vx = tip.vx;
      target.vy = tip.vy;
      target.regionType =
        getBlockAtWorld(target.x, target.y)?.type || BLOCK_TYPES.AIR;
    }
  }

  function finishTongueCapture(tongue) {
    const target = activeTongueTarget(tongue);
    if (target) {
      const { front } = tongueHeadAnchors();
      target.x = front.x;
      target.y = front.y;
      target.vx = 0;
      target.vy = 0;
      target.tongueCaptured = false;
      target.paralyzed = true;
      target.movementMode = "paralyzed";
      if (target.kind === ENEMY_TYPES.MEAT) {
        delete target.boostDropReleaseX;
        delete target.boostDropReleaseY;
        delete target.boostDropReleaseRadius;
        delete target.boostDropMovementArmed;
      }
    }
    removeTongue(tongue);
  }

  function launchTongueAtWorldPoint(x, y) {
    if (
      !wormHasAbility(WORM_ABILITIES.TONGUE) ||
      !game.started ||
      game.paused ||
      game.menuOpen
    ) {
      return false;
    }
    const targetX = x;
    const targetY = clamp(y, 0, game.height);
    const availableTongues = Math.max(
      0,
      wormTongueCapacity() - game.tongues.length,
    );
    if (availableTongues === 0) return false;
    const selectedTargets = prioritizedTongueTargets(
      targetX,
      targetY,
      availableTongues,
    );
    const selectionRadius = tongueTargetingRadius();
    if (selectedTargets.length === 0) {
      game.tongues.push({
        aimOnly: true,
        aimOffsetX: targetX - game.head.x,
        aimOffsetY: targetY - game.head.y,
        selectionX: targetX,
        selectionY: targetY,
        selectionRadius,
        targetId: null,
        progress: 0,
        phase: "extending",
        holdRemaining: TONGUE_RULES.holdDuration,
      });
      return true;
    }
    selectedTargets.forEach((selectedTarget) => {
      game.tongues.push({
        aimOffsetX: targetX - game.head.x,
        aimOffsetY: targetY - game.head.y,
        selectionX: targetX,
        selectionY: targetY,
        selectionRadius,
        targetId: selectedTarget.id,
        progress: 0,
        phase: "extending",
        holdRemaining: TONGUE_RULES.holdDuration,
      });
    });
    return selectedTargets.length > 0;
  }

  function launchHeldHeavyTongue(
    target,
    pointerId,
    selectionX = target?.x,
    selectionY = target?.y,
  ) {
    if (
      !wormHasAbility(WORM_ABILITIES.TONGUE) ||
      !game.started ||
      game.paused ||
      game.menuOpen ||
      !target ||
      !wormCanStartHeavyTongueGrapple() ||
      activeHeavyTongueGrapple() ||
      game.tongues.length >= wormTongueCapacity()
    ) {
      return false;
    }

    const tongue = {
      aimOffsetX: target.x - game.head.x,
      aimOffsetY: target.y - game.head.y,
      selectionX,
      selectionY,
      selectionRadius: tongueTargetingRadius(),
      targetId: target.id,
      holdPointerId: pointerId,
      heavyHold: true,
      progress: 0,
      phase: "extending",
      holdRemaining: 0,
    };
    game.tongues.push(tongue);
    return true;
  }

  function updateTongue(tongue, dt) {
    if (
      tongue.heavyHold &&
      (
        !activeTongueTarget(tongue) ||
        tonguePointer.pointerId !== tongue.holdPointerId
      )
    ) {
      beginHeldHeavyTongueRetraction(tongue);
      return;
    }

    if (tongue.phase === "heavy-grappled") {
      updateTongueFreefall(tongue, dt);
      return;
    }

    if (
      !tongue.aimOnly &&
      !activeTongueTarget(tongue) &&
      !tongue.freefallNodes
    ) {
      tongue.phase = "retracting";
      tongue.holdRemaining = 0;
    }

    if (
      tongue.phase === "captured-holding" ||
      tongue.phase === "captured-retracting"
    ) {
      if (tongue.phase === "captured-holding") {
        tongue.holdRemaining = Math.max(0, tongue.holdRemaining - dt);
        if (tongue.holdRemaining <= 0) {
          tongue.phase = "captured-retracting";
        }
      }
      if (tongue.phase === "captured-retracting") {
        tongue.progress = Math.max(
          0,
          tongue.progress - TONGUE_RULES.capturedRetractRate * dt,
        );
      }
      updateTongueFreefall(tongue, dt);
      if (tongue.progress <= 0) finishTongueCapture(tongue);
      return;
    }

    if (tongue.phase === "extending") {
      tongue.progress = Math.min(
        1,
        tongue.progress + TONGUE_RULES.extendRate * dt,
      );
      const target = activeTongueTarget(tongue);
      const geometry = target ? getTongueGeometry(tongue) : null;
      const beginContact = tongue.heavyHold
        ? beginHeavyTongueGrapple
        : beginTongueCapture;
      if (
        target &&
        geometry &&
        tongueGeometryTouchesTarget(geometry, target) &&
        beginContact(tongue, target, geometry)
      ) {
        return;
      }
      if (tongue.progress >= 1) tongue.phase = "holding";
      return;
    }

    if (tongue.phase === "holding") {
      const target = activeTongueTarget(tongue);
      const geometry = target ? getTongueGeometry(tongue) : null;
      const beginContact = tongue.heavyHold
        ? beginHeavyTongueGrapple
        : beginTongueCapture;
      if (
        target &&
        geometry &&
        tongueGeometryTouchesTarget(geometry, target) &&
        beginContact(tongue, target, geometry)
      ) {
        return;
      }
      if (tongue.heavyHold) return;
      tongue.holdRemaining = Math.max(0, tongue.holdRemaining - dt);
      if (tongue.holdRemaining <= 0) tongue.phase = "retracting";
      return;
    }

    tongue.progress = Math.max(
      0,
      tongue.progress - TONGUE_RULES.retractRate * dt,
    );
    if (tongue.progress <= 0) removeTongue(tongue);
  }

  function updateTongues(dt) {
    for (let index = game.tongues.length - 1; index >= 0; index -= 1) {
      updateTongue(game.tongues[index], dt);
    }
  }

  function updateMouthAnimation(dt) {
    if (game.mouthChewTimer > 0) {
      const chewTime = Math.min(dt, game.mouthChewTimer);
      advanceMouthChew(chewTime);
      game.mouthChewTimer = Math.max(0, game.mouthChewTimer - chewTime);
      if (game.mouthChewTimer > 0) return;
      game.mouthBitePhase = "idle";
      game.mouthBiteHoldTimer = 0;
      dt -= chewTime;
    }

    const enemyNearby = enemyIsNearHead();
    const airborneBoostHeld =
      keys.boost && !game.inGround && !game.onStoneSurface;
    const shouldHoldOpen =
      enemyNearby ||
      airborneBoostHeld ||
      game.tongues.length > 0 ||
      spitterHeadPoseShouldRemainActive();
    game.mouthOpen = moveToward(
      game.mouthOpen,
      shouldHoldOpen ? 1 : 0,
      (shouldHoldOpen ? MOUTH_BEHAVIOR.openRate : MOUTH_BEHAVIOR.closeRate) * dt,
    );
  }

  function requiredBitesForTarget(target) {
    const health = Math.max(0.001, target.health);
    const biteDamage = wormBiteDamage();
    if (biteDamage >= health * 2) return 0;
    if (biteDamage >= health) return 2;
    return Math.max(3, Math.ceil((health * 2) / biteDamage));
  }

  function enemyRepelsBite(target) {
    return enemyIsHardPrey(target);
  }

  function bounceWormOffEnemy(target) {
    const incomingSpeed = magnitude(game.velocity.x, game.velocity.y);
    let directionX;
    let directionY;
    if (incomingSpeed > 0.5) {
      directionX = -game.velocity.x / incomingSpeed;
      directionY = -game.velocity.y / incomingSpeed;
    } else {
      directionX = game.head.x - target.x;
      directionY = game.head.y - target.y;
      const directionLength = magnitude(directionX, directionY);
      if (directionLength > 0.5) {
        directionX /= directionLength;
        directionY /= directionLength;
      } else {
        directionX = -Math.cos(game.heading);
        directionY = -Math.sin(game.heading);
      }
    }

    const bounceSpeed = Math.max(
      COMBAT_RULES.minimumBounceSpeed,
      incomingSpeed * COMBAT_RULES.bounceSpeedRetention,
    );
    game.velocity.x = directionX * bounceSpeed;
    game.velocity.y = directionY * bounceSpeed;
    game.speed = bounceSpeed;
    game.heading = Math.atan2(directionY, directionX);
    game.shake = Math.max(game.shake, 4);
    target.biteBounceCooldown = COMBAT_RULES.bounceCooldown;
    triggerSingleCappedMouthBite();
  }

  function placeCapturedTarget(target, progress) {
    const mouth = getEatAnimationConeWorldPoints();
    const distanceFromPivot = mouth.cone.range * (1 - progress);
    const approachAngle =
      mouth.pose.angle + (target.captureAngleOffset ?? 0);
    target.x = mouth.pivotX + Math.cos(approachAngle) * distanceFromPivot;
    target.y = mouth.pivotY + Math.sin(approachAngle) * distanceFromPivot;
    target.angle = approachAngle + Math.PI;
    target.captureScale = lerp(1, 0.5, progress);
  }

  function captureTargetForBite(target, biteCount) {
    const mouth = getEatAnimationConeWorldPoints();
    const targetAngle = Math.atan2(
      target.y - mouth.pivotY,
      target.x - mouth.pivotX,
    );
    const relativeTargetAngle = Math.atan2(
      Math.sin(targetAngle - mouth.pose.angle),
      Math.cos(targetAngle - mouth.pose.angle),
    );
    target.captureElapsed = 0;
    target.captureDuration =
      MOUTH_BEHAVIOR.chewLoopDuration * Math.max(1, biteCount);
    target.captureAngleOffset = clamp(
      relativeTargetAngle,
      -mouth.cone.halfAngle,
      mouth.cone.halfAngle,
    );
    target.captureJustStarted = true;
    target.requiredBites = biteCount;
    target.splatterBitesRemaining = Math.max(1, biteCount);
    target.vx = 0;
    target.vy = 0;
    placeCapturedTarget(target, 0);
    game.capturedTargets.push(target);
  }

  function finishConsumedTargets(consumedTargets, emitFinalSplatter = true) {
    if (consumedTargets.length === 0) return;
    consumedTargets.forEach((target) => {
      game.targetsEaten += 1;
      const effectCountScale = Math.min(3, target.sizeScale);
      spawnParticles(
        target.x,
        target.y,
        Math.round(7 * effectCountScale),
        target.kind,
        target.sizeScale,
      );
      if (emitFinalSplatter) {
        spawnBiteSplatter(
          target.x,
          target.y,
          getWormHeadAngle(),
          target.sizeScale,
          Math.max(
            BITE_SPLATTER_RULES.baseCount,
            Math.round(15 * effectCountScale),
          ),
        );
      }
    });
    if (game.swarmMode) {
      consumedTargets
        .filter((target) => target.kind !== ENEMY_TYPES.MEAT)
        .forEach((target) => spawnSwarmTargets(target));
    }
    awardScore(
      consumedTargets.reduce(
        (score, target) => score + target.scoreValue,
        0,
      ),
    );
  }

  function updateCapturedTargets(dt) {
    const consumedTargets = [];
    for (let index = game.capturedTargets.length - 1; index >= 0; index -= 1) {
      const target = game.capturedTargets[index];
      if (target.captureJustStarted) {
        target.captureJustStarted = false;
      } else {
        target.captureElapsed += dt;
      }
      const progress = clamp(
        target.captureElapsed / target.captureDuration,
        0,
        1,
      );
      placeCapturedTarget(target, progress);
      advanceEnemyAnimation(target, dt, ENEMY_MOTION.movingScurryFps);
      if (progress < 1) continue;
      game.capturedTargets.splice(index, 1);
      consumedTargets.push(target);
    }
    finishConsumedTargets(consumedTargets, false);
  }

  function suppressReleasedLatchHitbox(target, eatHitboxSweep, eatCone) {
    if (!target.boostLatchHitboxDisabled) return false;
    if (!targetTouchesEatCone(target, eatHitboxSweep, eatCone)) {
      target.boostLatchHitboxDisabled = false;
    }
    // Suppress the frame that clears the swept cone as well. The following
    // frame is the first one whose complete movement sweep can safely collide.
    return true;
  }

  function eatTargetsAlongHeadPath() {
    if (game.latchAttack) return;
    let longestBiteCount = 0;
    let bouncedThisFrame = false;
    const eatHitboxSweep = getEatHitboxSweep();
    const eatCone = getEatConeGeometry();
    const airborneLatchTarget = airborneBoostLatchCollisionTarget(
      eatHitboxSweep,
      eatCone,
    );
    if (airborneLatchTarget) {
      beginBoostLatchAttack(airborneLatchTarget, true);
      return;
    }
    for (let index = game.targets.length - 1; index >= 0; index -= 1) {
      const target = game.targets[index];
      if (target.tongueCaptured || targetHasActiveTongue(target)) continue;
      if (Number.isFinite(target.boostDropReleaseX)) {
        if (!target.boostDropMovementArmed) {
          const playerDirectedMotion = game.inGround
            ? keys.up
            : keys.left || keys.right;
          if (!playerDirectedMotion) continue;
          target.boostDropMovementArmed = true;
        }
        if (
          magnitude(
            game.head.x - target.boostDropReleaseX,
            game.head.y - target.boostDropReleaseY,
          ) <= target.boostDropReleaseRadius
        ) {
          continue;
        }
        delete target.boostDropReleaseX;
        delete target.boostDropReleaseY;
        delete target.boostDropReleaseRadius;
        delete target.boostDropMovementArmed;
      }
      if (suppressReleasedLatchHitbox(target, eatHitboxSweep, eatCone)) continue;
      if (!targetTouchesEatCone(target, eatHitboxSweep, eatCone)) continue;
      if (target.biteBounceCooldown > 0) continue;
      if (enemyRepelsBite(target)) {
        if (!bouncedThisFrame) {
          bounceWormOffEnemy(target);
          bouncedThisFrame = true;
        } else {
          target.biteBounceCooldown = COMBAT_RULES.bounceCooldown;
        }
        continue;
      }
      game.targets.splice(index, 1);
      const animationBiteCount = Math.max(
        1,
        requiredBitesForTarget(target),
      );
      captureTargetForBite(target, animationBiteCount);
      longestBiteCount = Math.max(
        longestBiteCount,
        animationBiteCount,
      );
    }
    if (longestBiteCount > 0) triggerMouthBite(longestBiteCount);
  }

  function sweepPointAgainstAabb(
    startX,
    startY,
    endX,
    endY,
    minimumX,
    minimumY,
    maximumX,
    maximumY,
  ) {
    const startsInside =
      startX > minimumX &&
      startX < maximumX &&
      startY > minimumY &&
      startY < maximumY;
    if (startsInside) {
      const sides = [
        { distance: startX - minimumX, normalX: -1, normalY: 0 },
        { distance: maximumX - startX, normalX: 1, normalY: 0 },
        { distance: startY - minimumY, normalX: 0, normalY: -1 },
        { distance: maximumY - startY, normalX: 0, normalY: 1 },
      ];
      sides.sort((a, b) => a.distance - b.distance);
      return {
        time: 0,
        normalX: sides[0].normalX,
        normalY: sides[0].normalY,
        penetration: sides[0].distance,
        startsInside: true,
      };
    }

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    let entryTime = -Infinity;
    let exitTime = Infinity;
    let normalX = 0;
    let normalY = 0;
    const axes = [
      {
        start: startX,
        delta: deltaX,
        minimum: minimumX,
        maximum: maximumX,
        nearNormalX: deltaX >= 0 ? -1 : 1,
        nearNormalY: 0,
      },
      {
        start: startY,
        delta: deltaY,
        minimum: minimumY,
        maximum: maximumY,
        nearNormalX: 0,
        nearNormalY: deltaY >= 0 ? -1 : 1,
      },
    ];

    for (const axis of axes) {
      if (Math.abs(axis.delta) < 0.000001) {
        if (axis.start < axis.minimum || axis.start > axis.maximum) return null;
        continue;
      }
      const nearBoundary = axis.delta > 0 ? axis.minimum : axis.maximum;
      const farBoundary = axis.delta > 0 ? axis.maximum : axis.minimum;
      const nearTime = (nearBoundary - axis.start) / axis.delta;
      const farTime = (farBoundary - axis.start) / axis.delta;
      if (nearTime > entryTime) {
        entryTime = nearTime;
        normalX = axis.nearNormalX;
        normalY = axis.nearNormalY;
      }
      exitTime = Math.min(exitTime, farTime);
      if (entryTime > exitTime) return null;
    }

    if (entryTime < 0 || entryTime > 1 || exitTime < 0) return null;
    return { time: entryTime, normalX, normalY };
  }

  function findStoneDistanceFieldCollision(startPose, endPose, radius) {
    const field = game.map.stoneDistanceField;
    if (!field) return null;
    const movementX = endPose.x - startPose.x;
    const movementY = endPose.y - startPose.y;
    const movementLength = magnitude(movementX, movementY);
    const clearanceAt = (amount) =>
      sampleStoneSignedDistance(
        field,
        lerp(startPose.x, endPose.x, amount),
        lerp(startPose.y, endPose.y, amount),
      ) - radius;
    const collisionAt = (amount, penetration = 0, startsInside = false) => {
      const x = lerp(startPose.x, endPose.x, amount);
      const y = lerp(startPose.y, endPose.y, amount);
      let normal = stoneSignedDistanceGradient(field, x, y);
      if (magnitude(normal.x, normal.y) < 0.5) {
        normal = movementLength > 0.000001
          ? {
              x: -movementX / movementLength,
              y: -movementY / movementLength,
            }
          : { x: 0, y: -1 };
      }
      return {
        time: amount,
        normalX: normal.x,
        normalY: normal.y,
        penetration,
        startsInside,
        block: nearestStoneBlock(x, y, radius + field.size),
      };
    };

    let previousTime = 0;
    let previousClearance = clearanceAt(0);
    if (previousClearance < -0.0001) {
      const collision = collisionAt(
        0,
        -previousClearance,
        true,
      );
      const outwardMovement =
        movementX * collision.normalX + movementY * collision.normalY;
      if (outwardMovement <= 0.000001) return collision;
    }
    if (movementLength <= 0.000001) return null;

    // Samples are close enough that even a single 12 px stone block expanded
    // by the head radius cannot be crossed between adjacent checks.
    const stepCount = Math.max(
      1,
      Math.ceil(movementLength / (field.size * 0.25)),
    );
    let seekingExit = previousClearance < 0;
    for (let step = 1; step <= stepCount; step += 1) {
      const currentTime = step / stepCount;
      const currentClearance = clearanceAt(currentTime);
      if (seekingExit) {
        if (currentClearance >= 0) seekingExit = false;
      } else if (previousClearance >= 0 && currentClearance <= 0) {
        let safeTime = previousTime;
        let collisionTime = currentTime;
        for (let iteration = 0; iteration < 10; iteration += 1) {
          const middleTime = (safeTime + collisionTime) * 0.5;
          if (clearanceAt(middleTime) > 0) safeTime = middleTime;
          else collisionTime = middleTime;
        }
        return collisionAt(collisionTime);
      }
      previousTime = currentTime;
      previousClearance = currentClearance;
    }
    return null;
  }

  function findStoneCollision(startPose, endPose, radius) {
    const size = game.map.cellSize;
    if (game.stoneCollisionGraceTimer <= 0) {
      return findStoneDistanceFieldCollision(
        startPose,
        endPose,
        radius,
      );
    }
    const minimumColumn = Math.floor(
      (Math.min(startPose.x, endPose.x) - radius) / size,
    );
    const maximumColumn = Math.floor(
      (Math.max(startPose.x, endPose.x) + radius) / size,
    );
    const minimumRow = clamp(
      Math.floor((Math.min(startPose.y, endPose.y) - radius) / size),
      0,
      game.map.rows - 1,
    );
    const maximumRow = clamp(
      Math.floor((Math.max(startPose.y, endPose.y) + radius) / size),
      0,
      game.map.rows - 1,
    );
    let earliestCollision = null;
    for (let row = minimumRow; row <= maximumRow; row += 1) {
      for (let column = minimumColumn; column <= maximumColumn; column += 1) {
        const block = getBlockAtGrid(column, row);
        if (block?.type !== BLOCK_TYPES.STONE) continue;
        if (
          game.stoneCollisionGraceTimer > 0 &&
          block.stoneClusterId === game.stoneCollisionGraceClusterId
        ) {
          continue;
        }
        const collision = sweepPointAgainstAabb(
          startPose.x,
          startPose.y,
          endPose.x,
          endPose.y,
          column * size - radius,
          row * size - radius,
          (column + 1) * size + radius,
          (row + 1) * size + radius,
        );
        if (
          collision &&
          (!earliestCollision || collision.time < earliestCollision.time)
        ) {
          earliestCollision = { ...collision, block };
        }
      }
    }
    return earliestCollision;
  }

  function findStoneTopLanding(startPose, endPose, radius) {
    const movementX = endPose.x - startPose.x;
    const movementY = endPose.y - startPose.y;
    if (magnitude(movementX, movementY) <= 0.000001) return null;
    const size = game.map.cellSize;
    const minimumColumn = Math.floor(
      (Math.min(startPose.x, endPose.x) - radius) / size,
    );
    const maximumColumn = Math.floor(
      (Math.max(startPose.x, endPose.x) + radius) / size,
    );
    const candidateSegments = new Map();
    for (let column = minimumColumn; column <= maximumColumn; column += 1) {
      const wrappedColumn = wrapWorldColumn(column);
      const worldOffsetX =
        (column - wrappedColumn) * game.map.cellSize;
      (game.map.stoneSurfaceSegmentsByColumn[wrappedColumn] || []).forEach(
        (reference) => {
          candidateSegments.set(
            `${reference.path.id}:${reference.index}:${worldOffsetX}`,
            { reference, worldOffsetX },
          );
        },
      );
    }
    let earliestCollision = null;
    const minimumX = Math.min(startPose.x, endPose.x) - radius;
    const maximumX = Math.max(startPose.x, endPose.x) + radius;

    for (const { reference, worldOffsetX } of candidateSegments.values()) {
      const surfacePath = reference.path;
      const index = reference.index;
      if (surfacePath === game.excludedStoneSurfacePath) continue;
      if (
        game.stoneCollisionGraceTimer > 0 &&
        surfacePath.clusterId === game.stoneCollisionGraceClusterId
      ) {
        continue;
      }
      const baseFirstSample = surfacePath.samples[index];
      const baseSecondSample = surfacePath.samples[index + 1];
      const firstSample = {
        ...baseFirstSample,
        x: baseFirstSample.x + worldOffsetX,
      };
      const secondSample = {
        ...baseSecondSample,
        x: baseSecondSample.x + worldOffsetX,
      };
        if (
          Math.max(firstSample.x, secondSample.x) < minimumX ||
          Math.min(firstSample.x, secondSample.x) > maximumX
        ) {
          continue;
        }
        const first = stoneSurfaceTraversalFromSample(
          firstSample,
          radius,
          surfacePath,
        );
        const second = stoneSurfaceTraversalFromSample(
          secondSample,
          radius,
          surfacePath,
        );
        const intersection = segmentIntersection(
          startPose.x,
          startPose.y,
          endPose.x,
          endPose.y,
          first.x,
          first.y,
          second.x,
          second.y,
        );
        if (!intersection) continue;
        const normalAmount = intersection.secondAmount;
        let normalX = lerp(
          firstSample.normalX,
          secondSample.normalX,
          normalAmount,
        );
        let normalY = lerp(
          firstSample.normalY,
          secondSample.normalY,
          normalAmount,
        );
        const normalLength = magnitude(normalX, normalY) || 1;
        normalX /= normalLength;
        normalY /= normalLength;
        if (normalY >= -STONE_RULES.surfaceMinimumUpwardNormal) continue;
        const traversalX = lerp(first.x, second.x, normalAmount);
        const traversalY = lerp(first.y, second.y, normalAmount);
        const startSurfaceSide =
          (startPose.x - traversalX) * normalX +
          (startPose.y - traversalY) * normalY;
        const endSurfaceSide =
          (endPose.x - traversalX) * normalX +
          (endPose.y - traversalY) * normalY;
        if (
          startSurfaceSide < -STONE_RULES.surfaceApproachSideTolerance ||
          endSurfaceSide > STONE_RULES.surfaceApproachSideTolerance
        ) {
          continue;
        }
        if (movementX * normalX + movementY * normalY >= -0.000001) continue;
        if (
          !earliestCollision ||
          intersection.firstAmount < earliestCollision.time
        ) {
          earliestCollision = {
            time: intersection.firstAmount,
            normalX,
            normalY,
            surfacePath,
            surfaceSegmentIndex: index,
            surfaceOffsetX: worldOffsetX,
            surfaceDistance: lerp(
              firstSample.distance,
              secondSample.distance,
              intersection.secondAmount,
            ),
            block: null,
          };
        }
    }
    return earliestCollision;
  }

  function segmentIntersection(
    firstStartX,
    firstStartY,
    firstEndX,
    firstEndY,
    secondStartX,
    secondStartY,
    secondEndX,
    secondEndY,
  ) {
    const firstX = firstEndX - firstStartX;
    const firstY = firstEndY - firstStartY;
    const secondX = secondEndX - secondStartX;
    const secondY = secondEndY - secondStartY;
    const denominator = firstX * secondY - firstY * secondX;
    if (Math.abs(denominator) < 0.000001) return null;
    const offsetX = secondStartX - firstStartX;
    const offsetY = secondStartY - firstStartY;
    const firstAmount = (offsetX * secondY - offsetY * secondX) / denominator;
    const secondAmount = (offsetX * firstY - offsetY * firstX) / denominator;
    if (
      firstAmount < 0 ||
      firstAmount > 1 ||
      secondAmount < 0 ||
      secondAmount > 1
    ) {
      return null;
    }
    return { firstAmount, secondAmount };
  }

  function stoneSurfaceTraversalFromSample(sample, radius, path) {
    const clearance = radius + STONE_RULES.collisionInset;
    return {
      x: sample.x + sample.normalX * clearance,
      y: sample.y + sample.normalY * clearance,
    };
  }

  function nearestStoneSurfaceProgress(
    path,
    segmentIndex,
    headX,
    headY,
    radius,
  ) {
    // Stay on the exact local section that registered the collision. Searching
    // the whole contour can jump to another nearby fold belonging to the same
    // path, even though the head never touched that part of the surface.
    const index = clamp(
      Math.floor(segmentIndex),
      0,
      path.samples.length - 2,
    );
    const firstSample = path.samples[index];
    const secondSample = path.samples[index + 1];
    const first = stoneSurfaceTraversalFromSample(firstSample, radius, path);
    const second = stoneSurfaceTraversalFromSample(secondSample, radius, path);
    const sectionX = second.x - first.x;
    const sectionY = second.y - first.y;
    const sectionLengthSquared = sectionX * sectionX + sectionY * sectionY;
    const amount = sectionLengthSquared > 0.000001
      ? clamp(
          ((headX - first.x) * sectionX +
            (headY - first.y) * sectionY) /
            sectionLengthSquared,
          0,
          1,
        )
      : 0;
    return lerp(firstSample.distance, secondSample.distance, amount);
  }

  function nearestStoneSurfacePoint(x, y, maximumDistance) {
    if (
      game.map.columns <= 0 ||
      game.map.stoneSurfacePaths.length === 0 ||
      maximumDistance <= 0
    ) {
      return null;
    }

    const size = game.map.cellSize;
    const minimumColumn = Math.floor((x - maximumDistance) / size);
    const maximumColumn = Math.floor((x + maximumDistance) / size);
    const segmentReferences = new Map();
    for (let column = minimumColumn; column <= maximumColumn; column += 1) {
      const wrappedColumn = wrapWorldColumn(column);
      const worldOffsetX = (column - wrappedColumn) * size;
      (game.map.stoneSurfaceSegmentsByColumn[wrappedColumn] || []).forEach(
        (reference) => {
          segmentReferences.set(
            `${reference.path.id}:${reference.index}:${worldOffsetX}`,
            { reference, worldOffsetX },
          );
        },
      );
    }

    const maximumDistanceSquared = maximumDistance * maximumDistance;
    const sideTolerance = Math.max(
      STONE_RULES.surfaceApproachSideTolerance,
      size * 0.04,
    );
    let nearest = null;
    segmentReferences.forEach(({ reference, worldOffsetX }) => {
      const { path, index } = reference;
      if (
        path.bounds.minX + worldOffsetX > x + maximumDistance ||
        path.bounds.maxX + worldOffsetX < x - maximumDistance ||
        path.bounds.minY > y + maximumDistance ||
        path.bounds.maxY < y - maximumDistance
      ) {
        return;
      }
      const baseFirst = path.samples[index];
      const baseSecond = path.samples[index + 1];
      const first = { ...baseFirst, x: baseFirst.x + worldOffsetX };
      const second = { ...baseSecond, x: baseSecond.x + worldOffsetX };
        const sectionX = second.x - first.x;
        const sectionY = second.y - first.y;
        const sectionLengthSquared =
          sectionX * sectionX + sectionY * sectionY;
        const amount = sectionLengthSquared > 0.000001
          ? clamp(
              ((x - first.x) * sectionX +
                (y - first.y) * sectionY) /
                sectionLengthSquared,
              0,
              1,
            )
          : 0;
        const surfaceX = lerp(first.x, second.x, amount);
        const surfaceY = lerp(first.y, second.y, amount);
        const offsetX = x - surfaceX;
        const offsetY = y - surfaceY;
        const distanceSquared = offsetX * offsetX + offsetY * offsetY;
        if (
          distanceSquared > maximumDistanceSquared ||
          (nearest && distanceSquared >= nearest.distanceSquared)
        ) {
          return;
        }

        let normalX = lerp(first.normalX, second.normalX, amount);
        let normalY = lerp(first.normalY, second.normalY, amount);
        const normalLength = magnitude(normalX, normalY) || 1;
        normalX /= normalLength;
        normalY /= normalLength;
        const surfaceSide = offsetX * normalX + offsetY * normalY;
        // Only the air-facing side of an exposed upper surface can attract
        // the wheel. Passing below a thin cluster cannot capture the worm.
        if (surfaceSide < -sideTolerance) return;

        let unitX = lerp(first.unitX, second.unitX, amount);
        let unitY = lerp(first.unitY, second.unitY, amount);
        const unitLength = magnitude(unitX, unitY) || 1;
        unitX /= unitLength;
        unitY /= unitLength;
        nearest = {
          path,
          segmentIndex: index,
          amount,
          distance: Math.sqrt(distanceSquared),
          distanceSquared,
          surfaceDistance: lerp(first.distance, second.distance, amount),
          x: surfaceX,
          y: surfaceY,
          unitX,
          unitY,
          normalX,
          normalY,
          surfaceSide,
          worldOffsetX,
        };
    });
    return nearest;
  }

  function endStoneSurfaceContact() {
    game.stoneSurfaceContact = null;
    game.onStoneSurface = false;
    gameShell.dataset.stoneSurface = "false";
  }

  function activeStoneSurfaceContact() {
    const contact = game.stoneSurfaceContact;
    if (
      !contact ||
      game.map.stoneSurfacePaths[contact.path.id] !== contact.path
    ) {
      endStoneSurfaceContact();
      return null;
    }
    return contact;
  }

  function beginStoneSurfaceContact(surface, headPose, radius) {
    if (!surface || game.inGround || activeHeavyTongueGrapple()) return false;
    const wheelRadius = stoneSurfaceWheelRadius(radius);
    const tangentVelocity =
      game.velocity.x * surface.unitX + game.velocity.y * surface.unitY;
    const facingAmount =
      Math.cos(headPose.angle) * surface.unitX +
      Math.sin(headPose.angle) * surface.unitY;
    game.stoneSurfaceDirection = Math.abs(tangentVelocity) > 1
      ? Math.sign(tangentVelocity)
      : Math.abs(facingAmount) > 0.05
        ? Math.sign(facingAmount)
        : game.stoneSurfaceDirection || 1;
    game.stoneSurfaceContact = {
      path: surface.path,
      clusterId: surface.path.clusterId,
      wheelX: headPose.x,
      wheelY: headPose.y,
      velocityX: game.velocity.x,
      velocityY: game.velocity.y,
      radius: wheelRadius,
      rotation: 0,
      surface,
    };
    game.onStoneSurface = true;
    gameShell.dataset.stoneSurface = "true";
    game.excludedStoneSurfacePath = null;
    game.stoneSurfaceRelockTimer = 0;
    game.stoneCollisionGraceClusterId = null;
    game.stoneCollisionGraceTimer = 0;
    game.shake = Math.max(game.shake, 0.65);
    spawnParticles(surface.x, surface.y, 2, "stone");
    return true;
  }

  function tryBeginStoneSurfaceContact(startPose, endPose, radius) {
    if (
      game.stoneSurfaceContact ||
      game.inGround ||
      activeHeavyTongueGrapple()
    ) {
      return false;
    }
    const wheelRadius = stoneSurfaceWheelRadius(radius);
    const captureRadius =
      wheelRadius * STONE_RULES.surfaceCaptureRadiusMultiplier;
    let surface = nearestStoneSurfacePoint(
      endPose.x,
      endPose.y,
      captureRadius,
    );

    // A fast frame can cross the attraction band without ending inside it.
    // Reuse the swept top-surface query so that crossing still creates the
    // wheel, while preserving the air-facing-only capture rule.
    if (!surface) {
      const crossing = findStoneTopLanding(
        startPose,
        endPose,
        captureRadius,
      );
      if (crossing) {
        const sampled = sampleStoneSurfacePath(
          crossing.surfacePath,
          crossing.surfaceDistance,
        );
        sampled.x += crossing.surfaceOffsetX || 0;
        surface = {
          ...sampled,
          path: crossing.surfacePath,
          segmentIndex: crossing.surfaceSegmentIndex,
          amount: 0,
          distance: captureRadius,
          distanceSquared: captureRadius * captureRadius,
          surfaceDistance: crossing.surfaceDistance,
          surfaceSide: captureRadius,
        };
      }
    }
    return beginStoneSurfaceContact(surface, endPose, radius);
  }

  function updateStoneSurfaceContact(dt, steer, contact) {
    const releaseRadius =
      contact.radius * STONE_RULES.surfaceReleaseRadiusMultiplier;
    let surface = nearestStoneSurfacePoint(
      contact.wheelX,
      contact.wheelY,
      releaseRadius,
    );
    if (!surface) {
      endStoneSurfaceContact();
      game.velocity.y += motion.airGravity * dt;
      game.speed = magnitude(game.velocity.x, game.velocity.y);
      return false;
    }

    contact.path = surface.path;
    contact.clusterId = surface.path.clusterId;
    if (steer !== 0) game.stoneSurfaceDirection = steer;

    contact.velocityY += motion.airGravity * dt;
    let tangentSpeed =
      contact.velocityX * surface.unitX +
      contact.velocityY * surface.unitY;
    const accelerating = keys.up && !keys.down;
    const levelTurnScale =
      1 +
      game.growthLevel *
        activeWormScaling().stoneLocomotionScalePerLevel;
    const boostTurnScale = game.boosting ? motion.boostMultiplier : 1;
    const activeTurnScale = levelTurnScale * boostTurnScale;
    const targetSpeed = keys.down
      ? 0
      : accelerating
        ? game.stoneSurfaceDirection *
          STONE_RULES.surfaceTargetSpeed *
          activeTurnScale
        : 0;
    const traction = keys.down
      ? STONE_RULES.surfaceBrakeDeceleration * levelTurnScale
      : accelerating
        ? STONE_RULES.surfaceAcceleration * activeTurnScale
        : STONE_RULES.surfaceCoastDeceleration * levelTurnScale;
    tangentSpeed = moveToward(tangentSpeed, targetSpeed, traction * dt);
    const normalSpeed =
      contact.velocityX * surface.normalX +
      contact.velocityY * surface.normalY;
    contact.velocityX =
      surface.unitX * tangentSpeed + surface.normalX * normalSpeed;
    contact.velocityY =
      surface.unitY * tangentSpeed + surface.normalY * normalSpeed;
    contact.wheelX += contact.velocityX * dt;
    contact.wheelY += contact.velocityY * dt;

    surface = nearestStoneSurfacePoint(
      contact.wheelX,
      contact.wheelY,
      releaseRadius,
    );
    if (!surface) {
      endStoneSurfaceContact();
      game.velocity.y += motion.airGravity * dt;
      game.speed = magnitude(game.velocity.x, game.velocity.y);
      return false;
    }

    const clearance = contact.radius + STONE_RULES.collisionInset;
    if (surface.surfaceSide < clearance) {
      const correction = clearance - surface.surfaceSide;
      contact.wheelX += surface.normalX * correction;
      contact.wheelY += surface.normalY * correction;
      let inwardSpeed =
        contact.velocityX * surface.normalX +
        contact.velocityY * surface.normalY;
      if (inwardSpeed < 0) {
        const rebound =
          -inwardSpeed * STONE_RULES.surfaceRestitution;
        contact.velocityX +=
          surface.normalX * (rebound - inwardSpeed);
        contact.velocityY +=
          surface.normalY * (rebound - inwardSpeed);
        inwardSpeed = rebound;
      }
      contact.velocityX -=
        surface.normalX * inwardSpeed * STONE_RULES.surfaceNormalDamping;
      contact.velocityY -=
        surface.normalY * inwardSpeed * STONE_RULES.surfaceNormalDamping;
    }

    contact.path = surface.path;
    contact.clusterId = surface.path.clusterId;
    contact.surface = surface;
    const direction = game.stoneSurfaceDirection || 1;
    const wheelMomentum = magnitude(
      contact.velocityX,
      contact.velocityY,
    );
    const targetHeading = wheelMomentum > 1
      ? Math.atan2(contact.velocityY, contact.velocityX)
      : Math.atan2(
          surface.unitY * direction,
          surface.unitX * direction,
        );
    const headingDifference = Math.atan2(
      Math.sin(targetHeading - game.heading),
      Math.cos(targetHeading - game.heading),
    );
    const maximumHeadingChange =
      STONE_RULES.surfaceHeadTurnSpeed * activeTurnScale * dt;
    game.heading += clamp(
      headingDifference,
      -maximumHeadingChange,
      maximumHeadingChange,
    );
    const forwardX = Math.cos(game.heading);
    const forwardY = Math.sin(game.heading);

    const headOffset = wormDimension("headOffset");
    const targetHeadX = contact.wheelX - forwardX * headOffset;
    const targetHeadY = contact.wheelY - forwardY * headOffset;
    game.velocity.y += motion.airGravity * dt;
    let springAccelerationX =
      (targetHeadX - game.head.x) * STONE_RULES.surfaceHeadSpring +
      (contact.velocityX - game.velocity.x) * STONE_RULES.surfaceHeadDamping;
    let springAccelerationY =
      (targetHeadY - game.head.y) * STONE_RULES.surfaceHeadSpring +
      (contact.velocityY - game.velocity.y) * STONE_RULES.surfaceHeadDamping;
    const springMagnitude = magnitude(
      springAccelerationX,
      springAccelerationY,
    );
    if (springMagnitude > STONE_RULES.surfaceHeadMaximumAcceleration) {
      const scale =
        STONE_RULES.surfaceHeadMaximumAcceleration / springMagnitude;
      springAccelerationX *= scale;
      springAccelerationY *= scale;
    }
    game.velocity.x += springAccelerationX * dt;
    game.velocity.y += springAccelerationY * dt;
    game.speed = magnitude(game.velocity.x, game.velocity.y);
    contact.rotation += tangentSpeed / Math.max(1, contact.radius) * dt;
    return true;
  }

  function constrainHeadToStoneSurfaceContact(contact) {
    if (!contact) return;
    const visualHead = getEatHitboxPose();
    let offsetX = visualHead.x - contact.wheelX;
    let offsetY = visualHead.y - contact.wheelY;
    const distance = magnitude(offsetX, offsetY);
    const maximumLag =
      contact.radius * STONE_RULES.surfaceHeadMaximumLagMultiplier;
    if (distance <= maximumLag || distance < 0.0001) return;
    offsetX /= distance;
    offsetY /= distance;
    const correction = distance - maximumLag;
    game.head.x -= offsetX * correction;
    game.head.y -= offsetY * correction;
    const separatingVelocity =
      (game.velocity.x - contact.velocityX) * offsetX +
      (game.velocity.y - contact.velocityY) * offsetY;
    if (separatingVelocity > 0) {
      game.velocity.x -= offsetX * separatingVelocity;
      game.velocity.y -= offsetY * separatingVelocity;
    }
  }

  function sampleStoneSurfacePath(path, distance) {
    const first = path.samples[0];
    const last = path.samples[path.samples.length - 1];
    if (distance <= 0) {
      return {
        x: first.x + first.unitX * distance,
        y: first.y + first.unitY * distance,
        unitX: first.unitX,
        unitY: first.unitY,
        normalX: first.normalX,
        normalY: first.normalY,
      };
    }
    if (distance >= path.length) {
      const extension = distance - path.length;
      return {
        x: last.x + last.unitX * extension,
        y: last.y + last.unitY * extension,
        unitX: last.unitX,
        unitY: last.unitY,
        normalX: last.normalX,
        normalY: last.normalY,
      };
    }
    let low = 1;
    let high = path.samples.length - 1;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (path.samples[middle].distance < distance) low = middle + 1;
      else high = middle;
    }
    const upper = path.samples[low];
    const lower = path.samples[low - 1];
    const sectionLength = upper.distance - lower.distance;
    const amount = sectionLength > 0
      ? (distance - lower.distance) / sectionLength
      : 0;
    const tangentX = lerp(lower.unitX, upper.unitX, amount);
    const tangentY = lerp(lower.unitY, upper.unitY, amount);
    const tangentLength = magnitude(tangentX, tangentY) || 1;
    const interpolatedNormalX = lerp(lower.normalX, upper.normalX, amount);
    const interpolatedNormalY = lerp(lower.normalY, upper.normalY, amount);
    const normalLength =
      magnitude(interpolatedNormalX, interpolatedNormalY) || 1;
    return {
      x: lerp(lower.x, upper.x, amount),
      y: lerp(lower.y, upper.y, amount),
      unitX: tangentX / tangentLength,
      unitY: tangentY / tangentLength,
      normalX: interpolatedNormalX / normalLength,
      normalY: interpolatedNormalY / normalLength,
    };
  }

  function clearStoneSurfacePathExclusionWhenClear() {
    if (!game.excludedStoneSurfacePath) return;
    if (game.stoneSurfaceRelockTimer > 0) return;
    game.excludedStoneSurfacePath = null;
  }

  function resolveStoneCollision() {
    const startPose = game.previousEatHitbox || getEatHitboxPose();
    const endPose = getEatHitboxPose();
    const radius = wormDimension("collisionRadius");
    const incomingVelocity = { ...game.velocity };
    if (tryBeginStoneSurfaceContact(startPose, endPose, radius)) {
      if (game.latchAttack) {
        releaseBoostLatchAttack(true);
        game.boosting = false;
      }
      return true;
    }

    const collision = findStoneCollision(startPose, endPose, radius);
    if (!collision) return false;

    const penetrationCorrection = collision.penetration || 0;
    const contactX =
      lerp(startPose.x, endPose.x, collision.time) +
      collision.normalX *
        (STONE_RULES.collisionInset + penetrationCorrection);
    const contactY =
      lerp(startPose.y, endPose.y, collision.time) +
      collision.normalY *
        (STONE_RULES.collisionInset + penetrationCorrection);
    const headOffset = wormDimension("headOffset");
    game.head.x = contactX - Math.cos(endPose.angle) * headOffset;
    game.head.y = contactY - Math.sin(endPose.angle) * headOffset;
    const normalVelocity =
      incomingVelocity.x * collision.normalX +
      incomingVelocity.y * collision.normalY;

    endStoneSurfaceContact();
    // A penetration correction with no inward velocity must not erase
    // tangential momentum. Only the component entering the stone is bounced.
    let nextVelocityX = incomingVelocity.x;
    let nextVelocityY = incomingVelocity.y;
    if (normalVelocity < 0) {
      const tangentX = incomingVelocity.x - collision.normalX * normalVelocity;
      const tangentY = incomingVelocity.y - collision.normalY * normalVelocity;
      const bounceSpeed = -normalVelocity * STONE_RULES.bounceRetention;
      nextVelocityX =
        tangentX * STONE_RULES.tangentialRetention +
        collision.normalX * bounceSpeed;
      nextVelocityY =
        tangentY * STONE_RULES.tangentialRetention +
        collision.normalY * bounceSpeed;
    }

    if (game.latchAttack) {
      releaseBoostLatchAttack(true);
      game.boosting = false;
    }
    game.velocity.x = nextVelocityX;
    game.velocity.y = nextVelocityY;
    game.speed = magnitude(nextVelocityX, nextVelocityY);
    if (game.speed > 0.5) {
      game.heading = Math.atan2(nextVelocityY, nextVelocityX);
    }
    // The neck was already placed from the incoming head pose at contact.
    // Moving it around the same contact again after the bounce heading flips
    // shifts the worm by almost twice its head offset and looks like a
    // teleport through a thin wall.
    game.shake = Math.max(game.shake, 5.5);
    spawnParticles(contactX, contactY, 8, "stone");
    return true;
  }

  function updateHeavyTongueGrappleMovement(
    tongue,
    dt,
    pullBoosting,
  ) {
    const target = activeTongueTarget(tongue);
    if (!target) return;
    endStoneSurfaceContact();

    game.velocity.y += motion.airGravity * dt;

    const { front } = tongueHeadAnchors();
    let toTargetX = target.x - front.x;
    let toTargetY = target.y - front.y;
    let distance = magnitude(toTargetX, toTargetY);
    if (distance > 0.0001) {
      toTargetX /= distance;
      toTargetY /= distance;
    } else {
      toTargetX = Math.cos(game.heading);
      toTargetY = Math.sin(game.heading);
      distance = 0;
    }

    if (keys.up) {
      const reelSpeed =
        TONGUE_GRAPPLE_RULES.reelSpeed *
        (pullBoosting ? TONGUE_GRAPPLE_RULES.reelBoostMultiplier : 1);
      const reelDistance = reelSpeed * dt;
      tongue.grappleRopeLength = Math.max(
        0,
        tongue.grappleRopeLength - reelDistance,
      );
      tongue.grappleMaximumLength = Math.max(
        tongue.grappleRopeLength,
        tongue.grappleMaximumLength - reelDistance,
      );
    }

    const extension = distance - tongue.grappleRopeLength;
    if (extension > 0 && distance > 0.0001) {
      const radialVelocity =
        game.velocity.x * toTargetX + game.velocity.y * toTargetY;
      const outwardSpeed = Math.max(0, -radialVelocity);
      const elasticRange = Math.max(
        0.001,
        heavyTongueElasticLimit(tongue) - tongue.grappleRopeLength,
      );
      const stretchRatio = clamp(extension / elasticRange, 0, 1);
      const resistanceMultiplier =
        1 +
        TONGUE_GRAPPLE_RULES.endStretchResistance *
          stretchRatio ** 3;
      const tensionAcceleration =
        extension *
          TONGUE_GRAPPLE_RULES.springAccelerationPerPixel *
          resistanceMultiplier +
        outwardSpeed * TONGUE_GRAPPLE_RULES.radialDamping;
      game.velocity.x += toTargetX * tensionAcceleration * dt;
      game.velocity.y += toTargetY * tensionAcceleration * dt;
    }

    const maximumSpeed =
      wormMaximumSpeed() * TONGUE_GRAPPLE_RULES.maximumSpeedMultiplier;
    const speed = magnitude(game.velocity.x, game.velocity.y);
    if (speed > maximumSpeed) {
      const speedScale = maximumSpeed / speed;
      game.velocity.x *= speedScale;
      game.velocity.y *= speedScale;
    }
    game.speed = magnitude(game.velocity.x, game.velocity.y);
    if (game.speed > 0.5) {
      game.heading = Math.atan2(game.velocity.y, game.velocity.x);
    }
  }

  function constrainHeavyTongueGrapple(tongue) {
    const target = activeTongueTarget(tongue);
    if (!target) return;
    const { front } = tongueHeadAnchors();
    let outwardX = front.x - target.x;
    let outwardY = front.y - target.y;
    const distance = magnitude(outwardX, outwardY);
    if (distance > 0.0001) {
      outwardX /= distance;
      outwardY /= distance;
      tongue.grappleOutwardX = outwardX;
      tongue.grappleOutwardY = outwardY;
    } else {
      outwardX = tongue.grappleOutwardX;
      outwardY = tongue.grappleOutwardY;
    }
    // The nonlinear spring normally reverses the worm before this point. This
    // final elastic stop guarantees that even extreme momentum cannot reach
    // the tongue's true maximum length, and reflects only outward momentum so
    // tangential swing remains free.
    const maximumLength = heavyTongueElasticLimit(tongue);
    if (distance <= maximumLength || distance < 0.0001) return;

    const correction = distance - maximumLength;
    game.head.x -= outwardX * correction;
    game.head.y -= outwardY * correction;
    const outwardVelocity =
      game.velocity.x * outwardX + game.velocity.y * outwardY;
    if (outwardVelocity > 0) {
      const reboundSpeed =
        outwardVelocity * (1 + TONGUE_GRAPPLE_RULES.reboundRetention);
      game.velocity.x -= outwardX * reboundSpeed;
      game.velocity.y -= outwardY * reboundSpeed;
    }
    game.speed = magnitude(game.velocity.x, game.velocity.y);
    if (game.speed > 0.5) {
      game.heading = Math.atan2(game.velocity.y, game.velocity.x);
    }
  }

  function updateHeavyTongueGrappleBody(tongue, dt) {
    if (game.segments.length === 0) return;
    if (
      !tongue.grappleBodyVelocities ||
      tongue.grappleBodyVelocities.length !== game.segments.length
    ) {
      tongue.grappleBodyVelocities = game.segments.map(() => ({
        x: game.velocity.x,
        y: game.velocity.y,
      }));
    }

    const oldPositions = game.segments.map((segment) => ({
      x: segment.x,
      y: segment.y,
    }));
    const drag = Math.pow(TONGUE_GRAPPLE_RULES.bodyDrag, dt);
    for (let index = 1; index < game.segments.length; index += 1) {
      const velocity = tongue.grappleBodyVelocities[index];
      velocity.x *= drag;
      velocity.y = velocity.y * drag + motion.airGravity * dt;
      game.segments[index].x += velocity.x * dt;
      game.segments[index].y += velocity.y * dt;
    }

    const spacing = wormSegmentSpacing();
    for (
      let iteration = 0;
      iteration < TONGUE_GRAPPLE_RULES.bodyConstraintIterations;
      iteration += 1
    ) {
      game.segments[0].x = game.head.x;
      game.segments[0].y = game.head.y;
      for (let index = 1; index < game.segments.length; index += 1) {
        const leader = game.segments[index - 1];
        const segment = game.segments[index];
        let dx = segment.x - leader.x;
        let dy = segment.y - leader.y;
        let distance = magnitude(dx, dy);
        if (distance < 0.0001) {
          dx = -Math.cos(game.heading);
          dy = -Math.sin(game.heading);
          distance = 1;
        }
        const correction = (distance - spacing) / distance;
        if (index === 1) {
          segment.x -= dx * correction;
          segment.y -= dy * correction;
        } else {
          const halfCorrection = correction * 0.5;
          leader.x += dx * halfCorrection;
          leader.y += dy * halfCorrection;
          segment.x -= dx * halfCorrection;
          segment.y -= dy * halfCorrection;
        }
      }
    }
    game.segments[0].x = game.head.x;
    game.segments[0].y = game.head.y;

    const maximumBodySpeed =
      wormMaximumSpeed() *
      TONGUE_GRAPPLE_RULES.bodyMaximumSpeedMultiplier;
    tongue.grappleBodyVelocities.forEach((velocity, index) => {
      if (index === 0) {
        velocity.x = game.velocity.x;
        velocity.y = game.velocity.y;
        return;
      }
      const displacementX = game.segments[index].x - oldPositions[index].x;
      const displacementY = game.segments[index].y - oldPositions[index].y;
      const displacement = magnitude(displacementX, displacementY);
      const velocityScale =
        displacement > 0.0001 && dt > 0
          ? Math.min(maximumBodySpeed, displacement / dt) / displacement
          : 0;
      velocity.x = displacementX * velocityScale;
      velocity.y = displacementY * velocityScale;
    });
  }

  function updatePhysics(dt) {
    const steer = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    const radius = wormDimension("collisionRadius");
    const previousVelocityX = game.velocity.x;
    const previousVelocityY = game.velocity.y;
    game.stoneSurfaceRelockTimer = Math.max(
      0,
      game.stoneSurfaceRelockTimer - dt,
    );
    game.stoneCollisionGraceTimer = Math.max(
      0,
      game.stoneCollisionGraceTimer - dt,
    );
    if (game.stoneCollisionGraceTimer === 0) {
      game.stoneCollisionGraceClusterId = null;
    }
    game.wasInGround = game.inGround;
    game.previous.x = game.head.x;
    game.previous.y = game.head.y;
    game.previousEatHitbox = getEatHitboxPose();
    const stoneSurfaceContact = activeStoneSurfaceContact();
    const heavyTongueGrapple = activeHeavyTongueGrapple();
    let stoneSurfaceActive = false;

    if (!keys.boost) game.boostLatchReady = true;
    const latchControlHeld =
      keys.boost && !keys.down && game.boostCharge > 0;
    if (game.latchAttack && !latchControlHeld) {
      releaseBoostLatchAttack(
        true,
        game.latchAttack.phase === "biting",
      );
    }
    if (
      !game.latchAttack &&
      !heavyTongueGrapple &&
      game.boostLatchReady &&
      latchControlHeld &&
      game.inGround &&
      game.capturedTargets.length === 0
    ) {
      const latchTarget = nearestBoostLatchTarget();
      if (latchTarget) beginBoostLatchAttack(latchTarget);
    }

    const movementBoosting =
      game.inGround &&
      keys.up &&
      keys.boost &&
      !keys.down &&
      game.boostCharge > 0;
    const surfaceRollingBoosting =
      Boolean(stoneSurfaceContact) &&
      keys.up &&
      keys.boost &&
      !keys.down &&
      game.boostCharge > 0;
    const grapplePullBoosting =
      Boolean(heavyTongueGrapple) &&
      keys.up &&
      keys.boost &&
      !keys.down &&
      game.boostCharge > 0;
    game.boosting =
      Boolean(game.latchAttack) ||
      movementBoosting ||
      surfaceRollingBoosting ||
      grapplePullBoosting;
    if (game.boosting) {
      game.boostCharge = Math.max(0, game.boostCharge - dt);
    } else if (!keys.boost) {
      game.boostCharge = Math.min(
        boostCapacity(),
        game.boostCharge + BOOST_RULES.rechargeRate * dt,
      );
    }
    if (game.latchAttack && game.boostCharge <= 0) {
      releaseBoostLatchAttack(
        true,
        game.latchAttack.phase === "biting",
      );
      game.boosting = false;
    }

    if (game.latchAttack) {
      updateBoostLatchAttack(dt);
    } else if (heavyTongueGrapple) {
      updateHeavyTongueGrappleMovement(
        heavyTongueGrapple,
        dt,
        grapplePullBoosting,
      );
    } else if (game.inGround) {
      const canTurn = game.speed > 0.5;
      const speedTurnFactor = lerp(1, 0.58, clamp((game.speed - 230) / 540, 0, 1));
      if (canTurn) {
        game.heading += steer * motion.groundTurnSpeed * speedTurnFactor * dt;
      }

      const activeMaximumSpeed =
        wormMaximumSpeed() * (game.boosting ? motion.boostMultiplier : 1);
      const activeAcceleration =
        motion.acceleration * (game.boosting ? motion.boostMultiplier : 1);

      if (keys.down) {
        game.speed = Math.max(0, game.speed - motion.brakeDeceleration * dt);
      } else if (keys.up && game.speed < activeMaximumSpeed) {
        game.speed = Math.min(
          activeMaximumSpeed,
          game.speed + activeAcceleration * dt,
        );
      } else if (keys.up && game.speed > activeMaximumSpeed) {
        game.speed = Math.max(
          activeMaximumSpeed,
          game.speed - motion.coastDeceleration * dt,
        );
      } else {
        game.speed = Math.max(0, game.speed - motion.coastDeceleration * dt);
      }
      game.speed = Math.min(
        game.speed,
        wormMaximumSpeed() * motion.boostMultiplier,
      );

      game.velocity.x = Math.cos(game.heading) * game.speed;
      game.velocity.y = Math.sin(game.heading) * game.speed;
    } else if (stoneSurfaceContact) {
      stoneSurfaceActive = updateStoneSurfaceContact(
        dt,
        steer,
        stoneSurfaceContact,
      );
    } else {
      const currentSpeed = magnitude(game.velocity.x, game.velocity.y);
      if (steer !== 0 && currentSpeed > 0.5) {
        const turnForce = getLocalTurnVector(steer);
        game.velocity.x += turnForce.x * motion.airTurnForce * dt;
        game.velocity.y += turnForce.y * motion.airTurnForce * dt;
      }
      game.velocity.y += motion.airGravity * dt;
      game.speed = magnitude(game.velocity.x, game.velocity.y);
      if (game.speed > 0.5) {
        game.heading = Math.atan2(game.velocity.y, game.velocity.x);
      }
    }

    if (!game.latchAttack) {
      game.head.x += game.velocity.x * dt;
      game.head.y += game.velocity.y * dt;
    }
    if (stoneSurfaceActive) {
      constrainHeadToStoneSurfaceContact(activeStoneSurfaceContact());
    }
    if (heavyTongueGrapple && !game.latchAttack) {
      constrainHeavyTongueGrapple(heavyTongueGrapple);
    }

    // Surface contact is a dynamic wheel rather than a positional rail lock.
    // Ordinary stone collision remains active whenever that wheel has released.
    if (!activeStoneSurfaceContact()) {
      resolveStoneCollision();
    }
    clearStoneSurfacePathExclusionWhenClear();

    const minY = 22 + radius;
    const maxY = game.height - 22 - radius;

    if (game.head.y < minY) {
      game.head.y = minY;
      game.velocity.y = Math.abs(game.velocity.y) * 0.74;
      game.heading = Math.atan2(game.velocity.y, game.velocity.x);
      game.shake = Math.max(game.shake, 4);
    } else if (game.head.y > maxY) {
      game.head.y = maxY;
      game.velocity.y = -Math.abs(game.velocity.y) * 0.72;
      game.heading = Math.atan2(game.velocity.y, game.velocity.x);
      game.speed *= 0.78;
      game.shake = Math.max(game.shake, 5);
      spawnParticles(game.head.x, game.head.y, 9, "dirt");
    }

    updateTargets(dt);
    if (
      heavyTongueGrapple?.phase === "heavy-grappled" &&
      !game.latchAttack
    ) {
      // The anchor is allowed to keep moving while grappled. Re-apply the
      // elastic limit after its movement so the rendered tether cannot cross
      // the maximum between physics frames.
      constrainHeavyTongueGrapple(heavyTongueGrapple);
      updateHeavyTongueGrappleBody(heavyTongueGrapple, dt);
      if (
        grapplePullBoosting &&
        heavyTongueGrappleHeadTouchesAnchor(heavyTongueGrapple)
      ) {
        transferHeavyTongueGrappleToBite(heavyTongueGrapple);
      }
    }

    game.inGround = headIsInGround();
    if (game.inGround) {
      endStoneSurfaceContact();
    }
    eatTargetsAlongHeadPath();
    updateTongues(dt);
    updateMouthAnimation(dt);
    if (game.latchAttack?.releasePending) {
      releaseBoostLatchAttack(
        true,
        !game.latchAttack.targetDefeated,
      );
      game.boosting = false;
    }
    updateCapturedTargets(dt);
    game.transitionEffectCooldown = Math.max(0, game.transitionEffectCooldown - dt);

    if (game.wasInGround && !game.inGround) {
      if (game.transitionEffectCooldown === 0) {
        game.shake = Math.min(2.5, 0.6 + game.speed / 420);
        spawnParticles(game.head.x, game.head.y, 10, "burst");
        game.transitionEffectCooldown = 0.1;
      }
    } else if (!game.wasInGround && game.inGround) {
      game.speed = clamp(
        magnitude(game.velocity.x, game.velocity.y),
        0,
        wormMaximumSpeed() * motion.boostMultiplier,
      );
      if (game.speed > 0.5) game.heading = Math.atan2(game.velocity.y, game.velocity.x);
      if (game.transitionEffectCooldown === 0) {
        game.shake = Math.min(3, 0.8 + game.speed / 360);
        spawnParticles(game.head.x, game.head.y, 12, "burst");
        game.transitionEffectCooldown = 0.1;
      }
    }

    if (game.inGround) {
      if (game.speed > 1) {
        tunnelGroundBlocksAlongPath(
          game.previous.x,
          game.previous.y,
          game.head.x,
          game.head.y,
        );
      }
      const particleRate = keys.up ? 0.62 : 0.25;
      if (game.speed > 1 && Math.random() < particleRate) {
        spawnParticles(game.head.x, game.head.y, keys.up ? 2 : 1, "dirt");
      }
    }
    if (dt > 0) {
      game.acceleration.x = (game.velocity.x - previousVelocityX) / dt;
      game.acceleration.y = (game.velocity.y - previousVelocityY) / dt;
    } else {
      game.acceleration.x = 0;
      game.acceleration.y = 0;
    }

    if (game.latchAttack?.phase === "biting") {
      updateBoostLatchBody(dt);
    } else if (!activeHeavyTongueGrapple()) {
      if (recordHeadPath()) updateSegments();
    }
    updateAcidAbility(dt);
    updateAcidTunnelDecay();
    updateTunnelDecay();
    updateParticles(dt);
    game.shake *= Math.pow(0.0002, dt);
  }

  function traceBlockRegion(targetContext, bounds, blockType) {
    const size = game.map.cellSize;
    const startRow = clamp(Math.floor(bounds.y / size), 0, game.map.rows - 1);
    const endRow = clamp(
      Math.ceil((bounds.y + bounds.height) / size) - 1,
      0,
      game.map.rows - 1,
    );
    const startColumn = clamp(Math.floor(bounds.x / size), 0, game.map.columns - 1);
    const endColumn = clamp(
      Math.ceil((bounds.x + bounds.width) / size) - 1,
      0,
      game.map.columns - 1,
    );

    targetContext.beginPath();
    let hasMatchingTiles = false;
    for (let row = startRow; row <= endRow; row += 1) {
      const rowOffset = row * game.map.columns;
      let runStart = null;
      for (let column = startColumn; column <= endColumn + 1; column += 1) {
        const tileValue =
          column <= endColumn ? game.map.tiles[rowOffset + column] : 0;
        const matchesType =
          blockType === BLOCK_TYPES.GROUND
            ? tileValue === MATERIAL_TILE_VALUES[BLOCK_TYPES.GROUND] ||
              tileValue === TUNNELED_GROUND_TILE_VALUE
            : blockType === BLOCK_TYPES.STONE
              ? tileValue === MATERIAL_TILE_VALUES[BLOCK_TYPES.STONE]
              : tileValue === 0;
        if (matchesType) hasMatchingTiles = true;
        if (matchesType && runStart === null) runStart = column;
        if (!matchesType && runStart !== null) {
          targetContext.rect(
            runStart * size,
            row * size,
            (column - runStart) * size,
            size,
          );
          runStart = null;
        }
      }
    }
    return hasMatchingTiles;
  }

  function terrainTexturePatternVariantForBounds(bounds) {
    const chunkColumn = Math.floor(
      (bounds.x + bounds.width * 0.5) / TERRAIN_CHUNK_WIDTH,
    );
    const chunkRow = Math.floor(
      (bounds.y + bounds.height * 0.5) / TERRAIN_CHUNK_HEIGHT,
    );
    return (
      Math.abs(
        Math.imul(chunkColumn + 1, 73856093) ^
          Math.imul(chunkRow + 1, 19349663),
      ) % TERRAIN_TEXTURE_PATTERN_VARIANTS
    );
  }

  function terrainTexturePatternForBounds(targetContext, bounds, material) {
    const variant = terrainTexturePatternVariantForBounds(bounds);
    return targetContext.createPattern(
      terrainTexturePatterns[material][variant],
      "repeat",
    );
  }

  function drawSoilTexture(targetContext, bounds) {
    targetContext.save();
    if (!traceBlockRegion(targetContext, bounds, BLOCK_TYPES.GROUND)) {
      targetContext.restore();
      return null;
    }
    targetContext.clip();

    targetContext.fillStyle = palette.soil;
    targetContext.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

    const groundPattern = terrainTexturePatternForBounds(
      targetContext,
      bounds,
      BLOCK_TYPES.GROUND,
    );
    targetContext.fillStyle = groundPattern;
    targetContext.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    targetContext.restore();
    targetContext.globalAlpha = 1;
    return groundPattern;
  }

  function drawStoneTexture(targetContext, bounds) {
    targetContext.save();
    if (!traceBlockRegion(targetContext, bounds, BLOCK_TYPES.STONE)) {
      targetContext.restore();
      return;
    }
    targetContext.clip();

    targetContext.fillStyle = palette.stone;
    targetContext.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

    targetContext.fillStyle = terrainTexturePatternForBounds(
      targetContext,
      bounds,
      BLOCK_TYPES.STONE,
    );
    targetContext.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    targetContext.restore();
    targetContext.globalAlpha = 1;
  }

  function tunnelDecayLifetime(blockIndex) {
    const hash = Math.imul(blockIndex + 1, 2654435761) >>> 0;
    return (
      TUNNEL_DECAY_RULES.minimumLifetime +
      (hash % (TUNNEL_DECAY_RULES.lifetimeVariation + 1))
    );
  }

  function scheduleTunnelExpiryAt(blockIndex, expiryTick) {
    const buckets = game.map.tunnelExpiryBuckets;
    let bucket = buckets.get(expiryTick);
    if (!bucket) {
      bucket = { indices: [], cursor: 0 };
      buckets.set(expiryTick, bucket);
    }
    bucket.indices.push(blockIndex);
    game.map.nextTunnelExpiryTick = Math.min(
      game.map.nextTunnelExpiryTick,
      expiryTick,
    );
  }

  function scheduleTunnelExpiry(blockIndex) {
    scheduleTunnelExpiryAt(
      blockIndex,
      Math.ceil(game.elapsed + tunnelDecayLifetime(blockIndex)),
    );
  }

  function earliestTunnelExpiryTick() {
    let earliest = Infinity;
    game.map.tunnelExpiryBuckets.forEach((_bucket, tick) => {
      earliest = Math.min(earliest, tick);
    });
    return earliest;
  }

  function tunnelTileIsProtectedFromDecay(column, row, protectedBounds) {
    const size = game.map.cellSize;
    const centerX = nearestPeriodicWorldX(
      (column + 0.5) * size,
      game.head.x,
    );
    const centerY = (row + 0.5) * size;
    return (
      centerX >=
        protectedBounds.x - TUNNEL_DECAY_RULES.horizontalProtectionPadding &&
      centerX <=
        protectedBounds.x +
          protectedBounds.width +
          TUNNEL_DECAY_RULES.horizontalProtectionPadding &&
      centerY >=
        protectedBounds.y - TUNNEL_DECAY_RULES.verticalProtectionPadding &&
      centerY <=
        protectedBounds.y +
          protectedBounds.height +
          TUNNEL_DECAY_RULES.verticalProtectionPadding
    );
  }

  function updateTunnelDecay() {
    const buckets = game.map.tunnelExpiryBuckets;
    const currentTick = Math.floor(game.elapsed);
    if (
      buckets.size === 0 ||
      game.map.nextTunnelExpiryTick > currentTick
    ) {
      return;
    }

    const protectedBounds = getMinimapWorldBounds();
    const groundValue = MATERIAL_TILE_VALUES[BLOCK_TYPES.GROUND];
    let remainingBudget = TUNNEL_DECAY_RULES.maximumTilesPerFrame;
    let restoredTiles = 0;
    tunnelDecayChunkKeys.clear();
    tunnelDecayPlaceholderKeys.clear();

    while (
      remainingBudget > 0 &&
      game.map.nextTunnelExpiryTick <= currentTick
    ) {
      const expiryTick = game.map.nextTunnelExpiryTick;
      const bucket = buckets.get(expiryTick);
      if (!bucket) {
        game.map.nextTunnelExpiryTick = earliestTunnelExpiryTick();
        continue;
      }

      while (
        remainingBudget > 0 &&
        bucket.cursor < bucket.indices.length
      ) {
        const blockIndex = bucket.indices[bucket.cursor];
        bucket.cursor += 1;
        remainingBudget -= 1;
        if (game.map.tiles[blockIndex] !== TUNNELED_GROUND_TILE_VALUE) {
          continue;
        }

        const row = Math.floor(blockIndex / game.map.columns);
        const column = blockIndex - row * game.map.columns;
        if (tunnelTileIsProtectedFromDecay(column, row, protectedBounds)) {
          scheduleTunnelExpiryAt(
            blockIndex,
            Math.ceil(game.elapsed + TUNNEL_DECAY_RULES.visibleDeferral),
          );
          continue;
        }

        game.map.tiles[blockIndex] = groundValue;
        queueRestoredTunnelCacheInvalidation(column, row);
        restoredTiles += 1;
      }

      if (bucket.cursor >= bucket.indices.length) {
        buckets.delete(expiryTick);
      }
      game.map.nextTunnelExpiryTick = earliestTunnelExpiryTick();
    }

    if (restoredTiles > 0) {
      flushRestoredTunnelCacheInvalidations();
      game.minimapTerrainRevision += 1;
    }
  }

  function scheduleAcidTunnelDecay(blockIndex, remainingLife) {
    const expiresAt = game.elapsed + Math.max(0, remainingLife);
    const records = game.map.acidTunnelDecayRecords;
    const currentExpiry = records.get(blockIndex);
    if (currentExpiry !== undefined) {
      // Updating an existing Map key retains its original insertion order.
      records.set(blockIndex, Math.max(currentExpiry, expiresAt));
      return;
    }
    records.set(blockIndex, expiresAt);
  }

  function updateAcidTunnelDecay() {
    const records = game.map.acidTunnelDecayRecords;
    if (records.size === 0) return;

    const groundValue = MATERIAL_TILE_VALUES[BLOCK_TYPES.GROUND];
    let remainingInspectionBudget =
      ACID_RULES.maximumTunnelDecayEntriesPerFrame;
    let remainingRestorationBudget =
      ACID_RULES.maximumTunnelRestorationsPerFrame;
    let restoredTiles = 0;
    // Map iteration is insertion ordered. Stop at the first live tile whose
    // lifetime has not elapsed so no later-destroyed tile can restore first.
    for (const blockIndex of records.keys()) {
      if (
        remainingInspectionBudget <= 0 ||
        remainingRestorationBudget <= 0
      ) {
        break;
      }
      if (game.map.tiles[blockIndex] !== TUNNELED_GROUND_TILE_VALUE) {
        remainingInspectionBudget -= 1;
        records.delete(blockIndex);
        continue;
      }
      if (records.get(blockIndex) > game.elapsed + 0.000001) break;
      remainingInspectionBudget -= 1;
      records.delete(blockIndex);
      const row = Math.floor(blockIndex / game.map.columns);
      const column = blockIndex - row * game.map.columns;
      game.map.tiles[blockIndex] = groundValue;
      patchCachedRestoredGroundTile(column, row);
      remainingRestorationBudget -= 1;
      restoredTiles += 1;
    }
    if (restoredTiles > 0) game.minimapTerrainRevision += 1;
  }

  function tunnelGroundTileWithAcid(
    column,
    row,
    blockIndex,
    remainingLife,
  ) {
    const tileValue = game.map.tiles[blockIndex];
    if (tileValue === TUNNELED_GROUND_TILE_VALUE) {
      if (!game.map.acidTunnelDecayRecords.has(blockIndex)) return false;
      scheduleAcidTunnelDecay(blockIndex, remainingLife);
      return false;
    }
    if (tileValue !== MATERIAL_TILE_VALUES[BLOCK_TYPES.GROUND]) {
      return false;
    }

    game.map.tiles[blockIndex] = TUNNELED_GROUND_TILE_VALUE;
    scheduleAcidTunnelDecay(blockIndex, remainingLife);
    patchCachedTunneledGroundTile(column, row);
    return true;
  }

  function tunnelGroundTile(column, row, blockIndex) {
    if (
      game.map.tiles[blockIndex] === TUNNELED_GROUND_TILE_VALUE &&
      game.map.acidTunnelDecayRecords.has(blockIndex)
    ) {
      // A physical worm tunnel owns the longer lifetime. Removing its acid
      // record also removes it from the insertion-ordered recovery queue.
      game.map.acidTunnelDecayRecords.delete(blockIndex);
      scheduleTunnelExpiry(blockIndex);
      game.minimapTerrainRevision += 1;
      patchCachedTunneledGroundTile(column, row);
      return true;
    }
    if (
      game.map.tiles[blockIndex] !==
      MATERIAL_TILE_VALUES[BLOCK_TYPES.GROUND]
    ) {
      return false;
    }

    game.map.tiles[blockIndex] = TUNNELED_GROUND_TILE_VALUE;
    scheduleTunnelExpiry(blockIndex);
    game.minimapTerrainRevision += 1;
    patchCachedTunneledGroundTile(column, row);
    return true;
  }

  function squaredDistanceToSegment(x, y, startX, startY, endX, endY) {
    const segmentX = endX - startX;
    const segmentY = endY - startY;
    const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;
    if (segmentLengthSquared <= 0.000001) {
      const offsetX = x - startX;
      const offsetY = y - startY;
      return offsetX * offsetX + offsetY * offsetY;
    }
    const amount = clamp(
      ((x - startX) * segmentX + (y - startY) * segmentY) /
        segmentLengthSquared,
      0,
      1,
    );
    const offsetX = x - (startX + segmentX * amount);
    const offsetY = y - (startY + segmentY * amount);
    return offsetX * offsetX + offsetY * offsetY;
  }

  function tunnelGroundBlocksAlongPath(startX, startY, endX, endY) {
    const size = game.map.cellSize;
    const tunnelRadius = wormDimension("headRadius");
    const tunnelRadiusSquared = tunnelRadius * tunnelRadius;
    const minColumn = Math.floor(
      (Math.min(startX, endX) - tunnelRadius) / size,
    );
    const maxColumn = Math.floor(
      (Math.max(startX, endX) + tunnelRadius) / size,
    );
    const minRow = clamp(
      Math.floor((Math.min(startY, endY) - tunnelRadius) / size),
      0,
      game.map.rows - 1,
    );
    const maxRow = clamp(
      Math.floor((Math.max(startY, endY) + tunnelRadius) / size),
      0,
      game.map.rows - 1,
    );

    for (let row = minRow; row <= maxRow; row += 1) {
      const rowOffset = row * game.map.columns;
      for (let column = minColumn; column <= maxColumn; column += 1) {
        const wrappedColumn = wrapWorldColumn(column);
        const blockIndex = rowOffset + wrappedColumn;
        // Ordinary tunnels are inert. A short-lived acid tunnel remains a
        // candidate so the worm can promote it to the normal long lifetime.
        const tileValue = game.map.tiles[blockIndex];
        const acidOwnedTunnel =
          tileValue === TUNNELED_GROUND_TILE_VALUE &&
          game.map.acidTunnelDecayRecords.has(blockIndex);
        if (
          tileValue !== MATERIAL_TILE_VALUES[BLOCK_TYPES.GROUND] &&
          !acidOwnedTunnel
        ) {
          continue;
        }
        const centerX = column * size + size * 0.5;
        const centerY = row * size + size * 0.5;
        if (
          squaredDistanceToSegment(
            centerX,
            centerY,
            startX,
            startY,
            endX,
            endY,
          ) <= tunnelRadiusSquared
        ) {
          tunnelGroundTile(wrappedColumn, row, blockIndex);
        }
      }
    }
  }

  function resetTunneledGroundBlocks() {
    const buckets = game.map.tunnelExpiryBuckets;
    const acidRecords = game.map.acidTunnelDecayRecords;
    if (buckets.size === 0 && acidRecords.size === 0) {
      return;
    }
    let restoredTiles = 0;
    buckets.forEach((bucket) => {
      for (
        let index = bucket.cursor;
        index < bucket.indices.length;
        index += 1
      ) {
        const blockIndex = bucket.indices[index];
        if (game.map.tiles[blockIndex] === TUNNELED_GROUND_TILE_VALUE) {
          game.map.tiles[blockIndex] =
            MATERIAL_TILE_VALUES[BLOCK_TYPES.GROUND];
          restoredTiles += 1;
        }
      }
    });
    acidRecords.forEach((_expiresAt, blockIndex) => {
      if (game.map.tiles[blockIndex] === TUNNELED_GROUND_TILE_VALUE) {
        game.map.tiles[blockIndex] =
          MATERIAL_TILE_VALUES[BLOCK_TYPES.GROUND];
        restoredTiles += 1;
      }
    });
    buckets.clear();
    game.map.nextTunnelExpiryTick = Infinity;
    acidRecords.clear();
    if (restoredTiles === 0) return;
    game.minimapTerrainRevision += 1;
    // Cached chunks contain the one-time dark paint. Reset is infrequent, so
    // rebuilding them lazily is cheaper and simpler than repainting every
    // restored tile individually.
    rebuildTerrainLayer();
  }

  function tileValueAtGrid(column, row) {
    if (
      game.map.columns <= 0 ||
      row < 0 ||
      row >= game.map.rows
    ) {
      return 0;
    }
    return game.map.tiles[
      row * game.map.columns + wrapWorldColumn(column)
    ];
  }

  function groundTileValue(tileValue) {
    return (
      tileValue === MATERIAL_TILE_VALUES[BLOCK_TYPES.GROUND] ||
      tileValue === TUNNELED_GROUND_TILE_VALUE
    );
  }

  function appendTerrainDepthEdge(depthPath, startX, startY, endX, endY) {
    if (!depthPath) return;
    depthPath.path.moveTo(startX, startY);
    depthPath.path.lineTo(endX, endY);
    depthPath.hasEdges = true;
  }

  function drawGroundEdges(targetContext, column, row, depthPath = null) {
    const size = game.map.cellSize;
    const x = column * size;
    const y = row * size;
    const isExposed = (neighborColumn, neighborRow) => {
      const neighbor = tileValueAtGrid(neighborColumn, neighborRow);
      return neighbor === 0;
    };

    if (isExposed(column, row - 1)) {
      appendTerrainDepthEdge(depthPath, x, y, x + size, y);
      targetContext.fillStyle = palette.ink;
      targetContext.fillRect(x, y, size, 5);
    }
    targetContext.fillStyle = palette.ink;
    if (isExposed(column - 1, row)) {
      appendTerrainDepthEdge(depthPath, x, y, x, y + size);
      targetContext.fillRect(x, y, 3, size);
    }
    if (isExposed(column + 1, row)) {
      appendTerrainDepthEdge(depthPath, x + size, y, x + size, y + size);
      targetContext.fillRect(x + size - 3, y, 3, size);
    }
    if (isExposed(column, row + 1)) {
      appendTerrainDepthEdge(depthPath, x, y + size, x + size, y + size);
      targetContext.fillRect(x, y + size - 3, size, 3);
    }
  }

  function paintTunneledGroundTile(
    targetContext,
    column,
    row,
    depthPath = null,
  ) {
    const size = game.map.cellSize;
    targetContext.fillStyle = palette.tunneledSoil;
    targetContext.fillRect(
      column * size,
      row * size,
      size,
      size,
    );
    drawGroundEdges(targetContext, column, row, depthPath);
  }

  function paintAcidTunneledGroundTile(
    targetContext,
    column,
    row,
    depthPath = null,
  ) {
    const size = game.map.cellSize;
    targetContext.save();
    targetContext.globalAlpha *= ACID_TUNNEL_TEXTURE_OPACITY;
    targetContext.fillStyle = palette.tunneledSoil;
    targetContext.fillRect(
      column * size,
      row * size,
      size,
      size,
    );
    targetContext.restore();
    drawGroundEdges(targetContext, column, row, depthPath);
  }

  function drawStoneEdges(targetContext, column, row, depthPath = null) {
    const size = game.map.cellSize;
    const x = column * size;
    const y = row * size;
    const neighborValue = (neighborColumn, neighborRow) =>
      tileValueAtGrid(neighborColumn, neighborRow);
    const stoneValue = MATERIAL_TILE_VALUES[BLOCK_TYPES.STONE];
    const topNeighbor = neighborValue(column, row - 1);
    const leftNeighbor = neighborValue(column - 1, row);
    const rightNeighbor = neighborValue(column + 1, row);
    const bottomNeighbor = neighborValue(column, row + 1);

    targetContext.fillStyle = palette.stoneDark;
    if (topNeighbor !== stoneValue) {
      if (topNeighbor === 0) {
        appendTerrainDepthEdge(depthPath, x, y, x + size, y);
      }
      targetContext.fillRect(x, y, size, 2);
      targetContext.fillStyle = palette.stoneLight;
      targetContext.fillRect(x, y + 2, size, 1);
      targetContext.fillStyle = palette.stoneDark;
    }
    if (leftNeighbor !== stoneValue) {
      if (leftNeighbor === 0) {
        appendTerrainDepthEdge(depthPath, x, y, x, y + size);
      }
      targetContext.fillRect(x, y, 2, size);
    }
    if (rightNeighbor !== stoneValue) {
      if (rightNeighbor === 0) {
        appendTerrainDepthEdge(depthPath, x + size, y, x + size, y + size);
      }
      targetContext.fillRect(x + size - 2, y, 2, size);
    }
    if (bottomNeighbor !== stoneValue) {
      if (bottomNeighbor === 0) {
        appendTerrainDepthEdge(depthPath, x, y + size, x + size, y + size);
      }
      targetContext.fillRect(x, y + size - 2, size, 2);
    }
  }

  function forEachTileInBounds(bounds, padding, callback) {
    const size = game.map.cellSize;
    const startColumn = clamp(
      Math.floor(bounds.x / size) - padding,
      0,
      game.map.columns - 1,
    );
    const endColumn = clamp(
      Math.ceil((bounds.x + bounds.width) / size) - 1 + padding,
      0,
      game.map.columns - 1,
    );
    const startRow = clamp(
      Math.floor(bounds.y / size) - padding,
      0,
      game.map.rows - 1,
    );
    const endRow = clamp(
      Math.ceil((bounds.y + bounds.height) / size) - 1 + padding,
      0,
      game.map.rows - 1,
    );

    for (let row = startRow; row <= endRow; row += 1) {
      const rowOffset = row * game.map.columns;
      for (let column = startColumn; column <= endColumn; column += 1) {
        callback(game.map.tiles[rowOffset + column], column, row);
      }
    }
  }

  function terrainChunkRenderScale() {
    return cameraZoom() <= TERRAIN_CHUNK_LOW_DETAIL_ZOOM
      ? TERRAIN_CHUNK_LOW_DETAIL_SCALE
      : 1;
  }

  function terrainChunkKey(column, row, renderScale) {
    return `${column}:${row}:${renderScale}`;
  }

  function terrainChunkBounds(column, row) {
    const x = column * TERRAIN_CHUNK_WIDTH;
    const y = row * TERRAIN_CHUNK_HEIGHT;
    return {
      x,
      y,
      width: Math.min(TERRAIN_CHUNK_WIDTH, game.width - x),
      height: Math.min(TERRAIN_CHUNK_HEIGHT, game.height - y),
    };
  }

  function createTerrainChunk(
    column,
    row,
    renderScale = terrainChunkRenderScale(),
  ) {
    const bounds = terrainChunkBounds(column, row);
    const renderBounds = {
      x: Math.max(0, bounds.x - TERRAIN_CHUNK_BLEED),
      y: Math.max(0, bounds.y - TERRAIN_CHUNK_BLEED),
      width: 0,
      height: 0,
    };
    renderBounds.width =
      Math.min(game.width, bounds.x + bounds.width + TERRAIN_CHUNK_BLEED) -
      renderBounds.x;
    renderBounds.height =
      Math.min(game.height, bounds.y + bounds.height + TERRAIN_CHUNK_BLEED) -
      renderBounds.y;
    const terrainCanvas = document.createElement("canvas");
    terrainCanvas.width = Math.ceil(renderBounds.width * renderScale);
    terrainCanvas.height = Math.ceil(renderBounds.height * renderScale);
    const terrainContext = terrainCanvas.getContext("2d");
    terrainContext.scale(renderScale, renderScale);
    terrainContext.translate(-renderBounds.x, -renderBounds.y);
    const depthPaths = {
      [BLOCK_TYPES.GROUND]: { path: new Path2D(), hasEdges: false },
      [BLOCK_TYPES.STONE]: { path: new Path2D(), hasEdges: false },
    };

    const groundPattern = drawSoilTexture(terrainContext, renderBounds);
    drawStoneTexture(terrainContext, renderBounds);
    forEachTileInBounds(renderBounds, 1, (tileValue, tileColumn, tileRow) => {
      if (groundTileValue(tileValue)) {
        if (tileValue === TUNNELED_GROUND_TILE_VALUE) {
          const acidOwned = game.map.acidTunnelDecayRecords.has(
            tileRow * game.map.columns + tileColumn,
          );
          const paintTunnel = acidOwned
            ? paintAcidTunneledGroundTile
            : paintTunneledGroundTile;
          paintTunnel(
            terrainContext,
            tileColumn,
            tileRow,
            depthPaths[BLOCK_TYPES.GROUND],
          );
        } else {
          drawGroundEdges(
            terrainContext,
            tileColumn,
            tileRow,
            depthPaths[BLOCK_TYPES.GROUND],
          );
        }
      } else if (tileValue === MATERIAL_TILE_VALUES[BLOCK_TYPES.STONE]) {
        drawStoneEdges(
          terrainContext,
          tileColumn,
          tileRow,
          depthPaths[BLOCK_TYPES.STONE],
        );
      }
    });

    return {
      column,
      row,
      bounds,
      renderBounds,
      canvas: terrainCanvas,
      context: terrainContext,
      depthPaths,
      groundPattern,
      renderScale,
    };
  }

  function buildTerrainChunkForCache(column, row, renderScale) {
    const buildStart = performance.now();
    const chunk = createTerrainChunk(column, row, renderScale);
    const buildDuration = performance.now() - buildStart;
    game.terrainChunkBuildEstimateMs = lerp(
      game.terrainChunkBuildEstimateMs,
      clamp(buildDuration, 0.5, 24),
      0.2,
    );
    noteDevProfilerTerrainBuild(buildDuration);
    game.terrainPlaceholderChunks.delete(`${column}:${row}`);
    return chunk;
  }

  function createTerrainPlaceholderChunk(column, row) {
    const bounds = terrainChunkBounds(column, row);
    const size = game.map.cellSize;
    const pixelWidth = Math.ceil(bounds.width / size);
    const pixelHeight = Math.ceil(bounds.height / size);
    const placeholderCanvas = document.createElement("canvas");
    placeholderCanvas.width = pixelWidth;
    placeholderCanvas.height = pixelHeight;
    const placeholderContext = placeholderCanvas.getContext("2d");
    const imageData = placeholderContext.createImageData(
      pixelWidth,
      pixelHeight,
    );
    const startColumn = Math.floor(bounds.x / size);
    const startRow = Math.floor(bounds.y / size);

    for (let y = 0; y < pixelHeight; y += 1) {
      const tileRow = startRow + y;
      const rowOffset = tileRow * game.map.columns;
      for (let x = 0; x < pixelWidth; x += 1) {
        const blockIndex = rowOffset + startColumn + x;
        const tileValue = game.map.tiles[blockIndex];
        const color =
          tileValue === MATERIAL_TILE_VALUES[BLOCK_TYPES.GROUND]
            ? MINIMAP_COLORS.ground
            : tileValue === MATERIAL_TILE_VALUES[BLOCK_TYPES.STONE]
              ? MINIMAP_COLORS.stone
              : tileValue === TUNNELED_GROUND_TILE_VALUE
                ? game.map.acidTunnelDecayRecords.has(blockIndex)
                  ? MINIMAP_COLORS.acidTunneled
                  : MINIMAP_COLORS.tunneled
                : null;
        if (!color) continue;
        const pixel = (y * pixelWidth + x) * 4;
        imageData.data[pixel] = color[0];
        imageData.data[pixel + 1] = color[1];
        imageData.data[pixel + 2] = color[2];
        imageData.data[pixel + 3] = 255;
      }
    }
    placeholderContext.putImageData(imageData, 0, 0);

    return {
      column,
      row,
      bounds,
      renderBounds: bounds,
      canvas: placeholderCanvas,
      depthPaths: {
        [BLOCK_TYPES.GROUND]: { path: new Path2D(), hasEdges: false },
        [BLOCK_TYPES.STONE]: { path: new Path2D(), hasEdges: false },
      },
      renderScale: 0,
      placeholder: true,
    };
  }

  function getTerrainPlaceholderChunk(column, row) {
    const key = `${column}:${row}`;
    let chunk = game.terrainPlaceholderChunks.get(key);
    if (!chunk) {
      chunk = createTerrainPlaceholderChunk(column, row);
      game.terrainPlaceholderChunks.set(key, chunk);
    }
    return chunk;
  }

  function getCachedTerrainChunkAtScale(column, row, renderScale) {
    const key = terrainChunkKey(column, row, renderScale);
    const chunk = game.terrainChunks.get(key);
    if (!chunk) return null;

    // Touch the entry so a depth-only chunk that is contributing to the
    // current frame is not selected as the oldest cache eviction candidate.
    game.terrainChunks.delete(key);
    game.terrainChunks.set(key, chunk);
    chunk.visibleTerrainFrame = game.visibleTerrainFrame;
    return chunk;
  }

  function getCachedTerrainChunk(column, row) {
    return getCachedTerrainChunkAtScale(
      column,
      row,
      terrainChunkRenderScale(),
    );
  }

  function getCachedTerrainFallbackChunk(column, row) {
    const currentRenderScale = terrainChunkRenderScale();
    for (const renderScale of TERRAIN_CHUNK_RENDER_SCALES) {
      if (renderScale === currentRenderScale) continue;
      const chunk = getCachedTerrainChunkAtScale(column, row, renderScale);
      if (chunk) return chunk;
    }
    return null;
  }

  function trimTerrainChunkCache(cacheLimit) {
    const currentRenderScale = terrainChunkRenderScale();
    if (game.terrainChunks.size <= cacheLimit) return;

    const protectedPrefetchKeys = new Set();
    if (game.terrainChunkColumnCount > 0) {
      game.terrainPrefetchCandidates.forEach((candidate) => {
        const column = candidate % game.terrainChunkColumnCount;
        const row = Math.floor(candidate / game.terrainChunkColumnCount);
        protectedPrefetchKeys.add(
          terrainChunkKey(column, row, currentRenderScale),
        );
      });
    }
    for (const [key, chunk] of game.terrainChunks) {
      if (game.terrainChunks.size <= cacheLimit) break;
      if (chunk.visibleTerrainFrame === game.visibleTerrainFrame) continue;
      if (protectedPrefetchKeys.has(key)) continue;
      game.terrainChunks.delete(key);
      noteDevProfilerTerrainEviction();
    }
    // A sudden teleport or direction reversal can temporarily make the live
    // view plus its old and new look-ahead sets exceed the limit. Preserve the
    // current view, but allow the oldest predicted entry to yield rather than
    // letting the cache grow without bound.
    for (const [key, chunk] of game.terrainChunks) {
      if (game.terrainChunks.size <= cacheLimit) break;
      if (chunk.visibleTerrainFrame === game.visibleTerrainFrame) continue;
      game.terrainChunks.delete(key);
      noteDevProfilerTerrainEviction();
    }
  }

  function appendTerrainPrefetchColumn(column, startRow, endRow, columnCount) {
    const physicalColumn = positiveModulo(column, columnCount);
    const center = Math.floor((startRow + endRow) * 0.5);
    for (let offset = 0; offset <= endRow - startRow; offset += 1) {
      const upperRow = center - offset;
      const lowerRow = center + offset;
      if (upperRow >= startRow) {
        game.terrainPrefetchCandidates.push(
          upperRow * columnCount + physicalColumn,
        );
      }
      if (offset > 0 && lowerRow <= endRow) {
        game.terrainPrefetchCandidates.push(
          lowerRow * columnCount + physicalColumn,
        );
      }
    }
  }

  function appendTerrainPrefetchRow(row, startColumn, endColumn, columnCount) {
    const center = Math.floor((startColumn + endColumn) * 0.5);
    for (let offset = 0; offset <= endColumn - startColumn; offset += 1) {
      const leftColumn = center - offset;
      const rightColumn = center + offset;
      if (leftColumn >= startColumn) {
        game.terrainPrefetchCandidates.push(
          row * columnCount + positiveModulo(leftColumn, columnCount),
        );
      }
      if (offset > 0 && rightColumn <= endColumn) {
        game.terrainPrefetchCandidates.push(
          row * columnCount + positiveModulo(rightColumn, columnCount),
        );
      }
    }
  }

  function updateTerrainPrefetchCandidates(
    visible,
    startColumn,
    endColumn,
    startRow,
    endRow,
  ) {
    game.terrainPrefetchCandidates.length = 0;
    game.terrainPrefetchDirectionalCount = 0;
    const columnCount = Math.ceil(game.width / TERRAIN_CHUNK_WIDTH);
    const rowCount = Math.ceil(game.height / TERRAIN_CHUNK_HEIGHT);
    game.terrainChunkColumnCount = columnCount;
    const movingFastEnoughToPredict =
      magnitude(game.velocity.x, game.velocity.y) >=
      TERRAIN_PREFETCH_MINIMUM_SPEED;

    if (!movingFastEnoughToPredict) return 0;

    const horizontalDirection = Math.sign(game.velocity.x);
    const verticalDirection = Math.sign(game.velocity.y);
    const nextColumn = horizontalDirection > 0
      ? endColumn + 1
      : startColumn - 1;
    const nextRow = verticalDirection > 0 ? endRow + 1 : startRow - 1;
    let horizontalTime = Infinity;
    let verticalTime = Infinity;

    if (Math.abs(game.velocity.x) >= TERRAIN_PREFETCH_MINIMUM_SPEED) {
      const distance = horizontalDirection > 0
        ? nextColumn * TERRAIN_CHUNK_WIDTH - (visible.x + visible.width)
        : visible.x - (nextColumn + 1) * TERRAIN_CHUNK_WIDTH;
      horizontalTime = Math.max(0, distance) / Math.abs(game.velocity.x);
    }
    if (
      Math.abs(game.velocity.y) >= TERRAIN_PREFETCH_MINIMUM_SPEED &&
      nextRow >= 0 &&
      nextRow < rowCount
    ) {
      const distance = verticalDirection > 0
        ? nextRow * TERRAIN_CHUNK_HEIGHT - (visible.y + visible.height)
        : visible.y - (nextRow + 1) * TERRAIN_CHUNK_HEIGHT;
      verticalTime = Math.max(0, distance) / Math.abs(game.velocity.y);
    }

    if (horizontalTime <= verticalTime) {
      if (Number.isFinite(horizontalTime)) {
        appendTerrainPrefetchColumn(
          nextColumn,
          startRow,
          endRow,
          columnCount,
        );
      }
      if (Number.isFinite(verticalTime)) {
        appendTerrainPrefetchRow(
          nextRow,
          startColumn,
          endColumn,
          columnCount,
        );
      }
    } else {
      if (Number.isFinite(verticalTime)) {
        appendTerrainPrefetchRow(
          nextRow,
          startColumn,
          endColumn,
          columnCount,
        );
      }
      if (Number.isFinite(horizontalTime)) {
        appendTerrainPrefetchColumn(
          nextColumn,
          startRow,
          endRow,
          columnCount,
        );
      }
    }
    if (Number.isFinite(horizontalTime) && Number.isFinite(verticalTime)) {
      game.terrainPrefetchCandidates.push(
        nextRow * columnCount + positiveModulo(nextColumn, columnCount),
      );
    }
    const directionalCandidateCount = game.terrainPrefetchCandidates.length;
    game.terrainPrefetchDirectionalCount = directionalCandidateCount;

    // Directional candidates above are warmed first. Retain the rest of a
    // complete one-chunk border as well so a jump, reversal, or sharp turn
    // does not discard one side merely to regenerate it moments later. The
    // full border is limited to the half-resolution renderer: full-resolution
    // chunks consume four times the canvas memory, while their much slower
    // level-zero movement leaves ample time to warm the predicted entry edge.
    if (terrainChunkRenderScale() >= 1) return directionalCandidateCount;

    const marginStartColumn = startColumn - 1;
    const marginEndColumn = endColumn + 1;
    const marginStartRow = Math.max(0, startRow - 1);
    const marginEndRow = Math.min(rowCount - 1, endRow + 1);
    for (let row = marginStartRow; row <= marginEndRow; row += 1) {
      for (
        let column = marginStartColumn;
        column <= marginEndColumn;
        column += 1
      ) {
        if (
          column >= startColumn &&
          column <= endColumn &&
          row >= startRow &&
          row <= endRow
        ) {
          continue;
        }
        game.terrainPrefetchCandidates.push(
          row * columnCount + positiveModulo(column, columnCount),
        );
      }
    }
    return directionalCandidateCount;
  }

  function terrainPrefetchFrameBudget() {
    if (game.fpsLimit > 0) return 1000 / game.fpsLimit;
    if (game.fps > 1) {
      return Math.min(DEV_PROFILER_DEFAULT_BUDGET, 1000 / game.fps);
    }
    return DEV_PROFILER_DEFAULT_BUDGET;
  }

  function prefetchTerrainChunk(spareAnimationFrame = false) {
    if (
      !game.started ||
      game.paused ||
      game.menuOpen ||
      wormPainter.open ||
      game.terrainPrefetchCandidates.length === 0
    ) {
      return;
    }
    const renderScale = terrainChunkRenderScale();
    let selectedCandidate = null;
    let selectedCandidateIndex = -1;
    for (
      let index = 0;
      index < game.terrainPrefetchCandidates.length;
      index += 1
    ) {
      const candidate = game.terrainPrefetchCandidates[index];
      const column = candidate % game.terrainChunkColumnCount;
      const row = Math.floor(candidate / game.terrainChunkColumnCount);
      const key = terrainChunkKey(column, row, renderScale);
      if (game.terrainChunks.has(key)) continue;
      selectedCandidate = { column, row, key };
      selectedCandidateIndex = index;
      break;
    }
    if (!selectedCandidate) return;

    const directionalLookAhead =
      selectedCandidateIndex < game.terrainPrefetchDirectionalCount;
    const budget = terrainPrefetchFrameBudget();
    if (
      !directionalLookAhead &&
      !spareAnimationFrame &&
      game.lastFrameWorkDuration > 0 &&
      game.lastFrameWorkDuration +
          game.terrainChunkBuildEstimateMs +
          TERRAIN_PREFETCH_FRAME_RESERVE >
        budget
    ) {
      return;
    }

    // A predicted entry strip is mandatory look-ahead. Building exactly one
    // chunk now is preferable to waiting until the strip enters view and then
    // synchronously building every missing chunk in the same render frame.
    const chunk = buildTerrainChunkForCache(
      selectedCandidate.column,
      selectedCandidate.row,
      renderScale,
    );
    chunk.visibleTerrainFrame = -1;
    game.terrainChunks.set(selectedCandidate.key, chunk);
    trimTerrainChunkCache(game.terrainCacheLimit);
  }

  function rebuildTerrainLayer() {
    game.terrainChunks.clear();
    game.terrainPlaceholderChunks.clear();
    game.terrainPrefetchCandidates.length = 0;
    game.terrainPrefetchDirectionalCount = 0;
    terrainLayerRenderState.drawItems = [];
  }

  function releaseTerrainChunks() {
    game.terrainChunks.forEach((chunk) => {
      chunk.canvas.width = 1;
      chunk.canvas.height = 1;
    });
    game.terrainPlaceholderChunks.forEach((chunk) => {
      chunk.canvas.width = 1;
      chunk.canvas.height = 1;
    });
    game.terrainChunks.clear();
    game.terrainPlaceholderChunks.clear();
    game.terrainPrefetchCandidates.length = 0;
    game.terrainPrefetchDirectionalCount = 0;
    game.terrainChunkColumnCount = 0;
    terrainLayerRenderState.drawItems = [];
  }

  function unloadLevel() {
    clearControlKeys();
    cancelSpitterPointer();
    clearAcidParticles();
    releaseTerrainChunks();
    game.levelLoaded = false;
    gameShell.dataset.levelLoaded = "false";
    game.started = false;
    game.paused = false;
    gameShell.dataset.paused = "false";
    game.activeWorldId = null;
    game.activeWorldName = "";
    game.clouds = [];
    game.targets = [];
    game.capturedTargets = [];
    game.totalTargets = 0;
    game.particles = [];
    game.tongues = [];
    game.latchAttack = null;
    game.onStoneSurface = false;
    game.stoneSurfaceContact = null;
    gameShell.dataset.stoneSurface = "false";
    game.segments = [];
    game.bodyPath = [];
    game.bodyPathStartIndex = 0;
    game.map = {
      cellSize: BLOCK_SIZE,
      columns: 0,
      rows: 0,
      tiles: new Uint8Array(0),
      tunnelExpiryBuckets: new Map(),
      nextTunnelExpiryTick: Infinity,
      acidTunnelDecayRecords: new Map(),
      stoneClusterIds: null,
      stoneClusters: [],
      stoneDistanceField: null,
      stoneSurfacePaths: [],
      stoneSurfaceSegmentsByColumn: [],
      targetCandidateSummaries: new Map(),
    };
    minimapState.ready = false;
    minimapState.lastRefreshTime = 0;
    minimapContext.fillStyle = palette.ink;
    minimapContext.fillRect(
      0,
      0,
      MINIMAP_RULES.width,
      MINIMAP_RULES.height,
    );
  }

  function showHomeScreen() {
    if (game.levelLoaded) unloadLevel();
    else gameShell.dataset.levelLoaded = "false";
    toggleDevMenu(false);
    gameMenu.classList.remove("visible");
    gameMenu.setAttribute("aria-hidden", "true");
    mainMenuButton.setAttribute("aria-expanded", "false");
    enemyInfo.classList.remove("visible");
    enemyInfo.setAttribute("aria-hidden", "true");
    worldSelect.classList.remove("visible");
    worldSelect.setAttribute("aria-hidden", "true");
    wormTypeSelect.classList.remove("visible");
    wormTypeSelect.setAttribute("aria-hidden", "true");
    game.homeOpen = true;
    game.menuOpen = true;
    gameShell.classList.add("home-active");
    homeScreen.classList.add("visible");
    homeScreen.setAttribute("aria-hidden", "false");
    updateActiveWormTypeLabels();
    updateSelectedWorldLabel();
    render();
  }

  function forEachTerrainChunkOverlappingTile(column, row, callback) {
    const size = game.map.cellSize;
    const x = column * size;
    const y = row * size;
    const right = x + size;
    const bottom = y + size;
    const epsilon = 0.001;
    const startChunkColumn = Math.max(
      0,
      Math.floor((x - TERRAIN_CHUNK_BLEED) / TERRAIN_CHUNK_WIDTH),
    );
    const endChunkColumn = Math.min(
      Math.ceil(game.width / TERRAIN_CHUNK_WIDTH) - 1,
      Math.floor(
        (right + TERRAIN_CHUNK_BLEED - epsilon) / TERRAIN_CHUNK_WIDTH,
      ),
    );
    const startChunkRow = Math.max(
      0,
      Math.floor((y - TERRAIN_CHUNK_BLEED) / TERRAIN_CHUNK_HEIGHT),
    );
    const endChunkRow = Math.min(
      Math.ceil(game.height / TERRAIN_CHUNK_HEIGHT) - 1,
      Math.floor(
        (bottom + TERRAIN_CHUNK_BLEED - epsilon) / TERRAIN_CHUNK_HEIGHT,
      ),
    );

    for (
      let chunkRow = startChunkRow;
      chunkRow <= endChunkRow;
      chunkRow += 1
    ) {
      for (
        let chunkColumn = startChunkColumn;
        chunkColumn <= endChunkColumn;
        chunkColumn += 1
      ) {
        callback(chunkColumn, chunkRow);
      }
    }
  }

  function terrainPlaceholderKeyForTile(column, row) {
    const placeholderColumn = Math.floor(
      (column * game.map.cellSize) / TERRAIN_CHUNK_WIDTH,
    );
    const placeholderRow = Math.floor(
      (row * game.map.cellSize) / TERRAIN_CHUNK_HEIGHT,
    );
    return `${placeholderColumn}:${placeholderRow}`;
  }

  function queueRestoredTunnelCacheInvalidation(column, row) {
    tunnelDecayPlaceholderKeys.add(
      terrainPlaceholderKeyForTile(column, row),
    );
    if (game.terrainChunks.size === 0) return;
    forEachTerrainChunkOverlappingTile(column, row, (chunkColumn, chunkRow) => {
      for (const renderScale of TERRAIN_CHUNK_RENDER_SCALES) {
        tunnelDecayChunkKeys.add(
          terrainChunkKey(chunkColumn, chunkRow, renderScale),
        );
      }
    });
  }

  function flushRestoredTunnelCacheInvalidations() {
    tunnelDecayPlaceholderKeys.forEach((key) => {
      game.terrainPlaceholderChunks.delete(key);
    });
    tunnelDecayChunkKeys.forEach((key) => {
      game.terrainChunks.delete(key);
    });
    tunnelDecayPlaceholderKeys.clear();
    tunnelDecayChunkKeys.clear();
  }

  function patchCachedTunneledGroundTile(column, row) {
    game.terrainPlaceholderChunks.delete(
      terrainPlaceholderKeyForTile(column, row),
    );
    if (game.terrainChunks.size === 0) return;
    const blockIndex = row * game.map.columns + column;
    const paintTunnel = game.map.acidTunnelDecayRecords.has(blockIndex)
      ? paintAcidTunneledGroundTile
      : paintTunneledGroundTile;
    forEachTerrainChunkOverlappingTile(column, row, (chunkColumn, chunkRow) => {
      for (const renderScale of TERRAIN_CHUNK_RENDER_SCALES) {
        const chunk = game.terrainChunks.get(
          terrainChunkKey(chunkColumn, chunkRow, renderScale),
        );
        if (!chunk) continue;
        chunk.context.save();
        chunk.context.globalAlpha = 1;
        paintTunnel(chunk.context, column, row);
        chunk.context.restore();
      }
    });
  }

  function patchCachedRestoredGroundTile(column, row) {
    game.terrainPlaceholderChunks.delete(
      terrainPlaceholderKeyForTile(column, row),
    );
    if (game.terrainChunks.size === 0) return;
    const size = game.map.cellSize;
    const x = column * size;
    const y = row * size;
    forEachTerrainChunkOverlappingTile(column, row, (chunkColumn, chunkRow) => {
      for (const renderScale of TERRAIN_CHUNK_RENDER_SCALES) {
        const chunk = game.terrainChunks.get(
          terrainChunkKey(chunkColumn, chunkRow, renderScale),
        );
        if (!chunk) continue;
        chunk.context.save();
        chunk.context.globalAlpha = 1;
        chunk.context.fillStyle = palette.soil;
        chunk.context.fillRect(x, y, size, size);
        chunk.context.fillStyle =
          chunk.groundPattern ||
          terrainTexturePatternForBounds(
            chunk.context,
            chunk.renderBounds,
            BLOCK_TYPES.GROUND,
          );
        chunk.context.fillRect(x, y, size, size);
        drawGroundEdges(chunk.context, column, row);
        chunk.context.restore();
      }
    });
  }

  function terrainDepthSourcePadding() {
    const zoom = cameraZoom();
    const farLayer = TERRAIN_DEPTH_LAYERS[0];
    const maximumScreenRadius =
      Math.max(game.viewport.width, game.viewport.height) * 0.5;
    const projectedSourceRadius =
      (maximumScreenRadius + farLayer.visibleDepthPixels) /
      farLayer.perspectiveScale;
    return Math.max(
      BLOCK_SIZE,
      (projectedSourceRadius - maximumScreenRadius) / zoom,
    );
  }

  function drawTerrainContourLayer(
    layer,
    drawItems,
    zoom,
    texturePatterns,
  ) {
    const scale = layer.perspectiveScale;
    const lineWidth =
      (layer.visibleDepthPixels * 2) / Math.max(0.001, zoom * scale);

    ctx.save();
    ctx.translate(game.head.x, game.head.y);
    ctx.scale(scale, scale);
    ctx.translate(-game.head.x, -game.head.y);
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    drawItems.forEach(({ chunk, worldOffsetX }) => {
      const variant = terrainTexturePatternVariantForBounds(chunk.bounds);
      ctx.save();
      ctx.translate(worldOffsetX, 0);
      TERRAIN_MATERIALS.forEach((material) => {
        const depthPath = chunk.depthPaths[material];
        if (!depthPath.hasEdges) return;
        ctx.strokeStyle = texturePatterns[material][layer.id][variant];
        ctx.stroke(depthPath.path);
      });
      ctx.restore();
    });
    ctx.restore();
  }

  function drawTerrainDepthLayer(layer, drawItems, zoom) {
    drawTerrainContourLayer(
      layer,
      drawItems,
      zoom,
      terrainDepthTexturePatterns,
    );
  }

  function drawMap() {
    const foregroundVisible = getVisibleWorldBounds(2);
    const depthPadding = terrainDepthSourcePadding();
    const visible = getVisibleWorldBounds(depthPadding);
    if (visible.width <= 0 || visible.height <= 0) return;
    const startColumn = Math.floor(visible.x / TERRAIN_CHUNK_WIDTH);
    const endColumn = Math.floor(
      (visible.x + visible.width - 1) / TERRAIN_CHUNK_WIDTH,
    );
    const startRow = Math.floor(visible.y / TERRAIN_CHUNK_HEIGHT);
    const endRow = Math.floor(
      (visible.y + visible.height - 1) / TERRAIN_CHUNK_HEIGHT,
    );
    const visibleChunkColumns = endColumn - startColumn + 1;
    const visibleChunkRows = endRow - startRow + 1;
    const zoom = cameraZoom();
    const nominalVisibleWidth = Math.min(
      game.width,
      game.viewport.width / zoom + depthPadding * 2,
    );
    const nominalVisibleHeight = Math.min(
      game.height,
      game.viewport.height / zoom + depthPadding * 2,
    );
    // Capacity is based on the maximum number of chunks this viewport can
    // straddle, not the smaller count produced by its current alignment. This
    // prevents the limit from oscillating as the camera moves across chunk
    // boundaries. Eviction is deferred until after drawing so no chunk still
    // needed later in the same frame can be discarded and rebuilt.
    const maximumVisibleChunkColumns = Math.min(
      Math.ceil(game.width / TERRAIN_CHUNK_WIDTH),
      Math.ceil(nominalVisibleWidth / TERRAIN_CHUNK_WIDTH) + 1,
    );
    const maximumVisibleChunkRows = Math.min(
      Math.ceil(game.height / TERRAIN_CHUNK_HEIGHT),
      Math.ceil(nominalVisibleHeight / TERRAIN_CHUNK_HEIGHT) + 1,
    );
    const lowDetailPrefetch = terrainChunkRenderScale() < 1;
    const maximumVisibleChunkCount =
      maximumVisibleChunkColumns * maximumVisibleChunkRows;
    const retainedChunkCount = lowDetailPrefetch
      ? Math.min(
          Math.ceil(game.width / TERRAIN_CHUNK_WIDTH),
          maximumVisibleChunkColumns + 2,
        ) *
        Math.min(
          Math.ceil(game.height / TERRAIN_CHUNK_HEIGHT),
          maximumVisibleChunkRows + 2,
        )
      : maximumVisibleChunkCount +
        maximumVisibleChunkColumns +
        maximumVisibleChunkRows +
        1;
    const cacheLimit = Math.max(
      MIN_TERRAIN_CHUNKS,
      retainedChunkCount,
    );
    game.terrainCacheLimit = cacheLimit;
    game.visibleTerrainFrame += 1;
    updateTerrainPrefetchCandidates(
      visible,
      startColumn,
      endColumn,
      startRow,
      endRow,
    );
    noteDevProfilerTerrainView(
      visibleChunkColumns * visibleChunkRows,
      cacheLimit,
    );
    const terrainChunkColumnCount = Math.ceil(
      game.width / TERRAIN_CHUNK_WIDTH,
    );
    const foregroundStartColumn = Math.floor(
      foregroundVisible.x / TERRAIN_CHUNK_WIDTH,
    );
    const foregroundEndColumn = Math.floor(
      (foregroundVisible.x + foregroundVisible.width - 1) /
        TERRAIN_CHUNK_WIDTH,
    );
    const foregroundStartRow = Math.floor(
      foregroundVisible.y / TERRAIN_CHUNK_HEIGHT,
    );
    const foregroundEndRow = Math.floor(
      (foregroundVisible.y + foregroundVisible.height - 1) /
        TERRAIN_CHUNK_HEIGHT,
    );
    const drawItems = [];
    const missingForegroundCandidates = [];
    const missingDepthCandidates = [];

    for (let row = startRow; row <= endRow; row += 1) {
      for (let column = startColumn; column <= endColumn; column += 1) {
        const physicalColumn = positiveModulo(
          column,
          terrainChunkColumnCount,
        );
        const worldOffsetX =
          Math.floor(column / terrainChunkColumnCount) * game.width;
        const foregroundChunk =
          column >= foregroundStartColumn &&
          column <= foregroundEndColumn &&
          row >= foregroundStartRow &&
          row <= foregroundEndRow;
        let chunk = getCachedTerrainChunk(physicalColumn, row);
        if (!chunk) {
          const fallbackChunk = getCachedTerrainFallbackChunk(
            physicalColumn,
            row,
          );
          if (fallbackChunk) {
            chunk = fallbackChunk;
            if (foregroundChunk) {
              missingForegroundCandidates.push(
                row * terrainChunkColumnCount + physicalColumn,
              );
            }
          } else if (foregroundChunk) {
            chunk = getTerrainPlaceholderChunk(physicalColumn, row);
            missingForegroundCandidates.push(
              row * terrainChunkColumnCount + physicalColumn,
            );
          }
        }
        if (!chunk) {
          missingDepthCandidates.push(
            row * terrainChunkColumnCount + physicalColumn,
          );
          continue;
        }
        drawItems.push({ chunk, column, row, worldOffsetX });
      }
    }

    if (missingForegroundCandidates.length > 0) {
      // A cached chunk from the previous resolution is already covering these
      // cells, so their replacements can be generated one per frame without
      // exposing a blank region during a level-driven camera zoom change.
      game.terrainPrefetchCandidates.splice(
        0,
        0,
        ...missingForegroundCandidates,
      );
      game.terrainPrefetchDirectionalCount +=
        missingForegroundCandidates.length;
    }

    if (missingDepthCandidates.length > 0) {
      // Directional foreground look-ahead remains the first priority. Missing
      // visual-only depth chunks are inserted immediately after it so they
      // fade in incrementally, never forcing a strip of synchronous builds.
      game.terrainPrefetchCandidates.splice(
        game.terrainPrefetchDirectionalCount,
        0,
        ...missingDepthCandidates,
      );
    }

    terrainLayerRenderState.drawItems = drawItems;
    terrainLayerRenderState.zoom = zoom;

    TERRAIN_DEPTH_LAYERS.forEach((layer) => {
      drawTerrainDepthLayer(layer, drawItems, zoom);
    });

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    drawItems.forEach(({ chunk, column, row, worldOffsetX }) => {
      if (
        column < foregroundStartColumn ||
        column > foregroundEndColumn ||
        row < foregroundStartRow ||
        row > foregroundEndRow
      ) {
        return;
      }
      ctx.drawImage(
        chunk.canvas,
        chunk.renderBounds.x + worldOffsetX,
        chunk.renderBounds.y,
        chunk.renderBounds.width,
        chunk.renderBounds.height,
      );
    });
    ctx.restore();
    trimTerrainChunkCache(cacheLimit);
  }

  function traceBackgroundCloud(targetContext, x, y, width, heightScale = 1) {
    const height = width * 0.24 * heightScale;
    targetContext.beginPath();
    targetContext.moveTo(x - width * 0.52, y + height * 0.2);
    targetContext.bezierCurveTo(
      x - width * 0.54,
      y - height * 0.15,
      x - width * 0.4,
      y - height * 0.5,
      x - width * 0.24,
      y - height * 0.28,
    );
    targetContext.bezierCurveTo(
      x - width * 0.15,
      y - height * 0.92,
      x + width * 0.17,
      y - height,
      x + width * 0.28,
      y - height * 0.3,
    );
    targetContext.bezierCurveTo(
      x + width * 0.48,
      y - height * 0.48,
      x + width * 0.58,
      y + height * 0.12,
      x + width * 0.43,
      y + height * 0.3,
    );
    targetContext.bezierCurveTo(
      x + width * 0.15,
      y + height * 0.43,
      x - width * 0.22,
      y + height * 0.4,
      x - width * 0.52,
      y + height * 0.2,
    );
    targetContext.closePath();
  }

  function drawAtmosphericCloud(cloudX, cloud) {
    const height = cloud.width * 0.24 * cloud.heightScale;
    const mainColor =
      cloud.distance > 0.58 ? palette.cloudLight : palette.cloud;

    ctx.save();
    ctx.lineJoin = "round";
    ctx.globalAlpha = cloud.alpha * 0.58;
    ctx.fillStyle = palette.cloudDark;
    traceBackgroundCloud(
      ctx,
      cloudX + cloud.width * 0.025,
      cloud.y + height * 0.16,
      cloud.width,
      cloud.heightScale,
    );
    ctx.fill();

    ctx.globalAlpha = cloud.alpha;
    ctx.fillStyle = mainColor;
    ctx.strokeStyle = palette.cloudDark;
    ctx.lineWidth = 2.4;
    traceBackgroundCloud(
      ctx,
      cloudX,
      cloud.y,
      cloud.width,
      cloud.heightScale,
    );
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = cloud.alpha * 0.58;
    ctx.strokeStyle = palette.cloudLight;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cloudX - cloud.width * 0.3, cloud.y - height * 0.12);
    ctx.bezierCurveTo(
      cloudX - cloud.width * 0.12,
      cloud.y - height * 0.5,
      cloudX + cloud.width * 0.14,
      cloud.y - height * 0.55,
      cloudX + cloud.width * 0.32,
      cloud.y - height * 0.16,
    );
    ctx.stroke();
    ctx.restore();
  }

  function drawSunCloudVeil(sunX, sunY, sunRadius) {
    const drift = Math.sin(game.elapsed * 0.11) * sunRadius * 0.24;
    drawAtmosphericCloud(sunX + drift, {
      y: sunY + sunRadius * 0.08,
      width: sunRadius * 2.65,
      heightScale: 0.7,
      alpha: 0.58,
      distance: 0.15,
    });
    drawAtmosphericCloud(sunX - sunRadius * 0.42 - drift * 0.35, {
      y: sunY + sunRadius * 0.33,
      width: sunRadius * 1.72,
      heightScale: 0.52,
      alpha: 0.28,
      distance: 0.7,
    });
  }

  function drawBackground() {
    const visible = getVisibleWorldBounds(2);
    const skyGradient = ctx.createLinearGradient(0, 0, 0, game.groundY);
    skyGradient.addColorStop(0, palette.skyDark);
    skyGradient.addColorStop(0.38, palette.sky);
    skyGradient.addColorStop(0.74, palette.skyHorizon);
    skyGradient.addColorStop(1, palette.skyLight);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(visible.x, visible.y, visible.width, visible.height);

    ctx.save();
    ctx.globalAlpha = 0.76;
    ctx.fillStyle = skyDetailPattern;
    ctx.fillRect(visible.x, visible.y, visible.width, visible.height);
    ctx.restore();

    const sunX = nearestPeriodicWorldX(
      game.width * 0.79,
      visible.x + visible.width * 0.5,
    );
    const sunY = game.groundY * 0.43;
    const sunRadius = clamp(game.width * 0.075, 42, 86);
    const sunVisible =
      sunX + sunRadius * 2 >= visible.x &&
      sunX - sunRadius * 2 <= visible.x + visible.width &&
      sunY + sunRadius * 2 >= visible.y &&
      sunY - sunRadius * 2 <= visible.y + visible.height;
    if (sunVisible) {
      ctx.save();
      const sunGlow = ctx.createRadialGradient(
        sunX,
        sunY,
        sunRadius * 0.35,
        sunX,
        sunY,
        sunRadius * 2,
      );
      sunGlow.addColorStop(0, "rgba(220, 138, 79, 0.26)");
      sunGlow.addColorStop(0.48, "rgba(182, 93, 50, 0.13)");
      sunGlow.addColorStop(1, "rgba(116, 32, 25, 0)");
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius * 2, 0, TAU);
      ctx.fill();

      const sunDisk = ctx.createRadialGradient(
        sunX - sunRadius * 0.18,
        sunY - sunRadius * 0.2,
        sunRadius * 0.05,
        sunX,
        sunY,
        sunRadius,
      );
      sunDisk.addColorStop(0, palette.sunGlow);
      sunDisk.addColorStop(1, palette.sun);
      ctx.globalAlpha = 0.82;
      ctx.fillStyle = sunDisk;
      ctx.strokeStyle = palette.cloudDark;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      drawSunCloudVeil(sunX, sunY, sunRadius);
    }

    game.clouds.forEach((cloud) => {
      const movingCloudX = positiveModulo(
        cloud.x + game.elapsed * cloud.speed,
        game.width,
      );
      const cloudX = nearestPeriodicWorldX(
        movingCloudX,
        visible.x + visible.width * 0.5,
      );
      const cloudHeight = cloud.width * 0.24 * cloud.heightScale;
      if (
        cloudX + cloud.width * 0.62 < visible.x ||
        cloudX - cloud.width * 0.62 > visible.x + visible.width ||
        cloud.y + cloudHeight * 0.55 < visible.y ||
        cloud.y - cloudHeight * 1.1 > visible.y + visible.height
      ) {
        return;
      }
      drawAtmosphericCloud(cloudX, cloud);
    });

    drawMap();
  }

  function drawEnemy(target) {
    const definition = ENEMY_DEFINITIONS[target.kind];
    const frameName =
      definition.spriteFrames[
        target.animationFrame % definition.spriteFrames.length
      ];
    const sprite = enemySprites[frameName];
    if (!sprite?.complete || sprite.naturalWidth <= 0) return;
    const spriteSize = definition.spriteSize * (target.captureScale ?? 1);
    const capturedForBite = Number.isFinite(target.captureElapsed);
    const capturedByTongue = Boolean(target.tongueCaptured);

    ctx.save();
    ctx.translate(target.x, target.y);
    if (capturedForBite || capturedByTongue) {
      // The capture path updates this angle from the worm's live mouth pose,
      // or from the final tongue link while the target is attached.
      ctx.rotate(target.angle);
    } else if (definition.sideProfile) {
      // Above-ground side-profile sprites mirror horizontally so a direction
      // change never rotates their feet or belly away from the ground.
      const facingDirection =
        target.flightDirection ??
        target.rabbitDirection ??
        (Math.cos(target.angle) < 0 ? -1 : 1);
      ctx.scale(facingDirection < 0 ? -1 : 1, 1);
    } else {
      ctx.rotate(target.angle);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(
      sprite,
      -spriteSize * 0.5,
      -spriteSize * 0.5,
      spriteSize,
      spriteSize,
    );
    ctx.restore();
  }

  function drawTargets() {
    const visible = getVisibleWorldBounds(MAXIMUM_ENEMY_SPRITE_RADIUS);
    [...game.targets, ...game.capturedTargets].forEach((target) => {
      const spriteRadius =
        ENEMY_DEFINITIONS[target.kind].spriteSize *
        (target.captureScale ?? 1) *
        0.5;
      if (
        target.x + spriteRadius < visible.x ||
        target.x - spriteRadius > visible.x + visible.width ||
        target.y + spriteRadius < visible.y ||
        target.y - spriteRadius > visible.y + visible.height
      ) {
        return;
      }
      drawEnemy(target);
    });
  }

  function drawEnemyHealthBar(target) {
    const timer = Number(target.healthBarTimer) || 0;
    if (timer <= 0 || target.health <= 0) return;

    const definition = ENEMY_DEFINITIONS[target.kind];
    const zoom = cameraZoom();
    const spriteSize = definition.spriteSize * (target.captureScale ?? 1);
    const screenWidth = clamp(
      spriteSize * zoom * ENEMY_HEALTH_BAR.widthScale,
      ENEMY_HEALTH_BAR.minimumScreenWidth,
      ENEMY_HEALTH_BAR.maximumScreenWidth,
    );
    const width = screenWidth / zoom;
    const height = ENEMY_HEALTH_BAR.screenHeight / zoom;
    const border = ENEMY_HEALTH_BAR.screenBorder / zoom;
    const gap = ENEMY_HEALTH_BAR.screenGap / zoom;
    const x = target.x - width * 0.5;
    const y = target.y - spriteSize * 0.5 - gap - height;
    const healthRatio = clamp(
      target.health / Math.max(0.001, enemyMaximumHealth(target)),
      0,
      1,
    );

    ctx.save();
    ctx.globalAlpha = clamp(
      timer / ENEMY_HEALTH_BAR.fadeDuration,
      0,
      1,
    );
    ctx.fillStyle = palette.ink;
    ctx.fillRect(x - border, y - border, width + border * 2, height + border * 2);
    ctx.fillStyle = palette.cream;
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = healthRatio > 0.35 ? palette.acid : palette.splatterBright;
    ctx.fillRect(x, y, width * healthRatio, height);
    ctx.restore();
  }

  function drawEnemyHealthBars() {
    const zoom = cameraZoom();
    const visible = getVisibleWorldBounds(
      MAXIMUM_ENEMY_SPRITE_RADIUS +
        (ENEMY_HEALTH_BAR.screenHeight + ENEMY_HEALTH_BAR.screenGap + 8) /
          zoom,
    );
    game.targets.forEach((target) => {
      if (
        target.x < visible.x ||
        target.x > visible.x + visible.width ||
        target.y < visible.y ||
        target.y > visible.y + visible.height
      ) {
        return;
      }
      drawEnemyHealthBar(target);
    });
  }


  function drawParticles(renderLayer = "back") {
    game.particles.forEach((particle) => {
      if ((particle.renderLayer || "back") !== renderLayer) return;
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle =
        particle.kind === "burst"
          ? palette.soilLight
          : particle.kind === "growth"
            ? particle.tone > 0.5
              ? palette.acid
              : palette.cream
          : particle.kind === "beetle"
            ? particle.tone > 0.5
              ? palette.beetleHighlight
              : palette.beetleShell
          : particle.kind === "dragonfly"
            ? particle.tone > 0.5
              ? palette.beetleHighlight
              : palette.beetleShell
          : particle.kind === "vulture"
            ? particle.tone > 0.5
              ? palette.vultureHighlight
              : palette.vulture
          : particle.kind === "mole"
            ? particle.tone > 0.5
              ? palette.moleHighlight
              : palette.mole
          : particle.kind === "rabbit"
            ? particle.tone > 0.5
              ? palette.rabbitHighlight
              : palette.rabbit
          : particle.kind === "meat"
            ? particle.tone > 0.5
              ? palette.splatterBright
              : palette.splatter
          : particle.kind === "stone"
            ? particle.tone > 0.5
              ? palette.stoneLight
              : palette.stoneDark
          : particle.kind === "splatter"
            ? particle.tone > 0.5
              ? palette.splatterBright
              : palette.splatter
            : palette.soilDark;
      ctx.save();
      ctx.translate(particle.x, particle.y);
      if (particle.kind === "splatter") {
        const liquidSize = particle.size * lerp(0.62, 1, alpha);
        ctx.beginPath();
        ctx.arc(0, 0, liquidSize, 0, TAU);
        ctx.fill();
      } else {
        ctx.rotate((particle.x + particle.y) * 0.03);
        ctx.fillRect(-particle.size, -particle.size * 0.5, particle.size * 2, particle.size);
      }
      ctx.restore();
    });
    ctx.globalAlpha = 1;
  }

  function bodyRadius(index, segmentCount, outline = false) {
    return baseBodyRadius(index, segmentCount, outline) * wormScale();
  }

  function drawTaperedBody(segments, fillStyle, outline = false) {
    const leftEdge = [];
    const rightEdge = [];

    segments.forEach((segment, index) => {
      const previous = segments[Math.max(0, index - 1)];
      const next = segments[Math.min(segments.length - 1, index + 1)];
      let tangentX = previous.x - next.x;
      let tangentY = previous.y - next.y;
      const tangentLength = magnitude(tangentX, tangentY);
      if (tangentLength < 0.001) {
        tangentX = Math.cos(game.heading);
        tangentY = Math.sin(game.heading);
      } else {
        tangentX /= tangentLength;
        tangentY /= tangentLength;
      }

      const radius = bodyRadius(index, segments.length, outline);
      const normalX = -tangentY;
      const normalY = tangentX;
      leftEdge.push({
        x: segment.x + normalX * radius,
        y: segment.y + normalY * radius,
      });
      rightEdge.push({
        x: segment.x - normalX * radius,
        y: segment.y - normalY * radius,
      });
    });

    const tail = segments[segments.length - 1];
    const beforeTail = segments[segments.length - 2];
    const tailAngle = Math.atan2(beforeTail.y - tail.y, beforeTail.x - tail.x);
    const tailRadius = bodyRadius(segments.length - 1, segments.length, outline);

    ctx.beginPath();
    ctx.moveTo(leftEdge[0].x, leftEdge[0].y);
    for (let index = 1; index < leftEdge.length - 1; index += 1) {
      const point = leftEdge[index];
      const nextPoint = leftEdge[index + 1];
      ctx.quadraticCurveTo(
        point.x,
        point.y,
        (point.x + nextPoint.x) * 0.5,
        (point.y + nextPoint.y) * 0.5,
      );
    }
    ctx.lineTo(leftEdge[leftEdge.length - 1].x, leftEdge[leftEdge.length - 1].y);
    ctx.arc(
      tail.x,
      tail.y,
      tailRadius,
      tailAngle + Math.PI / 2,
      tailAngle + Math.PI * 1.5,
    );
    for (let index = rightEdge.length - 2; index > 0; index -= 1) {
      const point = rightEdge[index];
      const nextPoint = rightEdge[index - 1];
      ctx.quadraticCurveTo(
        point.x,
        point.y,
        (point.x + nextPoint.x) * 0.5,
        (point.y + nextPoint.y) * 0.5,
      );
    }
    ctx.lineTo(rightEdge[0].x, rightEdge[0].y);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  function drawProceduralWorm() {
    const renderState = buildSpitterCraneRenderState();
    const segments = renderState.outputSegments;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    drawTaperedBody(segments, palette.wormDark, true);
    drawTaperedBody(segments, palette.worm);

    for (let index = 2; index < segments.length - 1; index += 2) {
      const point = segments[index];
      const before = segments[index - 1];
      const angle = Math.atan2(before.y - point.y, before.x - point.x);
      const bandRadius = bodyRadius(index, segments.length) * 0.82;
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.rotate(angle);
      ctx.strokeStyle = "rgba(120, 41, 35, 0.5)";
      ctx.lineWidth = 2.3 * wormScale();
      ctx.beginPath();
      ctx.moveTo(0, -bandRadius);
      ctx.lineTo(0, bandRadius);
      ctx.stroke();
      ctx.restore();
    }

    const head = segments[0];
    const pathHeadAngle = Math.atan2(
      head.y - segments[1].y,
      head.x - segments[1].x,
    );
    const headAngle = spitterHeadPoseShouldRemainActive()
      ? renderState.headPose.angle
      : game.speed > 0.5
        ? Math.atan2(game.velocity.y, game.velocity.x)
        : pathHeadAngle;
    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(headAngle);
    ctx.fillStyle = palette.worm;
    ctx.strokeStyle = palette.wormDark;
    ctx.lineWidth = wormDimension("headOutline");
    ctx.beginPath();
    ctx.ellipse(
      wormDimension("headOffset"),
      0,
      wormDimension("headLength"),
      wormDimension("headRadius"),
      0,
      0,
      TAU,
    );
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = palette.cream;
    ctx.beginPath();
    ctx.arc(
      wormDimension("eyeForward"),
      -wormDimension("eyeSpread"),
      wormDimension("eyeRadius"),
      0,
      TAU,
    );
    ctx.arc(
      wormDimension("eyeForward"),
      wormDimension("eyeSpread"),
      wormDimension("eyeRadius"),
      0,
      TAU,
    );
    ctx.fill();
    ctx.fillStyle = palette.ink;
    ctx.beginPath();
    ctx.arc(
      wormDimension("pupilForward"),
      -wormDimension("eyeSpread"),
      wormDimension("pupilRadius"),
      0,
      TAU,
    );
    ctx.arc(
      wormDimension("pupilForward"),
      wormDimension("eyeSpread"),
      wormDimension("pupilRadius"),
      0,
      TAU,
    );
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  function wormSpritesAreReady() {
    return Object.values(wormSprites).every(
      (image) => image.complete && image.naturalWidth > 0,
    );
  }

  function getSegmentAngle(segments, index) {
    const previous = segments[Math.max(0, index - 1)];
    const next = segments[Math.min(segments.length - 1, index + 1)];
    return Math.atan2(previous.y - next.y, previous.x - next.x);
  }

  function drawSegmentSprite(
    image,
    x,
    y,
    angle,
    visibleWidth,
    visibleHeight,
    sourceRadius,
    minimumRenderedWidth = 0,
  ) {
    const sourceScale = WORM_SPRITE_METRICS.segmentCanvasSize / (sourceRadius * 2);
    const width = Math.max(
      visibleWidth * sourceScale,
      minimumRenderedWidth,
    );
    const height = visibleHeight * sourceScale;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.drawImage(image, -width * 0.5, -height * 0.5, width, height);
    ctx.restore();
  }

  function rotatedSpriteIntersectsBounds(
    x,
    y,
    angle,
    width,
    height,
    bounds,
  ) {
    const cosine = Math.abs(Math.cos(angle));
    const sine = Math.abs(Math.sin(angle));
    const extentX = (width * cosine + height * sine) * 0.5;
    const extentY = (width * sine + height * cosine) * 0.5;
    return !(
      x + extentX < bounds.x ||
      x - extentX > bounds.x + bounds.width ||
      y + extentY < bounds.y ||
      y - extentY > bounds.y + bounds.height
    );
  }

  function drawCompositeBodySpriteLayer(segments, layout, visibleBounds) {
    // Body and outline PNGs are precomposited once per growth level and
    // appearance. Each cached stamp replaces two transformed drawImage calls.
    // Sparse stamps span the same unchanged simulation path, while the ring
    // layer below continues to render at its original every-other-point rate.
    for (
      let renderIndex = layout.renderIndices.length - 1;
      renderIndex >= 0;
      renderIndex -= 1
    ) {
      const index = layout.renderIndices[renderIndex];
      const segment = segments[index];
      const radius = layout.outlineRadii[index];
      const sourceScale =
        WORM_SPRITE_METRICS.segmentCanvasSize /
        (WORM_SPRITE_METRICS.segmentOutlineRadius * 2);
      const width = Math.max(
        radius * 2 * sourceScale,
        layout.minimumRenderedWidths[index],
      );
      const height = radius * 2 * sourceScale;
      if (
        !rotatedSpriteIntersectsBounds(
          segment.x,
          segment.y,
          layout.segmentAngles[index],
          width,
          height,
          visibleBounds,
        )
      ) {
        continue;
      }
      drawSegmentSprite(
        gameplayBodyCompositeSprite(index, segments.length),
        segment.x,
        segment.y,
        layout.segmentAngles[index],
        radius * 2,
        radius * 2,
        WORM_SPRITE_METRICS.segmentOutlineRadius,
        layout.minimumRenderedWidths[index],
      );
    }
  }

  function createBodySpriteLayout(segments) {
    const segmentCount = segments.length;
    const scale = wormScale();
    const layout = gameplayBodyLayoutCache;
    const segmentCountChanged = layout.segmentCount !== segmentCount;
    const scaleChanged = layout.scale !== scale;
    if (segmentCountChanged) {
      layout.segmentCount = segmentCount;
      layout.renderIndices = [];
      layout.cumulativeDistances = new Float32Array(segmentCount);
      layout.minimumRenderedWidths = new Float32Array(segmentCount);
      layout.fillRadii = new Float32Array(segmentCount);
      layout.outlineRadii = new Float32Array(segmentCount);
      layout.segmentAngles = new Float32Array(segmentCount);

      for (let index = 0; index < segmentCount; index += 1) {
        if (index % BODY_RENDER_RULES.visualSegmentStride === 0) {
          layout.renderIndices.push(index);
        }
      }
      const tailIndex = segmentCount - 1;
      if (layout.renderIndices[layout.renderIndices.length - 1] !== tailIndex) {
        layout.renderIndices.push(tailIndex);
      }
    }
    if (segmentCountChanged || scaleChanged) {
      layout.scale = scale;
      for (let index = 0; index < segmentCount; index += 1) {
        layout.fillRadii[index] = bodyRadius(index, segmentCount);
        layout.outlineRadii[index] = bodyRadius(index, segmentCount, true);
      }
    }

    for (let index = 0; index < segmentCount; index += 1) {
      if (index === 0) {
        layout.cumulativeDistances[index] = 0;
      } else {
        layout.cumulativeDistances[index] =
          layout.cumulativeDistances[index - 1] +
          magnitude(
            segments[index].x - segments[index - 1].x,
            segments[index].y - segments[index - 1].y,
          );
      }
      layout.segmentAngles[index] = getSegmentAngle(segments, index);
    }

    for (
      let renderIndex = 0;
      renderIndex < layout.renderIndices.length;
      renderIndex += 1
    ) {
      const index = layout.renderIndices[renderIndex];
      const previousIndex = layout.renderIndices[Math.max(0, renderIndex - 1)];
      const nextIndex = layout.renderIndices[
        Math.min(layout.renderIndices.length - 1, renderIndex + 1)
      ];
      const previousDistance =
        layout.cumulativeDistances[index] -
        layout.cumulativeDistances[previousIndex];
      const nextDistance =
        layout.cumulativeDistances[nextIndex] -
        layout.cumulativeDistances[index];
      layout.minimumRenderedWidths[index] =
        Math.max(previousDistance, nextDistance) *
        BODY_RENDER_RULES.longitudinalOverlap;
    }

    return layout;
  }

  function drawSegmentBands(segments, layout, visibleBounds) {
    for (let index = 2; index < segments.length - 1; index += 2) {
      const segment = segments[index];
      const radius = layout.fillRadii[index];
      const width = WORM_SPRITE_METRICS.segmentCanvasSize * wormScale();
      const height =
        WORM_SPRITE_METRICS.segmentCanvasSize *
        (radius / WORM_SPRITE_METRICS.segmentFillRadius);
      if (
        !rotatedSpriteIntersectsBounds(
          segment.x,
          segment.y,
          layout.segmentAngles[index],
          width,
          height,
          visibleBounds,
        )
      ) {
        continue;
      }
      ctx.save();
      ctx.translate(segment.x, segment.y);
      ctx.rotate(layout.segmentAngles[index]);
      ctx.drawImage(
        wormSprites.segmentBand,
        -width * 0.5,
        -height * 0.5,
        width,
        height,
      );
      ctx.restore();
    }
  }

  function tongueCenterlinePoints(geometry) {
    const points = [];
    const appendPoint = (x, y) => {
      const previous = points[points.length - 1];
      if (
        previous &&
        magnitude(x - previous.x, y - previous.y) < 0.0001
      ) {
        return;
      }
      points.push({ x, y });
    };

    appendPoint(geometry.back.x, geometry.back.y);
    for (
      let sample = 1;
      sample <= TONGUE_RULES.renderLineSamples;
      sample += 1
    ) {
      const amount = sample / TONGUE_RULES.renderLineSamples;
      appendPoint(
        lerp(geometry.back.x, geometry.front.x, amount),
        lerp(geometry.back.y, geometry.front.y, amount),
      );
    }
    geometry.route.points.forEach((point) => appendPoint(point.x, point.y));
    return points;
  }

  function tonguePathMetrics(points) {
    const cumulativeLengths = [0];
    for (let index = 1; index < points.length; index += 1) {
      cumulativeLengths.push(
        cumulativeLengths[index - 1] +
          magnitude(
            points[index].x - points[index - 1].x,
            points[index].y - points[index - 1].y,
          ),
      );
    }
    return {
      cumulativeLengths,
      totalLength: cumulativeLengths[cumulativeLengths.length - 1] || 1,
    };
  }

  function traceTaperedTongueShape(
    targetContext,
    points,
    baseWidth,
    scale,
  ) {
    const { cumulativeLengths, totalLength } = tonguePathMetrics(points);
    const leftEdge = [];
    const rightEdge = [];
    points.forEach((point, index) => {
      const previous = points[Math.max(0, index - 1)];
      const next = points[Math.min(points.length - 1, index + 1)];
      let tangentX = next.x - previous.x;
      let tangentY = next.y - previous.y;
      const tangentLength = magnitude(tangentX, tangentY) || 1;
      tangentX /= tangentLength;
      tangentY /= tangentLength;
      const progress = cumulativeLengths[index] / totalLength;
      const halfWidth =
        baseWidth *
        scale *
        Math.pow(Math.max(0, 1 - progress), TONGUE_RULES.taperExponent) *
        0.5;
      const normalX = -tangentY;
      const normalY = tangentX;
      leftEdge.push({
        x: point.x + normalX * halfWidth,
        y: point.y + normalY * halfWidth,
      });
      rightEdge.push({
        x: point.x - normalX * halfWidth,
        y: point.y - normalY * halfWidth,
      });
    });

    targetContext.beginPath();
    targetContext.moveTo(leftEdge[0].x, leftEdge[0].y);
    for (let index = 1; index < leftEdge.length; index += 1) {
      targetContext.lineTo(leftEdge[index].x, leftEdge[index].y);
    }
    for (let index = rightEdge.length - 1; index >= 0; index -= 1) {
      targetContext.lineTo(rightEdge[index].x, rightEdge[index].y);
    }
    targetContext.closePath();
    return { cumulativeLengths, totalLength };
  }

  function fillTaperedTongue(
    points,
    baseWidth,
    fillStyle,
    targetContext = ctx,
    scale = wormScale(),
  ) {
    if (points.length < 2) return;
    traceTaperedTongueShape(
      targetContext,
      points,
      baseWidth,
      scale,
    );
    targetContext.fillStyle = fillStyle;
    targetContext.fill();
  }

  function tonguePathSample(points, metrics, distance) {
    const targetDistance = clamp(distance, 0, metrics.totalLength);
    let sectionIndex = 1;
    while (
      sectionIndex < metrics.cumulativeLengths.length - 1 &&
      metrics.cumulativeLengths[sectionIndex] < targetDistance
    ) {
      sectionIndex += 1;
    }
    const previous = points[sectionIndex - 1];
    const next = points[sectionIndex];
    const sectionStart = metrics.cumulativeLengths[sectionIndex - 1];
    const sectionLength =
      metrics.cumulativeLengths[sectionIndex] - sectionStart;
    const amount = sectionLength > 0
      ? (targetDistance - sectionStart) / sectionLength
      : 0;
    return {
      x: lerp(previous.x, next.x, amount),
      y: lerp(previous.y, next.y, amount),
      angle: Math.atan2(next.y - previous.y, next.x - previous.x),
      progress: targetDistance / Math.max(1, metrics.totalLength),
    };
  }

  function tongueTextureIsReady(texture) {
    return Boolean(
      texture &&
      (texture instanceof HTMLCanvasElement ||
        (texture.complete && texture.naturalWidth > 0)),
    );
  }

  function drawTongueTextureSegments(
    targetContext,
    points,
    texture,
    scale,
    spacing,
  ) {
    if (points.length < 2 || !tongueTextureIsReady(texture)) return;
    const metrics = tonguePathMetrics(points);
    targetContext.save();
    traceTaperedTongueShape(
      targetContext,
      points,
      TONGUE_RULES.outerBaseWidth,
      scale,
    );
    targetContext.clip();
    targetContext.imageSmoothingEnabled = true;
    const segmentWidth = spacing * 1.12;
    for (
      let distance = spacing * 0.5;
      distance < metrics.totalLength + spacing * 0.5;
      distance += spacing
    ) {
      const sample = tonguePathSample(points, metrics, distance);
      const segmentHeight =
        TONGUE_RULES.outerBaseWidth *
        scale *
        Math.pow(
          Math.max(0, 1 - sample.progress),
          TONGUE_RULES.taperExponent,
        ) *
        1.04;
      if (segmentHeight < 0.05) continue;
      targetContext.save();
      targetContext.translate(sample.x, sample.y);
      targetContext.rotate(sample.angle);
      targetContext.drawImage(
        texture,
        -segmentWidth * 0.5,
        -segmentHeight * 0.5,
        segmentWidth,
        segmentHeight,
      );
      targetContext.restore();
    }
    targetContext.restore();
  }

  function drawTongueRingTextureSegments(
    targetContext,
    points,
    texture,
    scale,
    spacing,
  ) {
    if (points.length < 2 || !tongueTextureIsReady(texture)) return;
    const metrics = tonguePathMetrics(points);
    targetContext.save();
    traceTaperedTongueShape(
      targetContext,
      points,
      TONGUE_RULES.outerBaseWidth,
      scale,
    );
    targetContext.clip();
    targetContext.imageSmoothingEnabled = true;
    for (
      let distance = spacing;
      distance < metrics.totalLength - spacing * 0.55;
      distance += spacing
    ) {
      const sample = tonguePathSample(points, metrics, distance);
      const ringHeight =
        TONGUE_RULES.outerBaseWidth *
        scale *
        Math.pow(
          Math.max(0, 1 - sample.progress),
          TONGUE_RULES.taperExponent,
        ) *
        1.04;
      if (ringHeight < 0.05) continue;
      targetContext.save();
      targetContext.translate(sample.x, sample.y);
      targetContext.rotate(sample.angle);
      targetContext.drawImage(
        texture,
        -spacing * 0.5,
        -ringHeight * 0.5,
        spacing,
        ringHeight,
      );
      targetContext.restore();
    }
    targetContext.restore();
  }

  function drawTongue(tongue) {
    const geometry = getTongueGeometry(tongue);
    if (!geometry) return;
    const points = tongueCenterlinePoints(geometry);
    fillTaperedTongue(
      points,
      TONGUE_RULES.outerBaseWidth,
      palette.wormDark,
    );
    fillTaperedTongue(
      points,
      TONGUE_RULES.innerBaseWidth,
      palette.tongue,
    );
    fillTaperedTongue(
      points,
      TONGUE_RULES.highlightBaseWidth,
      palette.tongueHighlight,
    );
    drawTongueTextureSegments(
      ctx,
      points,
      wormSprites.tongue,
      wormScale(),
      wormSegmentSpacing() * TONGUE_RULES.segmentSpacingMultiplier,
    );
    drawTongueRingTextureSegments(
      ctx,
      points,
      wormSprites.tongueRing,
      wormScale(),
      wormSegmentSpacing() * TONGUE_RULES.segmentSpacingMultiplier,
    );
  }

  function acidParticleInVisibleBounds(particle, bounds, padding = 0) {
    const radius = particle.radius + padding;
    return !(
      particle.x + radius < bounds.x ||
      particle.x - radius > bounds.x + bounds.width ||
      particle.y + radius < bounds.y ||
      particle.y - radius > bounds.y + bounds.height
    );
  }

  function traceAcidRibbonConnections(bounds, radiusScale) {
    ctx.beginPath();
    let hasConnections = false;
    for (let index = 0; index < game.acidParticles.length; index += 1) {
      const particle = game.acidParticles[index];
      const link = particle.link;
      if (
        !link?.active ||
        link.generation !== particle.linkGeneration ||
        particle.collisionEpoch > 0 ||
        link.collisionEpoch > 0
      ) {
        continue;
      }
      const linkX = nearestPeriodicWorldX(link.x, particle.x);
      const offsetX = linkX - particle.x;
      const offsetY = link.y - particle.y;
      const distanceSquared = offsetX * offsetX + offsetY * offsetY;
      const maximumDistance =
        (particle.radius + link.radius) * ACID_RULES.linkDistanceMultiplier;
      if (distanceSquared > maximumDistance * maximumDistance) {
        continue;
      }
      const linkVisibilityRadius = link.radius + maximumDistance;
      const linkIsVisible = !(
        linkX + linkVisibilityRadius < bounds.x ||
        linkX - linkVisibilityRadius > bounds.x + bounds.width ||
        link.y + linkVisibilityRadius < bounds.y ||
        link.y - linkVisibilityRadius > bounds.y + bounds.height
      );
      if (
        !acidParticleInVisibleBounds(particle, bounds, maximumDistance) &&
        !linkIsVisible
      ) {
        continue;
      }

      if (distanceSquared < 0.000001) continue;
      const inverseDistance = 1 / Math.sqrt(distanceSquared);
      const normalX = -offsetY * inverseDistance;
      const normalY = offsetX * inverseDistance;
      const startRadius = acidParticleRenderRadius(particle) * radiusScale;
      const endRadius = acidParticleRenderRadius(link) * radiusScale;
      ctx.moveTo(
        particle.x + normalX * startRadius,
        particle.y + normalY * startRadius,
      );
      ctx.lineTo(linkX + normalX * endRadius, link.y + normalY * endRadius);
      ctx.lineTo(linkX - normalX * endRadius, link.y - normalY * endRadius);
      ctx.lineTo(
        particle.x - normalX * startRadius,
        particle.y - normalY * startRadius,
      );
      ctx.closePath();
      hasConnections = true;
    }
    return hasConnections;
  }

  function createAcidClusterAtlas(dropletCount) {
    const tileSize = ACID_RULES.visualClusterTileSize;
    const columns = ACID_RULES.visualClusterAtlasColumns;
    const rows = Math.ceil(ACID_RULES.visualClusterVariants / columns);
    const atlas =
      typeof OffscreenCanvas === "function"
        ? new OffscreenCanvas(columns * tileSize, rows * tileSize)
        : document.createElement("canvas");
    atlas.width = columns * tileSize;
    atlas.height = rows * tileSize;
    const atlasContext = atlas.getContext("2d");
    atlasContext.imageSmoothingEnabled = true;
    const pixelsPerRadius =
      (tileSize * 0.5 - 4) / ACID_RULES.visualClusterExtent;
    const highlightMinimumScale = 0.28 / ACID_RULES.particleRadius;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (
      let variant = 0;
      variant < ACID_RULES.visualClusterVariants;
      variant += 1
    ) {
      const random = seededRandom(
        hashString(`acid-cluster:${dropletCount}:${variant}`),
      );
      const centerX = (variant % columns + 0.5) * tileSize;
      const centerY = (Math.floor(variant / columns) + 0.5) * tileSize;
      const geometry = new Float32Array(dropletCount * 3);
      const rotation = random() * TAU;
      for (let index = 0; index < dropletCount; index += 1) {
        const isCenterDroplet = index === 0;
        const distribution = clamp(
          (index - 0.35 + random() * 0.7) /
            Math.max(1, dropletCount - 0.3),
          0,
          1,
        );
        const distance = isCenterDroplet
          ? random() * 0.16
          : ACID_RULES.visualDropletMaximumOffset * Math.sqrt(distribution);
        const angle =
          rotation + index * goldenAngle + (random() * 2 - 1) * 0.48;
        const offset = index * 3;
        geometry[offset] = centerX + Math.cos(angle) * distance * pixelsPerRadius;
        geometry[offset + 1] =
          centerY + Math.sin(angle) * distance * pixelsPerRadius;
        geometry[offset + 2] = isCenterDroplet
          ? lerp(1.02, 1.16, random())
          : lerp(
              ACID_RULES.visualDropletMinimumRadiusScale,
              ACID_RULES.visualDropletMaximumRadiusScale,
              random(),
            );
      }

      const fluidGradient = atlasContext.createRadialGradient(
        centerX - tileSize * 0.07,
        centerY - tileSize * 0.08,
        tileSize * 0.015,
        centerX,
        centerY,
        tileSize * 0.32,
      );
      fluidGradient.addColorStop(0, "#c9e956");
      fluidGradient.addColorStop(0.48, palette.acidFluid);
      fluidGradient.addColorStop(1, "#8eb52b");
      if (dropletCount > 1) {
        atlasContext.beginPath();
        for (let index = 1; index < dropletCount; index += 1) {
          const offset = index * 3;
          atlasContext.moveTo(geometry[0], geometry[1]);
          atlasContext.lineTo(geometry[offset], geometry[offset + 1]);
        }
        atlasContext.lineCap = "round";
        atlasContext.lineJoin = "round";
        atlasContext.lineWidth =
          ACID_RULES.visualDropletMinimumRadiusScale *
          2 *
          pixelsPerRadius;
        atlasContext.strokeStyle = fluidGradient;
        atlasContext.stroke();
      }

      atlasContext.beginPath();
      for (let index = 0; index < dropletCount; index += 1) {
        const offset = index * 3;
        const radius = geometry[offset + 2] * pixelsPerRadius;
        atlasContext.moveTo(geometry[offset] + radius, geometry[offset + 1]);
        atlasContext.arc(
          geometry[offset],
          geometry[offset + 1],
          radius,
          0,
          TAU,
        );
      }
      atlasContext.fillStyle = fluidGradient;
      atlasContext.fill();

      atlasContext.beginPath();
      const highlightStride = Math.max(
        2,
        Math.ceil(dropletCount / ACID_RULES.maximumClusterHighlights),
      );
      for (let index = 0; index < dropletCount; index += 1) {
        if ((variant + index) % highlightStride !== 0) continue;
        const offset = index * 3;
        const radiusScale = geometry[offset + 2];
        const radius =
          Math.max(highlightMinimumScale, radiusScale * 0.24) *
          pixelsPerRadius;
        const x = geometry[offset] - radiusScale * 0.2 * pixelsPerRadius;
        const y = geometry[offset + 1] - radiusScale * 0.24 * pixelsPerRadius;
        atlasContext.moveTo(x + radius, y);
        atlasContext.arc(x, y, radius, 0, TAU);
      }
      atlasContext.globalAlpha = 0.72;
      atlasContext.fillStyle = palette.acidHighlight;
      atlasContext.fill();
      atlasContext.globalAlpha = 1;
    }

    return typeof atlas.transferToImageBitmap === "function"
      ? atlas.transferToImageBitmap()
      : atlas;
  }

  function acidClusterAtlas(dropletCount) {
    let atlas = acidClusterAtlasCache.get(dropletCount);
    if (atlas) return atlas;
    atlas = createAcidClusterAtlas(dropletCount);
    acidClusterAtlasCache.set(dropletCount, atlas);
    return atlas;
  }

  function prewarmAcidClusterAtlases() {
    for (
      let index = 0;
      index < ACID_RULES.visualDensityTiers.length;
      index += 1
    ) {
      acidClusterAtlas(ACID_RULES.visualDensityTiers[index]);
    }
  }

  function drawAcidClusters(bounds) {
    const tileSize = ACID_RULES.visualClusterTileSize;
    const columns = ACID_RULES.visualClusterAtlasColumns;
    for (let index = 0; index < game.acidParticles.length; index += 1) {
      const particle = game.acidParticles[index];
      const halfSize =
        acidParticleRenderRadius(particle) * ACID_RULES.visualClusterExtent;
      if (
        particle.x + halfSize < bounds.x ||
        particle.x - halfSize > bounds.x + bounds.width ||
        particle.y + halfSize < bounds.y ||
        particle.y - halfSize > bounds.y + bounds.height
      ) {
        continue;
      }
      const dropletCount = Math.max(
        1,
        Math.round(
          particle.visualDropletCount ||
            ACID_RULES.baseVisualDropletsPerParticle,
        ),
      );
      const variant =
        Math.abs(Math.trunc(particle.visualVariant || 0)) %
        ACID_RULES.visualClusterVariants;
      ctx.drawImage(
        acidClusterAtlas(dropletCount),
        (variant % columns) * tileSize,
        Math.floor(variant / columns) * tileSize,
        tileSize,
        tileSize,
        particle.x - halfSize,
        particle.y - halfSize,
        halfSize * 2,
        halfSize * 2,
      );
    }
  }

  function drawAcidFluid() {
    if (game.acidParticles.length === 0) return;
    const bounds = getVisibleWorldBounds(24);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = 0.96;

    if (traceAcidRibbonConnections(bounds, ACID_RULES.linkCoreRadiusScale)) {
      ctx.fillStyle = palette.acidFluid;
      ctx.fill();
    }
    drawAcidClusters(bounds);
    ctx.restore();
  }

  function drawTongues() {
    if (!wormHasAbility(WORM_ABILITIES.TONGUE)) return;
    game.tongues.forEach((tongue) => drawTongue(tongue));
  }

  function drawWorm() {
    if (!wormSpritesAreReady()) {
      drawProceduralWorm();
      return;
    }

    const renderState = buildSpitterCraneRenderState();
    const segments = renderState.outputSegments;
    const bodyLayout = createBodySpriteLayout(segments);
    const visibleBounds = getVisibleWorldBounds(0);
    drawCompositeBodySpriteLayer(segments, bodyLayout, visibleBounds);
    drawSegmentBands(segments, bodyLayout, visibleBounds);

    const headPose = renderState.headPose;
    drawJawSpriteSet(
      ctx,
      wormSprites,
      headPose.x,
      headPose.y,
      headPose.angle,
      game.mouthOpen,
      wormScale(),
      wormAppearance.mirroredJawSource,
      wormAppearance.mirroredMouthSource,
      spitterHeadPoseShouldRemainActive()
        ? ACID_RULES.sprayJawAngleMultiplier
        : 1,
    );
  }

  function drawGridOverlay() {
    if (!game.showGrid) return;
    const size = game.map.cellSize;
    const visible = getVisibleWorldBounds(size);
    const startX = Math.floor(visible.x / size) * size;
    const endX = Math.ceil((visible.x + visible.width) / size) * size;
    const startY = Math.max(0, Math.floor(visible.y / size) * size);
    const endY = Math.min(game.height, Math.ceil((visible.y + visible.height) / size) * size);

    ctx.save();
    ctx.beginPath();
    for (let x = startX; x <= endX; x += size) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += size) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.strokeStyle = "rgba(58, 36, 31, 0.55)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = "rgba(245, 194, 98, 0.72)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function drawVectorArrow(
    vector,
    scale,
    maxLength,
    color,
    label,
    behindHead = false,
    showMagnitude = true,
  ) {
    const vectorMagnitude = magnitude(vector.x, vector.y);
    if (vectorMagnitude < 0.5) return;

    const unitX = vector.x / vectorMagnitude;
    const unitY = vector.y / vectorMagnitude;
    const length = clamp(vectorMagnitude * scale, 18, maxLength);
    const endX = behindHead
      ? game.head.x - unitX * wormDimension("wakeOffset")
      : game.head.x + unitX * length;
    const endY = behindHead
      ? game.head.y - unitY * wormDimension("wakeOffset")
      : game.head.y + unitY * length;
    const startX = behindHead ? endX - unitX * length : game.head.x;
    const startY = behindHead ? endY - unitY * length : game.head.y;
    const arrowSize = 9;
    const angle = Math.atan2(unitY, unitX);

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - Math.cos(angle - 0.55) * arrowSize,
      endY - Math.sin(angle - 0.55) * arrowSize,
    );
    ctx.lineTo(
      endX - Math.cos(angle + 0.55) * arrowSize,
      endY - Math.sin(angle + 0.55) * arrowSize,
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    ctx.font = '800 10px "Courier New", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const labelX = behindHead ? startX - unitX * 15 : endX + unitX * 15;
    const labelY = behindHead ? startY - unitY * 15 : endY + unitY * 15;
    const text = showMagnitude ? `${label} ${Math.round(vectorMagnitude)}` : label;
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 4;
    ctx.strokeText(text, labelX, labelY);
    ctx.fillStyle = color;
    ctx.fillText(text, labelX, labelY);
    ctx.restore();
  }

  function drawDirectionVectors() {
    if (!game.showVectors) return;
    drawVectorArrow(game.velocity, 0.16, 145, palette.acid, "V", true);
    drawVectorArrow(game.acceleration, 0.055, 110, palette.sun, "A");
  }

  function getFacingVector() {
    if (!game.inGround) {
      const speed = magnitude(game.velocity.x, game.velocity.y);
      if (speed > 0.5) {
        return {
          x: game.velocity.x / speed,
          y: game.velocity.y / speed,
        };
      }
    }
    return {
      x: Math.cos(game.heading),
      y: Math.sin(game.heading),
    };
  }

  function getLocalTurnVector(steer) {
    const facing = getFacingVector();
    return {
      x: -facing.y * steer,
      y: facing.x * steer,
    };
  }

  function getTurnInputVector() {
    const steer = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    if (steer === 0 || game.speed <= 0.5) return null;

    return getLocalTurnVector(steer);
  }

  function drawSteeringVectors() {
    if (!game.showSteeringVectors) return;
    drawVectorArrow(getFacingVector(), 82, 82, palette.debugFacing, "FACING", false, false);

    const turnInput = getTurnInputVector();
    if (!turnInput) return;
    const turnLabel = keys.right && !keys.left ? "TURN R" : "TURN L";
    drawVectorArrow(
      turnInput,
      62,
      62,
      palette.debugTurn,
      turnLabel,
      false,
      false,
    );
  }

  function drawCollisionLabel(text, x, y, color) {
    ctx.font = '800 9px "Courier New", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 4;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  function strokeCollisionCircle(x, y, radius, fillColor, strokeColor) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
  }

  function drawEatHitboxCone(
    pose,
    cone,
    fillColor,
    strokeColor = null,
    lineDash = [],
  ) {
    ctx.save();
    ctx.translate(pose.x, pose.y);
    ctx.rotate(pose.angle);
    ctx.beginPath();
    ctx.moveTo(cone.pivotOffset, 0);
    ctx.lineTo(
      cone.pivotOffset + Math.cos(-cone.halfAngle) * cone.range,
      Math.sin(-cone.halfAngle) * cone.range,
    );
    ctx.arc(
      cone.pivotOffset,
      0,
      cone.range,
      -cone.halfAngle,
      cone.halfAngle,
    );
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    if (strokeColor) {
      ctx.setLineDash(lineDash);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawStoneSurfaceOverlays() {
    const visible = getVisibleWorldBounds(24);
    const contact = game.stoneSurfaceContact;
    const activePath = contact?.path || null;

    ctx.save();
    ctx.lineCap = "round";
    game.map.stoneSurfacePaths.forEach((path) => {
      const pathCenterX = (path.bounds.minX + path.bounds.maxX) * 0.5;
      const worldOffsetX =
        nearestPeriodicWorldX(
          pathCenterX,
          visible.x + visible.width * 0.5,
        ) - pathCenterX;
      if (
        path.bounds.maxX + worldOffsetX < visible.x ||
        path.bounds.minX + worldOffsetX > visible.x + visible.width ||
        path.bounds.maxY < visible.y ||
        path.bounds.minY > visible.y + visible.height
      ) {
        return;
      }

      const active = path === activePath;
      const color = active ? palette.acid : palette.debugFacing;
      const first = path.samples[0];
      const last = path.samples[path.samples.length - 1];
      ctx.beginPath();
      ctx.moveTo(first.x + worldOffsetX, first.y);
      for (let index = 1; index < path.samples.length; index += 1) {
        ctx.lineTo(
          path.samples[index].x + worldOffsetX,
          path.samples[index].y,
        );
      }
      ctx.setLineDash(active ? [] : [7, 5]);
      ctx.strokeStyle = color;
      ctx.lineWidth = active ? 4 : 2;
      ctx.stroke();
      ctx.setLineDash([]);

      [first, last].forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x + worldOffsetX, point.y, active ? 4 : 3, 0, TAU);
        ctx.fillStyle = color;
        ctx.fill();
      });

      if (active) {
        const middle = path.samples[Math.floor(path.samples.length * 0.5)];
        drawCollisionLabel(
          "STONE COLLISION SURFACE",
          middle.x + worldOffsetX,
          middle.y - 11,
          color,
        );
      }
    });

    if (contact) {
      const visualHead = getEatHitboxPose();
      const captureRadius =
        contact.radius * STONE_RULES.surfaceCaptureRadiusMultiplier;
      ctx.setLineDash([5, 4]);
      strokeCollisionCircle(
        contact.wheelX,
        contact.wheelY,
        captureRadius,
        "rgba(255, 77, 0, 0.035)",
        palette.acid,
      );
      ctx.setLineDash([]);
      strokeCollisionCircle(
        contact.wheelX,
        contact.wheelY,
        contact.radius,
        "rgba(255, 77, 0, 0.18)",
        palette.acid,
      );
      ctx.beginPath();
      ctx.moveTo(contact.wheelX, contact.wheelY);
      ctx.lineTo(visualHead.x, visualHead.y);
      ctx.strokeStyle = palette.acid;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      drawCollisionLabel(
        "STONE WHEEL",
        contact.wheelX + contact.radius + 8,
        contact.wheelY - contact.radius,
        palette.acid,
      );
    }
    ctx.restore();
  }

  function drawTongueAvoidanceHitboxes() {
    if (!wormHasAbility(WORM_ABILITIES.TONGUE)) return;
    const obstacles = retractingTongueWormObstacles();
    if (obstacles.length === 0) return;
    const active = game.tongues.some(
      (tongue) => tongue.phase === "captured-retracting",
    );
    const color = palette.tongueHighlight;

    ctx.save();
    ctx.setLineDash(active ? [] : [3, 4]);
    ctx.lineWidth = active ? 2.25 : 1.5;
    ctx.strokeStyle = color;
    ctx.fillStyle = active
      ? "rgba(207, 2, 12, 0.1)"
      : "rgba(207, 2, 12, 0.035)";
    obstacles.forEach((obstacle) => {
      ctx.beginPath();
      ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, TAU);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();

    const headObstacle = obstacles[0];
    drawCollisionLabel(
      active ? "TONGUE AVOIDANCE ACTIVE" : "TONGUE AVOIDANCE",
      headObstacle.x,
      headObstacle.y - headObstacle.radius - 18,
      color,
    );
  }

  function addSweptCircleToCurrentPath(
    startX,
    startY,
    endX,
    endY,
    radius,
  ) {
    const offsetX = endX - startX;
    const offsetY = endY - startY;
    const distance = magnitude(offsetX, offsetY);
    if (distance <= 0.0001) {
      ctx.moveTo(endX + radius, endY);
      // Match the winding of moving capsules so overlapping newborn and
      // in-flight hitboxes union instead of cancelling under nonzero fill.
      ctx.arc(endX, endY, radius, 0, -TAU, true);
      ctx.closePath();
      return;
    }

    const angle = Math.atan2(offsetY, offsetX);
    const normalX = -Math.sin(angle) * radius;
    const normalY = Math.cos(angle) * radius;
    ctx.moveTo(startX + normalX, startY + normalY);
    ctx.lineTo(endX + normalX, endY + normalY);
    ctx.arc(
      endX,
      endY,
      radius,
      angle + Math.PI * 0.5,
      angle - Math.PI * 0.5,
      true,
    );
    ctx.lineTo(startX - normalX, startY - normalY);
    ctx.arc(
      startX,
      startY,
      radius,
      angle - Math.PI * 0.5,
      angle + Math.PI * 0.5,
      true,
    );
    ctx.closePath();
  }

  function drawAcidParticleHitboxes() {
    if (game.acidParticles.length === 0) return;
    const visible = getVisibleWorldBounds(20);
    let visibleCount = 0;
    let labelParticle = null;

    ctx.save();
    ctx.beginPath();
    game.acidParticles.forEach((particle) => {
      if (particle.headGuideActive) return;
      const minimumX =
        Math.min(particle.previousX, particle.x) - particle.radius;
      const maximumX =
        Math.max(particle.previousX, particle.x) + particle.radius;
      const minimumY =
        Math.min(particle.previousY, particle.y) - particle.radius;
      const maximumY =
        Math.max(particle.previousY, particle.y) + particle.radius;
      if (
        maximumX < visible.x ||
        minimumX > visible.x + visible.width ||
        maximumY < visible.y ||
        minimumY > visible.y + visible.height
      ) {
        return;
      }
      addSweptCircleToCurrentPath(
        particle.previousX,
        particle.previousY,
        particle.x,
        particle.y,
        particle.radius,
      );
      visibleCount += 1;
      if (!labelParticle || particle.generation > labelParticle.generation) {
        labelParticle = particle;
      }
    });

    if (visibleCount > 0) {
      const inverseZoom = 1 / Math.max(0.001, cameraZoom());
      ctx.fillStyle = "rgba(240, 100, 145, 0.16)";
      ctx.fill();
      ctx.strokeStyle = palette.debugTurn;
      ctx.lineWidth = 1.5 * inverseZoom;
      ctx.stroke();
      drawCollisionLabel(
        `ACID HITBOX ×${visibleCount}`,
        labelParticle.x,
        labelParticle.y - labelParticle.radius - 12 * inverseZoom,
        palette.debugTurn,
      );
    }
    ctx.restore();
  }

  function drawCollisionOverlays() {
    if (!game.showHitboxes) return;

    const eatHitboxSweep = getEatHitboxSweep();
    const eatCone = getEatConeGeometry();
    const mouthSensorRadius = MOUTH_BEHAVIOR.proximityRadius * wormScale();
    const headCollisionRadius = wormDimension("collisionRadius");
    const visualHeadPose = getEatHitboxPose();
    const stoneWheelRadius = stoneSurfaceWheelRadius(headCollisionRadius);
    const stoneCaptureRadius =
      stoneWheelRadius * STONE_RULES.surfaceCaptureRadiusMultiplier;
    const hitboxColor = palette.debugTurn;
    const hurtboxColor = palette.debugFacing;
    const sensorColor = palette.sun;

    ctx.save();
    drawStoneSurfaceOverlays();
    drawTongueAvoidanceHitboxes();
    drawAcidParticleHitboxes();

    strokeCollisionCircle(
      visualHeadPose.x,
      visualHeadPose.y,
      headCollisionRadius,
      "rgba(85, 214, 229, 0.08)",
      hurtboxColor,
    );
    drawCollisionLabel(
      "HEAD COLLISION",
      visualHeadPose.x,
      visualHeadPose.y - headCollisionRadius - 9,
      hurtboxColor,
    );

    if (!game.stoneSurfaceContact) {
      ctx.setLineDash([5, 4]);
      strokeCollisionCircle(
        visualHeadPose.x,
        visualHeadPose.y,
        stoneCaptureRadius,
        "rgba(255, 77, 0, 0.035)",
        palette.acid,
      );
      ctx.setLineDash([]);
      strokeCollisionCircle(
        visualHeadPose.x,
        visualHeadPose.y,
        stoneWheelRadius,
        "rgba(255, 77, 0, 0.08)",
        palette.acid,
      );
      drawCollisionLabel(
        "STONE WHEEL SEEK",
        visualHeadPose.x + stoneWheelRadius + 8,
        visualHeadPose.y + stoneWheelRadius,
        palette.acid,
      );
    }

    ctx.beginPath();
    ctx.arc(game.head.x, game.head.y, mouthSensorRadius, 0, TAU);
    ctx.setLineDash([8, 7]);
    ctx.strokeStyle = sensorColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    drawCollisionLabel(
      "MOUTH SENSOR",
      game.head.x,
      game.head.y - mouthSensorRadius - 9,
      sensorColor,
    );

    const tongueSelectionGroups = new Map();
    game.tongues.forEach((tongue) => {
      if (
        !Number.isFinite(tongue.selectionX) ||
        !Number.isFinite(tongue.selectionY)
      ) {
        return;
      }
      const key = `${tongue.selectionX}:${tongue.selectionY}:${tongue.selectionRadius}`;
      if (!tongueSelectionGroups.has(key)) tongueSelectionGroups.set(key, []);
      tongueSelectionGroups.get(key).push(tongue);
    });
    tongueSelectionGroups.forEach((tongues) => {
      const selection = tongues[0];
      const targetingRadius =
        selection.selectionRadius || tongueTargetingRadius();
      const lockCount = tongues.filter((tongue) =>
        Boolean(activeTongueTarget(tongue)),
      ).length;
      ctx.beginPath();
      ctx.arc(
        selection.selectionX,
        selection.selectionY,
        targetingRadius,
        0,
        TAU,
      );
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = palette.acid;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      drawCollisionLabel(
        `TONGUE TARGET LOCK ×${lockCount}`,
        selection.selectionX,
        selection.selectionY - targetingRadius - 9,
        palette.acid,
      );
    });

    for (let step = 0; step < eatHitboxSweep.steps; step += 1) {
      drawEatHitboxCone(
        eatHitboxPoseAlongSweep(eatHitboxSweep, step),
        eatCone,
        "rgba(240, 100, 145, 0.045)",
      );
    }
    drawEatHitboxCone(
      eatHitboxSweep.previous,
      eatCone,
      "rgba(240, 100, 145, 0)",
      hitboxColor,
      [4, 4],
    );
    drawEatHitboxCone(
      eatHitboxSweep.current,
      eatCone,
      "rgba(240, 100, 145, 0.2)",
      hitboxColor,
    );
    const hitboxLabelAngle =
      eatHitboxSweep.current.angle + eatCone.halfAngle;
    const hitboxLabelDistance = eatCone.range + 34;
    const currentPivotX =
      eatHitboxSweep.current.x +
      Math.cos(eatHitboxSweep.current.angle) * eatCone.pivotOffset;
    const currentPivotY =
      eatHitboxSweep.current.y +
      Math.sin(eatHitboxSweep.current.angle) * eatCone.pivotOffset;
    drawCollisionLabel(
      "EAT CONE",
      currentPivotX + Math.cos(hitboxLabelAngle) * hitboxLabelDistance,
      currentPivotY + Math.sin(hitboxLabelAngle) * hitboxLabelDistance,
      hitboxColor,
    );

    const visible = getVisibleWorldBounds(
      MAXIMUM_ENEMY_HURTBOX_RADIUS + 18,
    );
    game.targets.forEach((target) => {
      if (target.boostLatchHitboxDisabled) return;
      if (
        target.x + target.radius < visible.x ||
        target.x - target.radius > visible.x + visible.width ||
        target.y + target.radius < visible.y ||
        target.y - target.radius > visible.y + visible.height
      ) {
        return;
      }
      strokeCollisionCircle(
        target.x,
        target.y,
        target.radius,
        "rgba(85, 214, 229, 0.16)",
        hurtboxColor,
      );
      drawCollisionLabel(
        `${ENEMY_DEFINITIONS[target.kind].label.toUpperCase()} HURT`,
        target.x,
        target.y - target.radius - 8,
        hurtboxColor,
      );
    });

    ctx.restore();
  }

  function formatCombatStat(value) {
    return String(Math.round(Number(value) * 100) / 100);
  }

  function drawCombatStatsOverlay() {
    if (!game.showCombatStats) return;

    const visible = getVisibleWorldBounds(
      MAXIMUM_ENEMY_SPRITE_RADIUS + 24,
    );
    [...game.targets, ...game.capturedTargets].forEach((target) => {
      const spriteRadius =
        ENEMY_DEFINITIONS[target.kind].spriteSize *
        (target.captureScale ?? 1) *
        0.5;
      if (
        target.x + spriteRadius < visible.x ||
        target.x - spriteRadius > visible.x + visible.width ||
        target.y + spriteRadius < visible.y ||
        target.y - spriteRadius > visible.y + visible.height
      ) {
        return;
      }
      const preyLabel = preyClassLabel(enemyPreyClass(target)).toUpperCase();
      drawCollisionLabel(
        `${ENEMY_DEFINITIONS[target.kind].label.toUpperCase()} HP ${formatCombatStat(target.health)} · ${preyLabel}`,
        target.x,
        target.y - spriteRadius - 10,
        palette.sun,
      );
    });

    const mouth = getEatConeWorldPoints();
    const labelOffset =
      WORM_SPRITE_METRICS.headHeight * wormScale() * 0.5 + 18;
    drawCollisionLabel(
      `BITE FORCE ${formatCombatStat(wormBiteDamage())}`,
      mouth.pivotX - Math.sin(mouth.pose.angle) * labelOffset,
      mouth.pivotY + Math.cos(mouth.pose.angle) * labelOffset,
      palette.acid,
    );
  }

  function drawFrame() {
    const visible = getVisibleWorldBounds(2);
    ctx.save();
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(visible.x, 21.5);
    ctx.lineTo(visible.x + visible.width, 21.5);
    ctx.moveTo(visible.x, game.height - 21.5);
    ctx.lineTo(visible.x + visible.width, game.height - 21.5);
    ctx.stroke();
    ctx.restore();
  }

  function render() {
    ctx.fillStyle = palette.ink;
    ctx.fillRect(0, 0, game.viewport.width, game.viewport.height);
    if (!game.levelLoaded) return;

    updateCamera();
    const zoom = cameraZoom();

    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(-game.camera.x, -game.camera.y);

    drawBackground();
    drawTargets();
    drawAcidFluid();
    drawParticles("back");
    drawTongues();
    drawWorm();
    drawParticles("front");
    drawEnemyHealthBars();
    drawGridOverlay();
    drawCollisionOverlays();
    drawCombatStatsOverlay();
    drawDirectionVectors();
    drawSteeringVectors();
    drawFrame();
    ctx.restore();
    drawMinimap();
    prefetchTerrainChunk();
  }

  function updateHud() {
    const displaySpeed = Math.round(game.speed * SPEED_DISPLAY_SCALE);
    const remainingTargets =
      game.targets.length + game.capturedTargets.length;
    const maximumBoost = boostCapacity();
    const boostRatio = clamp(game.boostCharge / maximumBoost, 0, 1);
    speedReadout.textContent = String(displaySpeed).padStart(3, "0");
    targetReadout.textContent = String(remainingTargets).padStart(2, "0");
    targetMetric.classList.toggle("cleared", game.totalTargets > 0 && remainingTargets === 0);
    scoreReadout.textContent = String(game.score).padStart(3, "0");
    sizeLevelReadout.textContent = String(game.growthLevel);
    growthProgressReadout.textContent = String(game.growthProgress);
    growthCostReadout.textContent = String(game.growthCost);
    boostMeterFill.style.transform = `scaleX(${boostRatio})`;
    boostTimeReadout.textContent = game.boostCharge.toFixed(1);
    boostCapacityReadout.textContent = String(maximumBoost);
    boostMeter.setAttribute("aria-valuemax", String(maximumBoost));
    boostMeter.setAttribute("aria-valuenow", game.boostCharge.toFixed(2));
    boostMetric.classList.toggle("boosting", game.boosting);
    boostMetric.classList.toggle("depleted", game.boostCharge <= 0.001);
    stateReadout.textContent = activeHeavyTongueGrapple()
      ? "Tongue grapple"
      : game.inGround
        ? "Subterranean"
        : game.onStoneSurface
          ? "Surface rolling"
          : "Airborne";
    statePill.classList.toggle(
      "airborne",
      !game.inGround && !game.onStoneSurface,
    );
  }

  function updateFps(time) {
    if (game.fpsLastFrameTime === 0) {
      game.fpsLastFrameTime = time;
      game.fpsSampleStart = time;
      return;
    }
    const frameInterval = time - game.fpsLastFrameTime;
    game.fpsLastFrameTime = time;
    if (frameInterval <= 0 || frameInterval > 1000) {
      game.fpsFrames = 0;
      game.fpsSampleStart = time;
      return;
    }
    game.fpsFrames += 1;

    const sampleDuration = time - game.fpsSampleStart;
    if (sampleDuration < 400) return;

    const sample = (game.fpsFrames * 1000) / sampleDuration;
    game.fps = game.fps === 0 ? sample : lerp(game.fps, sample, 0.35);
    devFpsReadout.textContent = String(Math.round(game.fps)).padStart(3, "0");
    game.fpsFrames = 0;
    game.fpsSampleStart = time;
  }

  function shouldRenderFrame(time) {
    if (game.fpsLimit === 0 || game.lastRenderTime === 0) {
      game.lastRenderTime = time;
      return true;
    }

    const frameInterval = 1000 / game.fpsLimit;
    const elapsed = time - game.lastRenderTime;
    if (elapsed < frameInterval - 0.5) return false;

    game.lastRenderTime =
      elapsed < frameInterval ? time : time - (elapsed % frameInterval);
    return true;
  }

  function loop(time) {
    requestAnimationFrame(loop);
    if (!shouldRenderFrame(time)) {
      prefetchTerrainChunk(true);
      return;
    }

    const profiling = beginDevProfilerFrame(time);
    const workStart = performance.now();
    let updateDuration = 0;
    updateFps(time);
    const maximumDelta =
      game.fpsLimit === 0 ? 0.025 : Math.max(0.025, 1 / game.fpsLimit + 0.005);
    const dt = Math.min(maximumDelta, Math.max(0, (time - game.lastTime) / 1000 || 0));
    game.lastTime = time;

    if (game.started && !game.paused && !game.menuOpen) {
      const updateStart = profiling ? performance.now() : 0;
      game.elapsed += dt;
      updatePhysics(dt);
      updateHud();
      if (profiling) updateDuration = performance.now() - updateStart;
    }

    const renderStart = profiling ? performance.now() : 0;
    if (wormPainter.open) {
      updateWormPreviewSimulation(dt);
      drawWormEditorPreview();
    } else {
      render();
    }
    const finishedAt = performance.now();
    game.lastFrameWorkDuration = finishedAt - workStart;
    if (profiling) {
      finishDevProfilerFrame(
        time,
        updateDuration,
        finishedAt - renderStart,
        game.lastFrameWorkDuration,
      );
    }
  }

  const keyMap = {
    KeyA: "left",
    KeyD: "right",
    KeyW: "up",
    KeyS: "down",
    Space: "boost",
  };

  function canvasScreenPointFromClient(clientX, clientY) {
    const bounds = canvas.getBoundingClientRect();
    return {
      x:
        ((clientX - bounds.left) / Math.max(1, bounds.width)) *
        game.viewport.width,
      y:
        ((clientY - bounds.top) / Math.max(1, bounds.height)) *
        game.viewport.height,
    };
  }

  function canvasWorldPointFromClient(clientX, clientY) {
    const screen = canvasScreenPointFromClient(clientX, clientY);
    const screenX = screen.x;
    const screenY = screen.y;
    const zoom = cameraZoom();
    return {
      x: screenX / zoom + game.camera.x,
      y: screenY / zoom + game.camera.y,
    };
  }

  function canvasWorldPoint(event) {
    return canvasWorldPointFromClient(event.clientX, event.clientY);
  }

  function cancelHeldTonguePointer(pointerId = tonguePointer.pointerId) {
    if (
      tonguePointer.pointerId === null ||
      pointerId !== tonguePointer.pointerId
    ) {
      return false;
    }
    const capturedPointerId = tonguePointer.pointerId;
    tonguePointer.pointerId = null;
    let retracting = false;
    [...game.tongues].forEach((tongue) => {
      if (tongue.holdPointerId !== capturedPointerId) return;
      retracting = beginHeldHeavyTongueRetraction(tongue) || retracting;
    });
    if (canvas.hasPointerCapture?.(capturedPointerId)) {
      canvas.releasePointerCapture(capturedPointerId);
    }
    return retracting;
  }

  function updateSpitterPointerPosition(clientX, clientY) {
    const screen = canvasScreenPointFromClient(clientX, clientY);
    spitterPointer.clientX = clientX;
    spitterPointer.clientY = clientY;
    spitterPointer.screenX = screen.x;
    spitterPointer.screenY = screen.y;
  }

  function cancelSpitterPointer(pointerId = spitterPointer.pointerId) {
    if (
      spitterPointer.pointerId === null ||
      pointerId !== spitterPointer.pointerId
    ) {
      return false;
    }
    const capturedPointerId = spitterPointer.pointerId;
    spitterPointer.pointerId = null;
    game.acidEmissionAccumulator = 0;
    game.acidLastEmittedParticle = null;
    if (canvas.hasPointerCapture?.(capturedPointerId)) {
      canvas.releasePointerCapture(capturedPointerId);
    }
    return true;
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (
      wormHasAbility(WORM_ABILITIES.ACID) &&
      game.levelLoaded &&
      game.started &&
      !game.paused &&
      !game.menuOpen
    ) {
      spitterPointer.pointerId = event.pointerId;
      updateSpitterPointerPosition(event.clientX, event.clientY);
      if (
        !spitterHasHeadGuidedAcid() ||
        !Number.isFinite(game.spitterAimAngle)
      ) {
        game.spitterAimAngle = getWormHeadAngle();
      }
      game.acidEmissionAccumulator = Math.max(
        1,
        game.acidEmissionAccumulator,
      );
      canvas.setPointerCapture?.(event.pointerId);
      event.preventDefault();
      return;
    }
    const point = canvasWorldPoint(event);
    const heavyTarget = prioritizedHardTongueTarget(point.x, point.y);
    let launchedHeldGrapple = false;
    if (heavyTarget && tonguePointer.pointerId === null) {
      tonguePointer.pointerId = event.pointerId;
      launchedHeldGrapple = launchHeldHeavyTongue(
        heavyTarget,
        event.pointerId,
        point.x,
        point.y,
      );
      if (launchedHeldGrapple) {
        canvas.setPointerCapture?.(event.pointerId);
      } else {
        tonguePointer.pointerId = null;
      }
    }
    const launchedTongue = launchedHeldGrapple
      ? false
      : launchTongueAtWorldPoint(point.x, point.y);
    if (launchedHeldGrapple || launchedTongue) {
      event.preventDefault();
    }
  });

  canvas.addEventListener("pointermove", (event) => {
    if (event.pointerId !== spitterPointer.pointerId) return;
    updateSpitterPointerPosition(event.clientX, event.clientY);
    event.preventDefault();
  });

  const finishCanvasTonguePointer = (event) => {
    if (event.pointerId === spitterPointer.pointerId) {
      if (cancelSpitterPointer(event.pointerId)) event.preventDefault();
      return;
    }
    if (event.pointerId !== tonguePointer.pointerId) return;
    if (cancelHeldTonguePointer(event.pointerId)) event.preventDefault();
  };
  canvas.addEventListener("pointerup", finishCanvasTonguePointer);
  canvas.addEventListener("pointercancel", finishCanvasTonguePointer);
  canvas.addEventListener("lostpointercapture", finishCanvasTonguePointer);

  function finishEditorPointer(event) {
    if (editor.pointerId !== event.pointerId) return;
    editor.drawing = false;
    editor.panning = false;
    editor.pointerId = null;
    editor.lastCell = null;
    editor.lastPointer = null;
    if (editorCanvas.hasPointerCapture?.(event.pointerId)) {
      editorCanvas.releasePointerCapture(event.pointerId);
    }
  }

  editorCanvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (editor.pointerId !== null) return;
    editor.pointerId = event.pointerId;
    editorCanvas.setPointerCapture?.(event.pointerId);
    editor.hoverCell = editorCellAt(event.clientX, event.clientY);
    const shouldPan = editor.tool === "pan" || event.button === 1;
    if (shouldPan) {
      editor.panning = true;
      editor.lastPointer = { x: event.clientX, y: event.clientY };
    } else if (editor.tool === "fill") {
      applyEditorFill(
        editor.hoverCell,
        event.button === 2 ? "erase" : editor.fillMaterialTool,
      );
    } else {
      editor.drawing = true;
      editor.strokeTool = event.button === 2 ? "erase" : editor.tool;
      editor.lastCell = editor.hoverCell;
      applyEditorTool(editor.hoverCell, editor.strokeTool);
    }
    drawWorldEditor();
  });

  editorCanvas.addEventListener("pointermove", (event) => {
    if ((editor.drawing || editor.panning) && editor.pointerId !== event.pointerId) return;
    const cell = editorCellAt(event.clientX, event.clientY);
    editor.hoverCell = cell;
    if (editor.panning && editor.lastPointer) {
      editor.offsetX += event.clientX - editor.lastPointer.x;
      editor.offsetY += event.clientY - editor.lastPointer.y;
      editor.lastPointer = { x: event.clientX, y: event.clientY };
    } else if (editor.drawing && editor.lastCell) {
      applyEditorStroke(editor.lastCell, cell, editor.strokeTool);
      editor.lastCell = cell;
    }
    drawWorldEditor();
  });

  editorCanvas.addEventListener("pointerup", finishEditorPointer);
  editorCanvas.addEventListener("pointercancel", finishEditorPointer);
  editorCanvas.addEventListener("pointerleave", () => {
    if (!editor.drawing && !editor.panning) {
      editor.hoverCell = null;
      drawWorldEditor();
    }
  });
  editorCanvas.addEventListener("contextmenu", (event) => event.preventDefault());
  editorCanvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const rect = editorCanvas.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      const worldX = (pointerX - editor.offsetX) / editor.scale;
      const worldY = (pointerY - editor.offsetY) / editor.scale;
      const nextScale = clamp(editor.scale * Math.exp(-event.deltaY * 0.0015), 0.5, 28);
      editor.offsetX = pointerX - worldX * nextScale;
      editor.offsetY = pointerY - worldY * nextScale;
      editor.scale = nextScale;
      drawWorldEditor();
    },
    { passive: false },
  );

  function finishWormPaintPointer(event) {
    if (wormPainter.pointerId !== event.pointerId) return;
    wormPainter.drawing = false;
    wormPainter.pointerId = null;
    wormPainter.lastPoint = null;
    if (wormLayerCanvas.hasPointerCapture?.(event.pointerId)) {
      wormLayerCanvas.releasePointerCapture(event.pointerId);
    }
  }

  wormLayerCanvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (wormPainter.pointerId !== null) return;
    wormPainter.pointerId = event.pointerId;
    wormPainter.lastPoint = wormPaintPoint(event);
    wormLayerCanvas.setPointerCapture?.(event.pointerId);
    if (wormPainter.tool === "fill") {
      wormPainter.drawing = false;
      applyWormPaintFill(
        wormPainter.lastPoint,
        event.button === 2 ? "erase" : "paint",
      );
      return;
    }
    wormPainter.drawing = true;
    wormPainter.strokeTool = event.button === 2 ? "erase" : wormPainter.tool;
    applyWormPaintStroke(
      wormPainter.lastPoint,
      wormPainter.lastPoint,
      wormPainter.strokeTool,
    );
  });

  wormLayerCanvas.addEventListener("pointermove", (event) => {
    if (!wormPainter.drawing || wormPainter.pointerId !== event.pointerId) return;
    const point = wormPaintPoint(event);
    applyWormPaintStroke(wormPainter.lastPoint, point, wormPainter.strokeTool);
    wormPainter.lastPoint = point;
  });

  wormLayerCanvas.addEventListener("pointerup", finishWormPaintPointer);
  wormLayerCanvas.addEventListener("pointercancel", finishWormPaintPointer);
  wormLayerCanvas.addEventListener("contextmenu", (event) => event.preventDefault());

  window.addEventListener("keydown", (event) => {
    if (wormPainter.open) {
      if (event.code === "Escape") {
        event.preventDefault();
        closeWormAppearanceEditor();
      }
      return;
    }
    if (editor.open) {
      if (event.code === "Escape") {
        event.preventDefault();
        closeWorldEditor(true);
      }
      return;
    }
    if (worldSelect.classList.contains("visible")) {
      if (event.code === "Escape") {
        event.preventDefault();
        closeWorldSelect();
      }
      return;
    }
    if (wormTypeSelect.classList.contains("visible")) {
      if (event.code === "Escape") {
        event.preventDefault();
        closeWormTypeSelect();
      }
      return;
    }
    if (enemyInfo.classList.contains("visible")) {
      if (event.code === "Escape") {
        event.preventDefault();
        closeEnemyInfo();
      }
      return;
    }
    if (gameMenu.classList.contains("visible")) {
      if (event.code === "Escape") {
        event.preventDefault();
        closeMainMenu();
      }
      return;
    }
    if (event.code === "KeyF") {
      event.preventDefault();
      if (game.levelLoaded && !event.repeat) toggleDevMenu();
      return;
    }
    if (devMenu.classList.contains("open") && event.code === "Escape") {
      event.preventDefault();
      toggleDevMenu(false);
      return;
    }
    if (keyMap[event.code]) {
      if (!game.levelLoaded || game.paused || game.menuOpen) return;
      event.preventDefault();
      keys[keyMap[event.code]] = true;
    } else if (event.code === "Escape") {
      event.preventDefault();
      openMainMenu();
    }
  });

  window.addEventListener("keyup", (event) => {
    if (keyMap[event.code]) {
      event.preventDefault();
      keys[keyMap[event.code]] = false;
    }
  });

  window.addEventListener("blur", () => {
    clearControlKeys();
    if (game.levelLoaded && game.started && !game.menuOpen) openMainMenu();
  });

  document.addEventListener("visibilitychange", () => {
    if (
      document.hidden &&
      game.levelLoaded &&
      game.started &&
      !game.menuOpen
    ) {
      openMainMenu();
    }
  });

  document.querySelectorAll("[data-control]").forEach((button) => {
    const control = button.dataset.control;
    const engage = (event) => {
      event.preventDefault();
      if (!game.levelLoaded || game.paused || game.menuOpen) return;
      keys[control] = true;
      button.classList.add("active");
    };
    const release = (event) => {
      event.preventDefault();
      keys[control] = false;
      button.classList.remove("active");
    };
    button.addEventListener("pointerdown", engage);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
  });

  function toggleDevMenu(force) {
    const open = typeof force === "boolean" ? force : !devMenu.classList.contains("open");
    devMenu.classList.toggle("open", open);
    gameShell.classList.toggle("dev-tools-open", open);
    devMenuToggle.setAttribute("aria-expanded", String(open));
    statePill.setAttribute("aria-hidden", String(!open));
    setDevProfilerActive(open);
    if (open) syncDevWormLevelControl();
  }

  function syncDevWormLevelControl() {
    const overridden = game.growthLevelOverride !== null;
    devWormLevelInput.value = overridden
      ? String(game.growthLevelOverride)
      : "";
    devWormLevelMode.textContent = overridden
      ? `Override active · score level ${game.scoreGrowthLevel}`
      : `Following score · level ${game.scoreGrowthLevel}`;
  }

  function setDevWormLevelOverride(rawValue) {
    if (String(rawValue).trim() === "") {
      game.growthLevelOverride = null;
      setEffectiveWormLevel(game.scoreGrowthLevel);
    } else {
      game.growthLevelOverride = clamp(
        Math.floor(Number(rawValue) || 0),
        0,
        DEV_WORM_LEVEL_MAX,
      );
      setEffectiveWormLevel(game.growthLevelOverride);
    }
    syncDevWormLevelControl();
    updateHud();
  }

  function populateDevEnemyButtons() {
    devEnemyButtons.replaceChildren();
    Object.entries(ENEMY_DEFINITIONS).forEach(([kind, definition]) => {
      if (definition.devSpawnable === false) return;
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.devEnemyKind = kind;
      button.textContent = definition.label;
      button.title = `Place ${definition.label.toLowerCase()} in view`;
      devEnemyButtons.appendChild(button);
    });
  }

  function placeDevEnemyInView(kind) {
    const definition = ENEMY_DEFINITIONS[kind];
    if (!definition || definition.devSpawnable === false) return;

    updateCamera();
    const visible = getVisibleWorldBounds(0);
    const spawnPosition =
      DEV_ENEMY_SPAWN_POSITIONS[
        game.devEnemySpawnIndex % DEV_ENEMY_SPAWN_POSITIONS.length
      ];
    game.devEnemySpawnIndex += 1;

    const renderRadius = Math.max(
      definition.radius,
      definition.spriteSize * 0.5,
    );
    const paddingX = Math.min(
      renderRadius + 14,
      visible.width * 0.5,
    );
    const paddingY = Math.min(
      renderRadius + 14,
      visible.height * 0.5,
    );
    const minimumX = visible.x + paddingX;
    const maximumX = visible.x + visible.width - paddingX;
    const minimumY = visible.y + paddingY;
    const maximumY = visible.y + visible.height - paddingY;
    const x = clamp(
      visible.x + visible.width * spawnPosition[0],
      Math.min(minimumX, maximumX),
      Math.max(minimumX, maximumX),
    );
    const y = clamp(
      visible.y + visible.height * spawnPosition[1],
      Math.min(minimumY, maximumY),
      Math.max(minimumY, maximumY),
    );
    const regionType =
      getBlockAtWorld(x, y)?.type || BLOCK_TYPES.AIR;
    const random = seededRandom(
      hashString(
        `${game.activeWorldId}:${kind}:${game.nextTargetId}:${game.devEnemySpawnIndex}:dev`,
      ),
    );

    game.targets.push(
      createEnemyTarget(kind, x, y, regionType, random),
    );
    game.totalTargets += 1;
    updateHud();
  }

  function setGridVisible(visible) {
    game.showGrid = visible;
    revealGridInput.checked = visible;
    devMenu.classList.toggle("grid-active", visible);
  }

  function setVectorsVisible(visible) {
    game.showVectors = visible;
    revealVectorsInput.checked = visible;
    devMenu.classList.toggle("vectors-active", visible);
  }

  function setSteeringVectorsVisible(visible) {
    game.showSteeringVectors = visible;
    revealSteeringInput.checked = visible;
    devMenu.classList.toggle("steering-active", visible);
  }

  function setHitboxesVisible(visible) {
    game.showHitboxes = visible;
    revealHitboxesInput.checked = visible;
    devMenu.classList.toggle("hitboxes-active", visible);
  }

  function setCombatStatsVisible(visible) {
    game.showCombatStats = visible;
    revealCombatStatsInput.checked = visible;
    devMenu.classList.toggle("combat-stats-active", visible);
  }

  function setSwarmMode(visible) {
    game.swarmMode = visible;
    swarmModeInput.checked = visible;
    devMenu.classList.toggle("swarm-active", visible);
  }

  function setFpsLimit(value) {
    const parsedValue = Number(value);
    game.fpsLimit = [0, 30, 60, 120].includes(parsedValue) ? parsedValue : 0;
    fpsLimitInput.value = String(game.fpsLimit);

    const now = performance.now();
    game.lastTime = now;
    game.lastRenderTime = now;
    game.fps = 0;
    game.fpsFrames = 0;
    game.fpsSampleStart = 0;
    game.fpsLastFrameTime = 0;
    devFpsReadout.textContent = "000";
    if (devProfiler.active) setDevProfilerActive(true);
  }

  devMenuToggle.addEventListener("click", () => toggleDevMenu());
  devWormLevelInput.addEventListener("input", () =>
    setDevWormLevelOverride(devWormLevelInput.value),
  );
  devEnemyButtons.addEventListener("click", (event) => {
    const button = event.target.closest("[data-dev-enemy-kind]");
    if (!button || !devEnemyButtons.contains(button)) return;
    placeDevEnemyInView(button.dataset.devEnemyKind);
  });
  revealGridInput.addEventListener("change", () => setGridVisible(revealGridInput.checked));
  revealVectorsInput.addEventListener("change", () =>
    setVectorsVisible(revealVectorsInput.checked),
  );
  revealSteeringInput.addEventListener("change", () =>
    setSteeringVectorsVisible(revealSteeringInput.checked),
  );
  revealHitboxesInput.addEventListener("change", () =>
    setHitboxesVisible(revealHitboxesInput.checked),
  );
  revealCombatStatsInput.addEventListener("change", () =>
    setCombatStatsVisible(revealCombatStatsInput.checked),
  );
  swarmModeInput.addEventListener("change", () =>
    setSwarmMode(swarmModeInput.checked),
  );
  fpsLimitInput.addEventListener("change", () => setFpsLimit(fpsLimitInput.value));
  homePlayButton.addEventListener("click", startSelectedWorld);
  homeWorldButton.addEventListener("click", openWorldSelect);
  homeWormButton.addEventListener("click", openWormTypeSelect);
  homeWormEditButton.addEventListener("click", openWormAppearanceEditor);
  mainMenuButton.addEventListener("click", openMainMenu);
  mainMenuCloseButton.addEventListener("click", closeMainMenu);
  menuContinueButton.addEventListener("click", closeMainMenu);
  gameMenu.addEventListener("click", (event) => {
    if (event.target === gameMenu) closeMainMenu();
  });
  wormTypeCloseButton.addEventListener("click", closeWormTypeSelect);
  wormTypeSelect.addEventListener("click", (event) => {
    if (event.target === wormTypeSelect) closeWormTypeSelect();
  });
  enemyInfoButton.addEventListener("click", openEnemyInfo);
  enemyInfoCloseButton.addEventListener("click", closeEnemyInfo);
  menuDevToolsButton.addEventListener("click", () => {
    closeMainMenu();
    toggleDevMenu(true);
  });
  menuReturnHomeButton.addEventListener("click", showHomeScreen);
  wormEditorCancelButton.addEventListener("click", closeWormAppearanceEditor);
  wormEditorSaveButton.addEventListener("click", saveWormAppearance);
  wormPackageExportButton.addEventListener("click", exportWormPackage);
  wormPackageImportButton.addEventListener("click", () =>
    wormPackageImportInput.click(),
  );
  wormPackageImportInput.addEventListener("change", async () => {
    const file = wormPackageImportInput.files?.[0];
    if (!file) return;
    updateWormPaintStatus(`Importing ${file.name}…`);
    try {
      await importWormPackage(file);
    } catch (error) {
      const knownMessage =
        error instanceof Error &&
        (error.message === "Worm package is too large" ||
          error.message === "Not a compatible WORM appearance package")
          ? error.message
          : "Could not read that worm package";
      updateWormPaintStatus(knownMessage);
    } finally {
      wormPackageImportInput.value = "";
    }
  });
  wormLoadDefaultsButton.addEventListener("click", async () => {
    try {
      await loadDefaultWormIntoEditor();
      updateWormPaintStatus();
    } catch {
      updateWormPaintStatus("Could not load the default PNG layers");
    }
  });
  document.querySelectorAll("[data-worm-layer]").forEach((button) => {
    button.addEventListener("click", () => setWormPaintLayer(button.dataset.wormLayer));
  });
  document.querySelectorAll("[data-worm-tool]").forEach((button) => {
    button.addEventListener("click", () => setWormPaintTool(button.dataset.wormTool));
  });
  wormBrushColorInput.addEventListener("input", () => {
    wormPainter.color = wormBrushColorInput.value;
  });
  wormBrushSizeInput.addEventListener("change", () => {
    wormPainter.brushSize = Number(wormBrushSizeInput.value);
    updateWormPaintStatus();
  });
  wormSymmetryModeInput.addEventListener("change", () => {
    wormPainter.symmetry = wormSymmetryModeInput.value;
    updateWormPaintStatus();
  });
  wormReflectionToggle.addEventListener("click", () => {
    wormPainter.showReflectionLine = !wormPainter.showReflectionLine;
    syncWormEditorGuideControls();
    renderWormPaintCanvas();
    drawWormEditorPreview();
  });
  wormMirrorPairToggle.addEventListener("click", () => {
    const pairName = wormLayerPair(wormPainter.activeLayer);
    if (pairName === "jaw") {
      wormPainter.mirroredJawSource =
        wormPainter.mirroredJawSource === wormPainter.activeLayer
          ? null
          : wormPainter.activeLayer;
    } else if (pairName === "mouth") {
      wormPainter.mirroredMouthSource =
        wormPainter.mirroredMouthSource === wormPainter.activeLayer
          ? null
          : wormPainter.activeLayer;
    } else {
      return;
    }
    syncWormEditorGuideControls();
    renderWormPaintCanvas();
    drawWormEditorPreview();
  });
  wormMouthJawOverlayToggle.addEventListener("click", () => {
    wormPainter.showMouthJawOverlay = !wormPainter.showMouthJawOverlay;
    syncWormEditorGuideControls();
    renderWormPaintCanvas();
  });
  wormClearLayerButton.addEventListener("click", () => {
    const definition = WORM_LAYER_DEFINITIONS[wormPainter.activeLayer];
    const layer = wormPainter.layers[wormPainter.activeLayer];
    layer.getContext("2d").clearRect(0, 0, definition.width, definition.height);
    markWormPainterBodyCompositeDirty(wormPainter.activeLayer);
    renderWormPaintCanvas();
    drawWormEditorPreview();
  });
  wormImportLayerInput.addEventListener("change", async () => {
    const file = wormImportLayerInput.files?.[0];
    if (!file) return;
    const layerName = wormPainter.activeLayer;
    const objectUrl = URL.createObjectURL(file);
    try {
      copyImageToWormLayer(layerName, await loadImageSource(objectUrl));
      setWormPaintLayer(layerName);
      drawWormEditorPreview();
    } catch {
      updateWormPaintStatus("Could not import that PNG");
    } finally {
      URL.revokeObjectURL(objectUrl);
      wormImportLayerInput.value = "";
    }
  });
  worldSelectClose.addEventListener("click", closeWorldSelect);
  newWorldButton.addEventListener("click", () => openWorldEditor());
  editorCancelButton.addEventListener("click", () => closeWorldEditor(true));
  editorSaveButton.addEventListener("click", saveEditedWorld);
  editorFitButton.addEventListener("click", fitEditorWorld);
  document.querySelectorAll("[data-editor-tool]").forEach((button) => {
    button.addEventListener("click", () => setEditorTool(button.dataset.editorTool));
  });
  brushShapeInput.addEventListener("change", () => {
    editor.brushShape = brushShapeInput.value;
    drawWorldEditor();
  });
  brushSizeInput.addEventListener("change", () => {
    editor.brushSize = Number(brushSizeInput.value);
    drawWorldEditor();
  });
  resetButton.addEventListener("click", () => {
    reset();
    closeMainMenu(true);
  });
  window.addEventListener("resize", resize);

  async function initialize() {
    populateDevEnemyButtons();
    loadCustomWorlds();
    loadSelectedWorld();
    loadSavedWormType();
    await loadSavedWormAppearance();
    // Build the seven bounded liquid-density sprites before play. Leveling up
    // can then change spray density without compiling a new atlas mid-frame.
    prewarmAcidClusterAtlases();
    resize();
    showHomeScreen();
    requestAnimationFrame((time) => {
      game.lastTime = time;
      game.lastRenderTime = time;
      game.fpsSampleStart = time;
      game.fpsLastFrameTime = time;
      requestAnimationFrame(loop);
    });
  }

  initialize();
})();
