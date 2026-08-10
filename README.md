# WORM

A dependency-free, full-screen 2D browser game prototype.

## Run

Serve this directory with any static file server:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Controls

- `A` / `D` — steer
- `W` — accelerate while underground
- `S` — brake quickly while underground or crawling on stone
- `Space` + `W` — boost to 1.5× speed while underground
- Hold `Space` while airborne — hold the mouth open without spending boost
- As Licker, click or tap anywhere — target easy or normal prey near that point and spit the tongue
- As Licker while airborne, hold click or touch near hard prey — tongue grapple
- While tongue-grappling, hold `W` to reel in rapidly; add `Space` to reel faster using boost
- `A` / `D` have no effect while tongue-grappled
- Hold `Space` near hard prey underground — latch attack
- On a stone surface: `W` moves forward, `A` / `D` choose its direction, and `S` brakes
- `F` — open or close Developer Tools
- `Esc` — open or close the game menu

The **Menu** button provides Worlds, Worm Type, Edit Worm, Enemy Information, Pause, Reset, and
Developer Tools. **Enemy Information** opens a full-screen field guide generated from
the enemy registry. It lists each enemy's point value, maximum HP, and prey class at the
worm's current bite force, so new enemy definitions appear there automatically. Dropped
meat is omitted because it is a variable-value pickup rather than an enemy.

## Worm types

The selected worm can be changed from the intro card or **Menu → Worm Type**, and the
choice is retained in browser storage. **Licker** is the original worm and owns the
complete articulated-tongue ability: prey capture, multi-tongue targeting, and airborne
hard-prey grappling. **Spitter** currently uses the same movement, growth, bite, boost,
body, and appearance behavior, but it cannot create or grapple with tongues; its unique
ability is intentionally left open for the next implementation.

Each type has its own scaling record for base entity scale, size and segment growth,
growth costs, bite-force growth, and boost-capacity growth. Licker and Spitter currently
use identical values, but they can be tuned independently without branching the shared
movement and level systems. Switching types preserves the current level and boost-charge
ratio. If Licker has an active tongue when the type changes, its tether is safely removed
and any currently captured target is released.

Prey classes always use maximum HP relative to the worm's current bite force: **easy prey**
has at most 1× bite force in HP, **normal prey** has more than 1× but no more than 2×, and
**hard prey** has more than 2×. Exact 1× therefore counts as easy and exact 2× counts as
normal. These labels update as the worm's bite force grows.

All gameplay entities currently use an experimental 62.5% global size multiplier—25%
larger than the previous 50% experiment. This scales the worm's rendered and physical
dimensions—including segment spacing, collision, mouth geometry, and tunnel width—and
scales enemy and meat sprite/hurtbox sizes by the same amount.
The worm starts with 16 body segments and gains one additional segment per level.
Entity scaling does not alter world coordinates, the 12 px terrain grid, material
textures, stone contours, camera framing, movement speeds, scores, or health values.
The top-left HUD contains a local minimap in place of the prototype logo. It shows
nearby air, soil, tunneled soil, and stone; pink points mark nearby enemies and pale
points mark meat. The outlined rectangle is the current camera view and the orange
arrow is the worm's position and facing direction. The terrain and target layer updates
at 10 Hz from a small fixed-resolution sample while the camera rectangle and worm marker
remain frame-responsive, so the minimap never scans or renders the entire world.
Opening Developer Tools also reveals the live FPS readout, an FPS-limit selector, the
current terrain state, and a live performance-gate panel; all stay hidden during normal
play. The frame cap can be set to 30, 60, or 120 FPS, or left uncapped. Uncapped rendering
still follows the browser's `requestAnimationFrame` cadence, which browsers normally
synchronize to the display and may restrict to 60 Hz on some Chromium/platform
combinations. The profiler samples only while Developer Tools is open. It displays the
observed frame interval and peak, target budget, average update and Canvas submission
times, estimated lost frames, terrain chunk builds and evictions, and approximate raw
terrain-cache bitmap memory. Its colored result distinguishes cache/CPU spikes,
main-thread Canvas pressure, mixed pressure, and likely raster/GPU presentation delays.
Because Canvas 2D does not expose direct GPU timers, the raster/GPU result is explicitly a
heuristic used only when presentation is late while measured main-thread work remains
below budget.
Pressing `F` toggles the panel directly. Its individual developer overlays and Swarm
remain controlled by the toggles inside the panel. The **Hitboxes / hurtboxes** overlay displays
the worm's swept cone-shaped eating hitbox, enemy hurtboxes, and the larger
mouth-animation sensor using the same geometry as the gameplay calculations. It also
draws the tongue-avoidance head and tapered body clearance circles, switching them from
dashed to solid while a captured tongue retracts. It additionally
shows the visual head collision circle and the smaller dashed-orange stone-latch probe
on its world-down side. While tongues are active, it displays each level-scaled,
pointer-centered target-search circle and the number of unique enemy locks it acquired. The eat
cone begins at the jaws' hinge, opens to the same maximum angle as the animated jaws,
reaches the front edge of their PNG rectangles, and scales with the rest of the worm.
It also draws the smoothed stone contours used for traversal. Each world load builds a
signed-distance field from the stone grid, extracts cluster-local boundaries with
marching squares, smooths those boundaries, and projects inward samples back outside
the solid terrain. Upward-facing spans become traversal paths; short neutral spans around
small steps remain part of the same curve, while long walls and undersides are excluded.
Standalone spans whose horizontal extent is no more than one 12 px block are discarded.
The currently occupied surface is highlighted.
The separate **Combat stats** overlay labels active and captured enemies with HP and
shows the worm's current level-scaled bite force beside its mouth.

