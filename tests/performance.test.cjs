const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../game.js"), "utf8");
function functionSource(name) {
  const match = new RegExp(`  function\\*? ${name}\\(`).exec(source);
  assert.ok(match, name);
  return source.slice(match.index, source.indexOf("\n  }", match.index) + 4);
}
function contextWith(functions, globals) {
  const context = vm.createContext(globals);
  vm.runInContext(functions.map(functionSource).join("\n"), context);
  return context;
}
const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
const lerp = (a, b, t) => a + (b - a) * t;
const periodicX = (width) => (x, reference) =>
  x + Math.round((reference - x) / width) * width;
const random = (() => {
  let seed = 98174;
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
})();

test("mouth broad phase matches the exact sweep across turns, growth, and world seams", () => {
  for (const width of [100, 30720]) {
    const c = contextWith([
      "eatHitboxPoseAlongSweep", "squaredDistanceToSegment", "targetOverlapsEatConeAtPose",
      "eatConeSweepBounds", "targetTouchesEatCone",
    ], { clamp, lerp, nearestPeriodicWorldX: periodicX(width) });
    let hits = 0;
    for (let i = 0; i < 12000; i++) {
      const angle = random() * Math.PI * 2;
      const turn = (random() * 2 - 1) * Math.PI;
      const x = (random() * 3 - 1) * width, y = random() * 500;
      const sweep = {
        previous: { x, y, angle },
        current: { x: x + (random() - 0.5) * 1200, y: y + (random() - 0.5) * 1200, angle: angle + turn },
        angleDelta: turn, steps: 40,
      };
      const cone = { pivotOffset: (random() - 0.5) * 500, range: random() * 600, halfAngle: random() * Math.PI };
      const target = { x: x + (random() - 0.5) * 2000, y: y + (random() - 0.5) * 2000, radius: random() * 200 };
      let exact = false;
      for (let step = 0; step <= sweep.steps; step++) {
        if (c.targetOverlapsEatConeAtPose(target, c.eatHitboxPoseAlongSweep(sweep, step), cone)) {
          exact = true;
          break;
        }
      }
      hits += exact;
      assert.equal(c.targetTouchesEatCone(target, sweep, cone), exact, JSON.stringify({ width, sweep, cone, target }));
    }
    assert.ok(hits > 100);
  }
});

test("faraway mouth candidates never execute exact geometry; tangent and oversized targets remain candidates", () => {
  let exactCalls = 0;
  const c = contextWith(["eatConeSweepBounds", "targetTouchesEatCone"], {
    nearestPeriodicWorldX: periodicX(10000),
    eatHitboxPoseAlongSweep: () => ({}),
    targetOverlapsEatConeAtPose: () => { exactCalls++; return true; },
  });
  const sweep = { previous: { x: 0, y: 0 }, current: { x: 10, y: 10 }, steps: 500 };
  const cone = { pivotOffset: 10, range: 20 };
  for (let i = 0; i < 10000; i++) {
    assert.equal(c.targetTouchesEatCone({ x: 2000, y: 2000, radius: 30 }, sweep, cone), false);
  }
  assert.equal(exactCalls, 0);
  assert.equal(c.targetTouchesEatCone({ x: 50, y: 5, radius: 10 }, sweep, cone), true);
  assert.equal(c.targetTouchesEatCone({ x: 1000, y: 0, radius: 1000 }, sweep, cone), true);
  assert.equal(exactCalls, 2);
});

function particleContext() {
  const c = contextWith([
    "clearParticles", "reserveParticleSpawns", "acquireParticle", "spawnParticles",
    "spawnBiteSplatter", "spawnWormChunkSplash", "updateParticles",
  ], {
    game: { particles: [], particlePool: [], particleSpawnsRemaining: 280, velocity: { x: 20, y: 10 } },
    BITE_SPLATTER_RULES: { particleLimit: 280, baseCount: 24, sideAngle: 0.5, angleSpread: 1,
      minimumSpeed: 10, maximumSpeed: 20, minimumLife: 0.2, maximumLife: 0.5, velocityCarry: 0.2, gravity: 300 },
    TRISTAR_RULES: { wormLethalChunkParticlesPerSegment: 4 }, TAU: Math.PI * 2, clamp, lerp,
  });
  return c;
}

