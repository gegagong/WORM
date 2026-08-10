# Enemy sprite assets

Enemy artwork is loaded from the transparent PNG files in this directory. The game
does not inspect nontransparent artwork bounds; it always draws the entire image canvas.

- `beetle-handdrawn.png` — active beetle scurry frame 1
- `beetle-scurry-handdrawn.png` — active beetle scurry frame 2
- `dragonfly-handdrawn.png` — active side-profile dragonfly wing frame 1
- `dragonfly-flap-handdrawn.png` — active side-profile dragonfly wing frame 2
- `vulture-handdrawn.png` — active side-profile vulture wing frame 1
- `vulture-flap-handdrawn.png` — active side-profile vulture wing frame 2
- `mole-handdrawn.png` — active mole scurry frame 1
- `mole-scurry-handdrawn.png` — active mole scurry frame 2
- `rabbit-handdrawn.png` — grounded side-profile rabbit frame
- `rabbit-jump-handdrawn.png` — extended-leg side-profile jumping rabbit frame
- `meat-handdrawn.png` — active meat-drop placeholder

The active sprites follow the default player-made worm's art direction: rough
player-drawn bitmap silhouettes, flat coral and ochre fills, vivid orange-red edge
marks, hot-pink structural accents, sparse dark-red spots, tooth-white details, minimal
shading, and no shadows. The mole, rabbit, and vulture keep dark umber bodies for species readability.
The older PNGs remain in this folder as inactive source/reference artwork.

Keep replacements on a square transparent canvas and draw the enemy facing right. All
animals whose normal habitat is above ground use a strict side profile by default. The
dragonfly keeps its body horizontal and its legs pointing down; the renderer mirrors
all side-profile animals for leftward travel rather than rotating them. The
placeholder files are 256 × 256 pixels. With the current experimental 62.5% entity scale,
the full beetle canvas renders at 40 × 40 world pixels and the full mole canvas at
75 × 75 world pixels. The dragonfly canvas renders at 45 × 45 world pixels, making it
12.5% larger than the beetle, while the
mole 1.875 times larger in appearance. Transparent padding is included in those
rendered dimensions. The vulture canvas renders at 375 × 375 world pixels, exactly five
times the mole's rendered size. The rabbit renders at 90 × 90 world pixels, exactly
1.2 times the mole's size. Meat renders at 35 × 35 world pixels.

Adding more animation frames later only requires adding their paths to the relevant
`spriteFrames` entry in `ENEMY_DEFINITIONS` in `game.js`.