A second gameplay-controls panel opens with Developer Tools. Its worm-level field
overrides the score-earned level, updating the worm's size, segment count, bite force,
and boost capacity immediately. Points continue tracking their natural level while an
override is active; clearing the field returns control to that score-derived level.
The enemy-placement buttons add one selected enemy at a rotating position in the
current camera view. Buttons are generated from the enemy registry, so newly registered
enemy types are included automatically.

While control input is held, the worm can steer its airborne momentum but cannot
accelerate in open air. Holding Boost while airborne opens the mouth without consuming
boost charge; bite and eating animations still take priority. It regains acceleration
after returning to ground. A low-speed
landing on an exposed stone contour switches to surface-crawling controls instead.
Air steering applies a force perpendicular to the current momentum while gravity
applies a separate, constant world-down force. If gravity exceeds an upward turn force,
the resulting force still points downward. Releasing every control stops the worm
underground; airborne momentum continues until re-entry.
Airborne gravity is fixed at 775 world pixels per second squared, increased from 515.
Ordinary airborne movement and tongue-grapple freefall use this same downward
acceleration.

Clicks in ground, air, or surface-crawling movement launch targeted tongues from the back
of the head, straight through its center to the front edge. That straight centerline supplies
each tongue's starting tangent before a chain of fixed-length segments turns toward its enemy.
Each segment begins at the endpoint of the previous segment and can change direction by
an increasing amount: the first rung after the mouth has 10 degrees of turn freedom,
the final rung has 30 degrees, and the limits between them are interpolated evenly.
This gives the tongue an articulated bend instead of a continuous mathematical curve.
The worm has one simultaneous tongue at levels 0–2 and gains one additional tongue every
three levels: levels 3, 6, 9, and so on. Before launch, a circle centered on the click searches
for eligible enemies and meat chunks.
Its radius is always 15 blocks and does not change with the worm's level. Easy and normal
prey qualify; hard prey use the held airborne grapple instead. Meat uses its normal 1 HP
and participates in the same value-priority ordering. Pulling meat fully
back to the mouth also clears its post-drop overlap protection so it can enter the bite flow.
Available
tongues claim qualifying enemies from highest to lowest point value, using proximity to the
click and then target ID to break ties, and every tongue must have a unique target. Only the
number of tongues needed for the acquired targets appears; a click with no
qualifying target launches nothing.
Each tongue's flexible mouth-to-tip reach equals the worm's current head-to-tail length,
including growth levels. Its straight rear-to-front passage through the head is additional
and no longer deducted from that usable range. The tip reaches the selected point when the
per-segment turning and reach limits allow it; otherwise the segment chain continues
steering toward that point.
When the tongue touches its selected enemy, that enemy is paralyzed and attached to the
last rung. The articulated tongue then becomes a gravity-driven dangling chain, holds
briefly in free fall, and retracts by shortening every rung toward the moving mouth anchor.
Captured and empty tongues retreat at their fixed animation rates regardless of the worm's
level or tongue length. A target selected by a tongue is reserved from the normal eating
collision throughout extension, capture, and retreat. Its eating animation can begin only
after the tongue has fully returned to the mouth and has been removed.
During that retraction, each link predicts near-future contact with a doubled-radius
clearance silhouette around the worm. That silhouette has an additional 1.5× multiplier
at the head and first body segment, decreases linearly through the intermediate segments,
and reaches a 0.5× multiplier at the final tail segment. A threatened link then makes a
high-speed overcompensating outward turn before it reaches
the head or body, with a small capped positional correction to
prevent visible clipping without replacing the free-fall chain with a fixed route.
Once it returns to the mouth, the enemy remains paralyzed and enters the normal bite flow.
From the moment the tongue latches until retraction finishes, the captured enemy rotates
with the live angle of the tongue's final segment.
While the worm is airborne, pressing and holding searches the same 15-block circle used for
easy and normal prey, then launches one tongue toward the highest-value available hard prey
inside it, using distance and target ID as tie breakers. There is no separate pre-launch
distance gate: it extends with the same maximum length, segmented pathing, and turn limits,
and contact with the real articulated tongue decides whether it latches. The animation remains
active while the pointer stays held. Hard prey are not paralyzed by this grapple: their
normal movement and animation continue, and the tongue tip follows their live position as
the moving anchor. After contact, the worm's head and body enter gravity-driven freefall,
hanging and swinging from the head end of the tongue. The latched tongue behaves as an
elastic tether: it stretches visibly away from its contact length, becomes progressively
more resistant near full extension, and rebounds inward. A hard safety response at 98.5%
of maximum length reflects outward momentum, so even an extreme launch cannot fully extend
or cross the tether while tangential swinging remains unaffected. The head
faces the anchored hard prey throughout the latch without changing the worm's velocity
vector. A and D have no effect in this state. Holding W rapidly shortens both the resting
and maximum rope lengths, and its tension pulls the worm
toward the enemy at a fixed reel rate. Holding Boost with W spends boost charge and
increases that rate. If the boosted pull brings the worm's swept head collision into the
anchored hard prey, the tongue releases and begins the existing four-bite boost-latch attack
immediately. Releasing or cancelling the pointer before that contact leaves the enemy's
movement uninterrupted, preserves the worm's current momentum, and runs the existing articulated
tongue-retraction algorithm from the exact pose reached at release. The former anchor's
mouth collision stays suppressed until the worm fully clears it, preventing the normal
heavy-enemy bounce from overwriting that release momentum. Worm, enemy, body, and terrain
collisions do not toggle the held latch. Ordinary click tongues retain their existing
radius-based, highest-value targeting behavior for easy and normal prey.
Its layered silhouette begins thick at the rear-head anchor and continuously tapers to
a pointed tip. A separate editable tongue-ring PNG repeats at each articulated joint
along that silhouette. Every tongue layer is rendered behind the worm. Tongue rungs do not
collide with terrain; only the selected enemy can trigger the new tip-capture behavior.