test("large particle bursts have a shared creation budget before allocation", () => {
  const c = particleContext();
  let acquisitions = 0;
  const acquire = c.acquireParticle;
  c.acquireParticle = () => { acquisitions++; return acquire(); };
  c.spawnParticles(0, 0, 100000, "growth");
  for (let i = 0; i < 1000; i++) c.spawnBiteSplatter(0, 0, 0);
  c.spawnWormChunkSplash(0, 0, 0, 2, 100000);
  assert.equal(acquisitions, 280);
  assert.equal(c.game.particles.length, 280);
  assert.equal(c.game.particleSpawnsRemaining, 0);
});

test("particles reuse objects after expiry and eviction without replacing the active array", () => {
  const c = particleContext(), g = c.game, array = g.particles;
  c.spawnWormChunkSplash(0, 0, 0, 2, 280);
  const identities = new Set(g.particles);
  g.particleSpawnsRemaining = 280;
  c.spawnBiteSplatter(2, 3, 0, 1, 140);
  assert.ok(g.particles.every(p => identities.has(p)));
  c.updateParticles(10);
  assert.equal(g.particles.length, 0);
  assert.equal(g.particlePool.length, 280);
  g.particleSpawnsRemaining = 280;
  c.spawnParticles(0, 0, 280, "dirt");
  assert.ok(g.particles.every(p => identities.has(p)));
  assert.equal(g.particles, array);
  c.clearParticles();
  assert.equal(g.particlePool.length, 280);
  assert.equal(g.particleSpawnsRemaining, 280);
});

function spawnContext() {
  const kinds = { BEETLE: "beetle", TRISTAR: "tristar", MOLE: "mole", VULTURE: "vulture" };
  const g = { roundUnspawnedPoints: 100, roundPopulationCap: 20, roundSpawnPending: null,
    roundSpawnBlockedLiveCount: -1, roundSpawnBlockedPoints: -1, roundSpawnBlockedNextTargetId: -1,
    roundSpawnRetryAt: 0, roundSpawnAttemptSerial: 0, roundSpawnSerial: 0, activeWorldId: "test",
    nextTargetId: 0, totalTargets: 0, elapsed: 0, targets: [], capturedTargets: [], map: {} };
  const clock = { now: 0, probes: 0, initialized: 0, invalid: false, cost: 1 };
  const tick = (time) => { clock.now += time * clock.cost; };
  const counts = () => new Map([["tristar", g.targets.length]]);
  const c = contextWith(["searchRoundSpawnTarget", "refillRoundTargetsTimeSliced", "deferRoundSpawnRetry"], {
    game: g, ENEMY_TYPES: kinds, ENEMY_DEFINITIONS: { tristar: { score: 1 } },
    ENEMY_SPAWN_RULES: { maximumRefillWorkMs: 1, maximumRefillSpawnsPerUpdate: 4, placementAttempts: 32,
      tristarPlacementChoices: 6, failedPlacementRetryDelay: 0.5 },
    ENEMY_BEHAVIOR_RULES: { maximumChecksPerSecond: 30 }, BLOCK_SIZE: 12,
    performance: { now: () => clock.now },
    roundSpawnSourcePoint: () => { tick(0.35); clock.probes++; return { x: clock.probes, y: 1, regionType: "ground" }; },
    createEnemyTarget: (kind, x, y, regionType, rng, initialize) => {
      assert.equal(initialize, false); tick(0.25);
      return { id: g.nextTargetId++, kind, x, y, regionType, radius: 2, scoreValue: 1 };
    },
    keepEnemyInsideWorld: () => {}, getVisibleWorldBounds: () => ({}),
    roundSpawnPointIsAvailable: () => { tick(0.2); return !clock.invalid; },
    sameKindSpawnSeparationSquared: () => { tick(0.2); return 10; },
    enemyPopulationLimit: () => g.roundPopulationCap,
    liveEnemyCount: () => g.targets.length + g.capturedTargets.length,
    liveEnemyKindCounts: counts,
    availableEnemyKindSlots: () => Math.max(0, Math.floor(g.roundPopulationCap / 2) - g.targets.length),
    seededRandom: () => () => 0.5, hashString: () => 1,
    randomAffordableRoundSpawnKind: () => g.targets.length < Math.floor(g.roundPopulationCap / 2) ? "tristar" : null,
    initializeTristarTarget: () => { tick(0.2); clock.initialized++; },
    reserveRoundPointsForTarget: (t) => { g.roundUnspawnedPoints -= t.scoreValue; g.roundSpawnSerial++; return true; },
    positiveModulo: (a, b) => ((a % b) + b) % b,
  });
  return { c, g, clock };
}