Boost starts with 2 seconds at size level 0, increases to 3 seconds at level 1,
and gains another second of capacity with every later size level. It drains only
while actively boosting underground and recharges at one second per second after
the Boost control is released.

Beetles, dragonflies, vultures, moles, and rabbits are distributed deterministically through each
world. Population density is approximately one enemy per 2,250 eligible blocks, clamped
between 16 and 72 enemies when enough spawn blocks exist. The distribution favors lower-tier
prey: 60% beetles, 25% dragonflies, 8% moles, 5% rabbits, and 2% vultures, with whole-enemy
rounding performed deterministically for each world. Six enemies are preferentially placed
within the nearby spawn band. Worlds containing ground place beetles and moles underground,
rabbits on the nearest solid top surface, and both flying species above the nearest surface;
all-air worlds place every enemy in air. An enemy
turns in place by a randomly selected angle of up to 180 degrees, moves a short distance
at a constant speed, and repeats without an idle phase. Each move lasts half as long as
its preceding turn, so the turn, start, and stop are visibly distinct. Beetle legs use
a two-frame PNG scurry, with the frames advancing half as quickly while turning. Beetles
use a 2× appearance, collision, movement, falling, and burrowing scale; moles use the
same motion pattern at a 3.75× scale. If an enemy reaches exposed air or falls from the underside of
terrain, the same 775-pixel-per-second-squared world gravity used by the worm pulls it
down and it immediately burrows into the next ground surface
it encounters. Running the worm's head through an enemy eats it, produces a burst, and
reduces the remaining-target count. Collision checks follow the full distance traveled
by the head each frame so enemies still register at maximum speed.

Rabbits use a 90 × 90 world-pixel sprite and a 30.9-pixel hurtbox radius, exactly 1.2×
the mole's dimensions. Each rabbit has 12 HP and is worth 10 points. It rests for a
random 1.25–3 seconds, chooses left or right, and jumps with a 78-pixel horizontal speed
and 165-pixel upward impulse. Gravity pulls it back down, and swept collision against
every non-air block lets it land on soil, stone, and future solid materials without
tunneling through thin terrain. Separate grounded and extended-leg PNG frames show its
current phase. Both frames use a strict right-facing side profile and mirror horizontally
when the rabbit moves left, keeping its feet beneath its body.

Dragonflies are 12.5% larger than beetles and remain airborne. Each one hovers ten blocks
above the first ground or stone surface beneath it with a small vertical bob. After a
random 2.25–4 second pause it abruptly chooses left or right, bursts horizontally at 260
world pixels per second for 0.32–0.68 seconds, then stops to hover again. It accelerates
vertically toward changing hover heights at 420 pixels per second squared, capped at 220
pixels per second, so crossing onto higher terrain produces a climb instead of a snap.
Only actual overlap with solid terrain is corrected to the terrain edge. Two side-profile
PNG wing poses animate throughout both movement phases. The
right-facing art is mirrored for leftward travel, keeping its body parallel to the
terrain and its legs oriented toward the ground. A dragonfly senses the worm within 260
world pixels and immediately switches to a panic flight: it traces fast circular arcs
whose radius, turn direction, angular speed, and lateral drift change at irregular short
intervals. It calms down after the worm moves beyond 320 pixels, preventing rapid state
flicker at the edge of its vicinity. Once captured by a bite, every enemy rotates with
the worm's live head orientation and points inward while traveling toward the throat.

Vultures patrol continuously at 105 world pixels per second. Each leftward or rightward
pass independently spans a random 16–48 blocks before reversing, so their travel distance
varies without introducing pauses. A 30-pixel vertical sine bob runs throughout the
route. They fly with 80 blocks of terrain clearance—four times their previous height—and
follow the first ground or stone surface beneath them. The side-profile PNG is mirrored
at each reversal. A vulture's 225-pixel sprite and 77.3-pixel hurtbox radius are exactly
three times the mole's rendered dimensions. It has 160 HP and is worth 160 points.

Above-ground animals use right-facing side-profile artwork by default. Their movement
orientation mirrors that artwork for leftward travel; underground creatures
retain their existing terrain-oriented presentation.

The split upper and lower jaws stay shut until an enemy enters the head's detection
radius. They then pivot apart at the neck to reveal the mouth and teeth. Contact forces
a bite, and every jaw closure emits a dense crimson liquid spray from the prey. Many
small, round particles spray to both sides of the jaws under gravity and are divided
between the layers behind and in front of the worm. Bite force starts at 2 and grows by 1.25× with
each size level, while every enemy type has its own health. Damage at least twice
an enemy's health counts as an instant kill but still plays one complete visual bite;
damage between one and two times its health uses two bite loops. Weaker attacks extend
the same timer for additional loops rather than queuing separate animations. A
one-bite instant kill never shortens a longer bite sequence already in progress.

Hard prey cannot be captured by normal contact, even after its current HP falls below the
hard-prey threshold because classification uses maximum HP. Contact reverses and dampens
the worm's momentum while leaving the enemy alive. Holding Boost while underground targets
the nearest hard prey inside the mouth sensor and
spends boost charge while the worm rapidly curves toward it using a pursuit turn rate
above normal ground steering. The bite sequence
does not begin until the visual center of the head reaches
the enemy's center. While airborne, holding Boost does not target or pursue hard prey;
an actual swept-mouth collision instead starts the same latch directly at the point of
impact. The head then stays positionally locked there while the body keeps
its own inertial chain motion and the enemy plays its scurry animation at five times
normal speed. Each jaw closure sprays layered red splatter. Completing all four bites
removes one current bite-force value from the enemy's HP. If the enemy survives, the
damage reveals a short-lived health bar above it; subsequent completed attacks refresh
the display timer. The bar remains upright, scales for the current camera zoom, and fades
away after showing the enemy's remaining fraction of maximum HP. The
worm is thrown backward from its center at 1.5 times the calculated twenty-block launch
velocity. The surviving enemy's
hitbox stays disabled until a complete mouth-hitbox sweep no longer overlaps it, so the
embedded head can launch clear without immediately colliding again. A kill still
releases in place to produce the meat burst. Releasing Boost or exhausting charge
after the head has locked on interrupts the bite sequence without damage but applies
the same amplified release bounce in either terrain or air. Cancelling during the underground pursuit approach does not
bounce because the head has not latched yet. Boost must be released before starting
another latch. Hard-prey latch eligibility and ordinary-bite repulsion both use maximum HP,
while each completed latch still subtracts bite force from current HP. A 10-HP mole is hard
prey relative to a level-0 worm's 2-point bite force, so it requires five
completed latch attacks at level 0 and drops meat after the fifth.