test("refills resume candidate searches and only initialize/charge accepted spawns", () => {
  const { c, g, clock } = spawnContext();
  c.refillRoundTargetsTimeSliced();
  assert.ok(g.roundSpawnPending);
  assert.equal(g.targets.length, 0);
  assert.equal(g.roundUnspawnedPoints, 100);
  assert.equal(clock.initialized, 0);
  const pending = g.roundSpawnPending;
  g.nextTargetId = 99; // Another subsystem can create a target while this search waits.
  for (let i = 0; i < 30 && g.targets.length === 0; i++) {
    assert.equal(g.roundSpawnPending, pending);
    const before = clock.now;
    c.refillRoundTargetsTimeSliced();
    assert.ok(clock.now - before <= 1.61, "soft deadline can overrun by one atomic phase only");
  }
  assert.equal(g.targets.length, 1);
  assert.equal(g.targets[0].id, 99);
  assert.equal(g.nextTargetId, 100);
  assert.equal(g.roundUnspawnedPoints, 99);
  assert.equal(clock.initialized, 1);
  assert.ok(clock.probes >= 6);
});

test("resumed spawns revalidate placement, quota, and available points", () => {
  for (const invalidation of ["placement", "quota", "points", "world"]) {
    const { c, g, clock } = spawnContext();
    const target = { kind: "tristar", x: 1, y: 1, radius: 2, scoreValue: 1 };
    const pending = { kind: "tristar", map: g.map, worldId: g.activeWorldId,
      random: () => 0.5, result: { target, allowVisible: false } };
    g.roundSpawnPending = pending;
    if (invalidation === "placement") clock.invalid = true;
    if (invalidation === "quota") g.roundPopulationCap = 1;
    if (invalidation === "points") g.roundUnspawnedPoints = 0;
    if (invalidation === "world") g.map = {};
    c.refillRoundTargetsTimeSliced();
    assert.equal(g.targets.includes(target), false);
    assert.notEqual(g.roundSpawnPending, pending);
    assert.equal(clock.initialized, 0);
  }
});

test("failed searches keep the 32-probe limit and retry backoff", () => {
  const { c, g, clock } = spawnContext();
  clock.invalid = true;
  for (let i = 0; i < 100 && g.roundSpawnRetryAt === 0; i++) c.refillRoundTargetsTimeSliced();
  assert.equal(clock.probes, 32);
  assert.equal(g.roundSpawnPending, null);
  assert.equal(g.roundSpawnRetryAt, 0.5);
  c.refillRoundTargetsTimeSliced();
  assert.equal(clock.probes, 32);
  g.elapsed = 0.6;
  c.refillRoundTargetsTimeSliced();
  assert.ok(clock.probes > 32);
});

test("cheap refills still obey the four-spawn and population quotas", () => {
  const { c, g, clock } = spawnContext();
  clock.cost = 0;
  c.refillRoundTargetsTimeSliced();
  assert.equal(g.targets.length, 4);
  c.refillRoundTargetsTimeSliced();
  assert.equal(g.targets.length, 8);
  c.refillRoundTargetsTimeSliced();
  assert.equal(g.targets.length, 10);
  assert.equal(g.roundUnspawnedPoints, 90);
});