An enemy reduced to zero HP by a latch drops several 1-HP meat pieces instead of
awarding its score directly. The original score is divided across those pieces without
changing its total. Meat uses
a replaceable placeholder PNG at twice its previous display and collision size, scatters
at five times its original launch velocity,
and remains protected from immediate
collection until the worm moves away from the defeat location. It then follows the
standard one-bite eating animation when collected. Once a chunk enters air, it uses the
same 775-pixel-per-second-squared world gravity as the worm, while swept
collision treats every non-air material—including soil, stone, and future materials—as
a solid surface, preventing fast chunks from tunneling through thin blocks. Meat is excluded from Swarm
duplication.

Enemies being eaten are captured at the point on the eat cone's curved outer arc that
is closest to their position. Capture animation uses a separate cone sharing the eat
hitbox's jaw-hinge tip and facing direction while extending 1.325× farther with 55% of
the hitbox's half-angle. Collision continues to use the original, wider hitbox cone.
Enemies retain their angular entry side while moving toward the jaw hinge for the
complete duration of their required bites before bursting into particles. Multiple
captured enemies overlap this motion and finish according to
their individual bite counts, while the mouth timer uses the longest required duration
rather than adding their animations together. Every captured enemy shrinks smoothly
from full size at the start of its approach to half size immediately before it reaches
the hinge and is removed. Each time the jaws reach the closed bite position, every
captured enemy still requiring that bite emits the directional crimson spray.

Soil, stone, decorative details, and material edges are rendered through offscreen
chunks in a viewport-aware LRU cache. Its capacity is based on the maximum chunk count
the current viewport can straddle instead of oscillating with the camera's momentary
alignment. Visible chunks are protected for the entire draw and eviction happens only
afterward, so row-major rendering cannot discard a chunk that the same frame still
needs. Chunk dimensions are 1,536 × 768 world pixels, matching the wide camera and
reducing Canvas submissions without increasing each chunk's pixel budget. At camera
zooms of 60% or below, terrain uses a half-resolution cached LOD rather than rasterizing
full-resolution source canvases and shrinking them every frame. While the worm moves,
the cache incrementally warms a complete one-chunk border around that zoomed-out view,
prioritizing its direction of travel. FPS-limited animation callbacks which intentionally
skip rendering perform this prefetch work first; rendered frames use it only when the
previous frame has enough measured headroom. This keeps jumps and sharp reversals from
synchronously regenerating a new row and column together.
Material-region and edge generation read the typed tile array directly. Decorative soil
and stone marks come from four reusable pre-rendered pattern variants, so a new chunk
receives its complete texture with one clipped pattern fill and never schedules a
background detail-regeneration task. When soil is tunneled, its runtime tile value changes
once and the dark replacement is painted directly into the one or two cached chunks on
each axis that can overlap that tile, rather than scanning the enlarged cache. A chunk
generated later reads the same tile value and starts with the dark
replacement already applied. Normal frames therefore perform no tunnel-history scan or
separate trail draw.

All body segments are sampled with one backward traversal of the recorded head path.
Segment following therefore scales with path length plus segment count instead of making
every segment rescan the path from the head. Retired head-path points advance through a
start cursor and are compacted only in large batches, avoiding a full array shift on
every moving frame. Path sample spacing retains at least eight samples per physical
segment instead of remaining fixed at three world pixels as the worm grows; this reduces
a level-100 path from roughly 4,400 samples to about 930 without changing segment count or
body length. Stationary and paused frames do not traverse that path at all. The gameplay
body-layout typed arrays are also reused rather than reallocated every frame. Simulation
still retains every segment and the complete head-to-tail path. The body and outline PNGs are precomposited into immutable cached bitmap stamps for
the current appearance and taper, replacing two transformed images with one. Gameplay
places those stamps only at every third simulation point plus both endpoints. The artwork
is longitudinally extended only enough to cover its unchanged share of the path. Stamps
and rings whose rotated bounds are outside the camera are not submitted to Canvas at all,
which is especially important once a gigantic worm extends far beyond the screen. Ring
PNGs retain their original count and positions, and head and tongue rendering are
unchanged. A level-50 worm therefore uses 23 combined body/outline stamps while keeping
all 66 physical segments and all 32 rings.

The developer menu's optional **Swarm** mode makes every eaten enemy produce two more
of the same type near its death position. Swarm-created enemies retain their type,
size, movement scale, and point value.

Each beetle is worth 1 point, each dragonfly is worth 4 points, each mole is worth
10 points, and each vulture is worth 160 points. Worm size starts at
level 0; reaching level 1 costs 5 points, then the per-level requirement follows a
1.3× curve rounded up to whole points: 7, 9, 11, 15, and so on. The cumulative
score thresholds begin at 5, 12, 21, 32, 47…. Each growth level adds one body
segment, adds 30 world pixels per second to the worm's unboosted maximum speed, and
increases every physical and visual worm dimension, including its collision radius and
tunnel width. Boost and ability-specific speed multipliers apply to that level-scaled
maximum.

## Enemy appearance sprites

All enemies render exclusively from transparent PNG files in `assets/enemies/`.
The active `*-handdrawn.png` files match the built-in worm's player-drawn bitmap
style: rough silhouettes, flat coral and ochre fills, vivid orange-red edge marks,
hot-pink structural accents, sparse dark-red spots, tooth-white details, and no shadows.
The mole and vulture keep dark umber bodies for quick species recognition. The game's sky, stone,
terrain accents, interface, particles, and debug colors share this exported worm palette.
Replacing those files changes enemy artwork without changing movement, score, collision,
or spawning behavior. See `assets/enemies/README.md` for canvas and orientation details.

## Worm appearance sprites

Each worm type resolves its own nine transparent default PNG layers from `assets/worm/`.
Licker uses the `licker-default-*.png` set extracted from the current saved Licker
appearance, including its custom tongue and tongue-ring art. The older `default-*.png`
set remains Spitter's provisional appearance, so changing Licker's bundled model does
not silently alter Spitter.

Each set provides upper and lower jaw layers, upper and lower mouth layers, body fill,
rings, outline, tongue, and tongue-ring textures. Licker's default mirrors the upper jaw
into the lower jaw and the upper mouth into the lower mouth, matching the saved design.
Those reflection settings are restored by **Load defaults** in the worm editor.

`WORM_TYPE_DEFAULT_SPRITE_FILES` and `DEFAULT_WORM_MIRRORING` in `game.js` are the
appearance entry points. Their paths and reflection settings can be changed to load
another sprite set without changing worm physics. The renderer rotates
each PNG along the body path, scales it through the existing taper, and applies the
same size multiplier as the worm grows. Sprite loading has no effect on collision,
movement, scoring, or segment-following behavior.

The files are authored at 2× resolution: both jaws and both mouth layers share a
128 × 96 canvas. Upper layers use the upper half and lower layers use the lower half.
With the current experimental entity scale, they are displayed as 40 × 30 world pixels
at size level 0. Each 80 × 80 body, tongue, or tongue-ring texture is repeated through its
respective segment chain and scaled by that chain's taper. Keep replacement files at those dimensions
with transparent backgrounds to preserve the shared neck pivot and alignment.

### In-game worm editor

Choose **Edit worm** from the game menu to open the appearance workshop. The editor
starts from the active worm and provides Upper Jaw, Lower Jaw, Upper Mouth, Lower Mouth,
Body, Rings, Outline, Tongue, and Tongue Rings layers. Select Paint or Erase, choose a
color and pixel brush size, then drag on the enlarged transparent PNG canvas. Fill
replaces an exact-color connected pixel region with the selected color; right-clicking
with Fill makes that region transparent. Fill follows the selected symmetry mode and
stays inside the editable half of split jaw and mouth layers. Right-drag always erases.
A PNG can also replace the selected layer and is resized to that layer's required
dimensions.

The Symmetry control can mirror each stroke across the horizontal axis, vertical axis,
or both axes. Horizontal symmetry is enabled by default for the body layers. The two
jaws are independent by default. **Mirror this jaw** makes the selected jaw the source
for both sides, greys out the opposite jaw tab, and disables editing it until mirroring
is turned off. The two mouth layers are also independent by default; **Mirror this
mouth** gives either selected mouth half the same source-and-lock behavior.