function terrainContext() {
  let draws = 0;
  const context = { setTransform() {}, clearRect() {} };
  const cache = { layers: new Map(), zoom: NaN, buildsRemaining: 0 };
  const c = contextWith([
    "resetTerrainDepthCache", "prepareTerrainDepthCache", "terrainDepthCacheMatches", "cachedTerrainDepthLayer",
  ], {
    terrainDepthCache: cache,
    game: { viewport: { width: 100, height: 80 }, dpr: 1, camera: { x: 0, y: 0, centerX: 50, centerY: 40 } },
    TERRAIN_DEPTH_CACHE_RULES: { maximumBuildsPerFrame: 1, paddingPixels: 64, maximumPixels: 8 * 1024 * 1024 },
    TERRAIN_MATERIALS: ["ground"], terrainDepthTexturePatterns: {},
    document: { createElement: () => ({ width: 1, height: 1, getContext: () => context }) },
    drawTerrainContourPaths: () => { draws++; },
  });
  return { c, cache, draws: () => draws, layer: { id: "near", perspectiveScale: 0.992, visibleDepthPixels: 14 },
    items: [{ chunk: { depthPaths: { ground: { hasEdges: true,
      minimumX: -20000, minimumY: -20000, maximumX: 20000, maximumY: 20000 } } }, worldOffsetX: 0 }] };
}

test("terrain depth reuses static strokes through camera movement, with bounded warmup", () => {
  const { c, cache, draws, layer, items } = terrainContext();
  c.prepareTerrainDepthCache(1);
  assert.equal(c.cachedTerrainDepthLayer(layer, items, 1), null);
  c.prepareTerrainDepthCache(1);
  const entry = c.cachedTerrainDepthLayer(layer, items, 1);
  assert.ok(entry);
  assert.equal(draws(), 1);
  assert.equal(cache.buildsRemaining, 0);
  assert.equal(c.cachedTerrainDepthLayer({ ...layer, id: "far" }, items, 1), null);
  for (let i = 0; i < 30; i++) {
    c.game.camera.x++;
    c.game.camera.centerX++;
    c.prepareTerrainDepthCache(1);
    assert.equal(c.cachedTerrainDepthLayer(layer, items, 1), entry);
  }
  assert.equal(draws(), 1);
  c.game.camera.x += 1000;
  c.game.camera.centerX += 1000;
  c.prepareTerrainDepthCache(1);
  c.cachedTerrainDepthLayer(layer, items, 1);
  assert.equal(draws(), 2);
});

test("terrain cache rejects changed chunks, periodic copies, zoom, DPR, and viewport", () => {
  for (const change of ["chunk", "wrap", "zoom", "dpr", "viewport"]) {
    const { c, cache, layer, items } = terrainContext();
    c.prepareTerrainDepthCache(1); c.prepareTerrainDepthCache(1);
    c.cachedTerrainDepthLayer(layer, items, 1);
    if (change === "chunk") items[0] = { ...items[0], chunk: { depthPaths: { ground: { hasEdges: true } } } };
    if (change === "wrap") items[0] = { ...items[0], worldOffsetX: 1000 };
    if (change === "dpr") c.game.dpr = 2;
    if (change === "viewport") c.game.viewport.width++;
    if (["zoom", "dpr", "viewport"].includes(change)) c.prepareTerrainDepthCache(change === "zoom" ? 0.4 : 1);
    cache.buildsRemaining = 0;
    assert.equal(c.cachedTerrainDepthLayer(layer, items, change === "zoom" ? 0.4 : 1), null, change);
  }
});

test("terrain bitmap memory is bounded and reset releases canvases", () => {
  const { c, cache, layer, items } = terrainContext();
  c.prepareTerrainDepthCache(1); c.prepareTerrainDepthCache(1);
  const bitmap = c.cachedTerrainDepthLayer(layer, items, 1).canvas;
  c.game.viewport.width = 10000; c.game.viewport.height = 10000;
  c.prepareTerrainDepthCache(1); c.prepareTerrainDepthCache(1);
  assert.equal(bitmap.width, 1);
  assert.equal(c.cachedTerrainDepthLayer(layer, items, 1), null);
  assert.equal(cache.layers.size, 0);
});