While editing any jaw or mouth layer, **Reflection line** displays their shared
centerline on both the paint canvas and live model. Both mouth layers also provide
**Open jaw overlay**, which places translucent, fully opened jaw textures over the
mouth canvas for alignment. Both are editor-only guides and are never written into
saved PNGs. The authored mouth position and orientation is the fully open endpoint.
While closing, each mouth half turns inward around the neck hinge so its edge stays
aligned with the corresponding moving jaw.

The live preview runs an isolated worm simulation with its own physics, body path,
camera, flat surface, and randomized control phases. It accelerates, coasts, brakes,
turns, breaches, falls, and dives while applying artwork changes immediately; none of
that movement touches the player worm or active world. Preview body and outline layers
use the same cached composite and every-third-point sparse path as gameplay, including
endpoint coverage, while preview rings retain every original position. Its tongue repeatedly extends,
swings toward changing random directions, retracts completely, and pauses before the
next cycle so both editable tongue layers can be judged in motion. The simulation runs only while
the appearance editor is open. **Load defaults** copies the built-in artwork into the
working canvases, while **Cancel** discards all unsaved edits. **Export worm** downloads
a shareable, versioned `.worm.json` package containing all nine PNG layers and the
jaw/mouth mirroring choices. **Import worm** loads a compatible package into the editor
for inspection or further changes but does not overwrite the saved appearance until
**Save worm** is selected. Saving applies the appearance to the game and stores its
nine PNG data URLs and optional jaw- and mouth-mirroring sources under
`worm.custom-appearance.v6` in browser `localStorage`, so the custom worm is restored on
the next visit. Earlier appearances are migrated automatically; their previously
reflected mouth is preserved as an independent lower-mouth image. Custom artwork
changes visuals only; physics, collision, scoring, growth, and body following remain
unchanged.

## Map grid

The environment is a fixed 30,720 × 27,648 pixel world made from a 2,560 × 2,304 grid of
12 × 12 pixel blocks. It no longer changes size when the browser window changes. The
built-in flat-world generator leaves rows 0–143 as air and fills rows 144–2,303 with
ground, providing exactly ten times the former underground depth. Its horizontal axis
loops: moving beyond the left or right edge continues from the opposite side without
changing momentum. Tile lookup, tunneling, enemies, tongues, terrain collision, camera
rendering, and the minimap all use the same periodic coordinates. The top and bottom
remain solid world boundaries.

Runtime materials use compact numeric tile values:

- `0` — air block with a blank texture
- `1` — ground block with the soil texture
- `2` — solid stone block with an unbreakable stone texture
- `3` — runtime-only tunneled soil; non-diggable but still governed by ground locomotion

Terrain access exposes each numeric cell as a logical block `type` and `texture` without
allocating a persistent object for every tile. Ground and air choose the worm's movement rules. Stone instead uses swept
head collision: the visual head cannot enter it, boosted movement cannot tunnel through
a thin wall, and side or underside impacts redirect and dampen the worm without changing
the block. Normal collision sweeps sample the cluster signed-distance field, so a thin
cluster behaves as one continuous shape instead of many overlapping expanded tile boxes.
If a frame begins in collision, penetration is corrected against that same field;
outward and tangential momentum is retained. Bounce direction changes also keep the neck
at its incoming contact pose instead of moving it around the contact point, preventing
thin walls from producing a head-offset-sized teleport. The old per-block sweep is used
only during the brief post-derail grace period, when one specific cluster must be ignored.
Every world load groups four-way-connected stone blocks into clusters. A
Euclidean signed-distance field is calculated only over the padded bounds occupied by
stone, and marching
squares extracts each cluster boundary. Two constrained smoothing passes round the block
steps; any sample pushed into stone is projected outward along the distance-field
gradient. Only upward-facing contour spans whose outward side touches an actual air
block are retained, so stone covered by ground remains solid but cannot become a rail.
Short neutral spans around local steps are folded into the same curve only while every
sample remains air-exposed. Long walls and undersides still end a surface, and an
unconnected span at most one block wide is discarded. Each cached sample
stores its world position, arc distance, tangent, and outward
normal. A dedicated circular latch probe occupies the world-down side of the visual
head. Its bottom extends 15% of the head radius below the regular collision circle, so
growth does not hide the traversal surface behind the larger head hitbox. A probe impact
below a displayed velocity of 200 attaches the worm to that curve. The incoming velocity
is projected onto the curve tangent, so the worm keeps its along-surface momentum and
immediately slides along the path instead of being stopped. Attachment remains one-sided:
the lower probe must cross an upward-facing part of the curve from its air/top side, so
walls and undersides cannot trigger it. A and D select which way
the worm faces, while W accelerates it forward in that direction. Releasing W makes
it coast to a stop, and S brakes more quickly. Faster impacts retain the normal stone
bounce. On attachment, the exact curve segment that registered the impact is projected
to the point nearest the visual head. Restricting projection to the touched segment
prevents another nearby fold of the same contour from pulling the worm elsewhere. The
corresponding neck position becomes the persistent rail position, so reversing with Left
or Right holds the base of the head still and swings the visual head around that pivot.
The head and neck ride at collision clearance along the contour normal, and their
curve separation is chosen to preserve the configured head offset without letting the
body chord cut through a rounded corner. Crossing a contour endpoint launches the worm away from the
nearby blocks in its stone cluster. A brief cluster-wide collision grace prevents the
surface from immediately recapturing the head during the outward pivot. The worm then
returns to airborne physics. The Hitboxes / hurtboxes developer overlay displays the
generated curves and highlights the one currently holding the worm.

The canvas is a viewport into that world. Its camera is recalculated from the worm's
world position every frame, placing the head at the exact center of the screen. Near a
horizontal seam, terrain chunks from the opposite edge are drawn beside the current
edge so the camera never exposes an empty strip. The view zooms out by 10% at every fifth growth level
(levels 5, 10, 15, and so on), with a minimum zoom of 40%. Resizing the browser changes
only the viewport.
Terrain graphics are generated and cached in nearby 1,536 × 768 world-pixel chunks so
the larger world does not require one map-sized bitmap. Zoomed-out terrain chunks use
half-resolution source canvases, while reusable pattern tiles keep their decoration
complete without deferred main-thread work.

## World library and editor

The world selector contains the protected built-in **Flat World** and any custom worlds
saved in the current browser. New custom worlds start with every block set to air.

The fullscreen editor supports ground and stone painting, erasing, connected-region
fills, spawn-point placement, and panning. Material and erase tools offer round, square,
horizontal, and vertical brushes at several sizes. Select Ground, Stone, or Erase before
Fill to choose the replacement material, then click any contiguous region. Drag to
paint, right-drag (or right-click with Fill) to erase regardless of the selected tool,
use the mouse wheel to zoom, and select tools from the editor toolbar. The editor keeps
the spawn tile free of stone.

Saving records one compact, typed material-run list plus the spawn tile in browser
`localStorage`. Each run identifies its material, start tile, and length; air is
implicit, while the save records its grid dimensions. This allows one world to contain
any number of registered material types without adding a new save field for each type.
Existing ground-only and separate ground/stone run saves migrate automatically when
loaded. The surface remains at row 144, while underground depth increases from 216 rows
to 2,160 rows—a tenfold increase—for a total height of 2,304 rows or 27,648 world pixels.
Existing custom worlds preserve every original coordinate and gain air in the new rows
below them. Version-2 worlds made on the former 640-column grid are copied row-by-row into
the 2,560-column grid, preserving their coordinates and adding air to the right. Saved
worlds can be played, edited again, or deleted from the world selector.

Runtime terrain uses one compact typed tile array rather than one JavaScript object per
block or a second world-sized tunneled-state array. Stone distance fields cover only the occupied stone bounds,
stone-free maps skip that work entirely, enemy spawning retains only its small selected
candidate set, and decorative terrain details reuse a fixed set of deterministic pattern
tiles instead of retaining world-sized detail data or creating per-chunk detail objects.
The editor's full-size working tile array is allocated only
while the editor is open and released when it closes. This keeps the expanded depth from
multiplying startup object count or eagerly retaining editing memory and decoration for
unexplored regions.

When the moving head traverses a ground block, that block keeps its `ground` type but
changes from authored tile value `1` to runtime-only value `3`, selecting the flat,
darker `tunneled-soil` texture. Value `3` still reports ground locomotion but cannot be
dug again. The conversion immediately patches overlapping cached terrain canvases once;
there is no per-frame trail scan. Chunks encountered later render value `3` correctly
during their ordinary material pass. A compact list of changed indices exists only so
Reset can restore those tiles to value `1` and lazily rebuild the affected view.
Soil and stone use separate decorative pattern sets. Stone never receives the tunneled
texture and is never changed by digging.
