# Worm sprite sets

The nine `shared-default-*.png` files are the built-in appearance for both Licker and
Spitter. They were extracted without resampling from the current edited Licker save made
on August 10, 2026. The older `licker-default-*.png` and `default-*.png` sets are retained
as archived previous defaults. All sets are 2× assets. After conversion to logical
dimensions, the current experimental 62.5% entity scale halves them again before the
growth multiplier is applied.

| File | Pixel size | Purpose |
| --- | ---: | --- |
| `shared-default-head-upper.png` | 128 × 96 | Upper jaw source, facing right and pivoted from the neck |
| `shared-default-head-lower.png` | 128 × 96 | Saved lower jaw layer retained for editing |
| `shared-default-mouth-upper.png` | 128 × 96 | Upper mouth cavity and teeth source |
| `shared-default-mouth-lower.png` | 128 × 96 | Saved lower mouth layer retained for editing |
| `shared-default-segment.png` | 80 × 80 | Body fill |
| `shared-default-segment-band.png` | 80 × 80 | Transparent alternating-ring overlay |
| `shared-default-segment-outline.png` | 80 × 80 | Body outline layer |
| `shared-default-tongue.png` | 80 × 80 | Repeating tapered tongue-segment texture |
| `shared-default-tongue-ring.png` | 80 × 80 | Repeating editable overlay at tongue joints |

The shared default mirrors `headUpper` to the lower jaw and `mouthUpper` to the lower
mouth, matching the saved appearance. Both worm types restore these same reflection
choices when **Load defaults** is used.

Keep the canvas dimensions and transparent backgrounds when replacing the files.
The jaw and mouth layers must share the same alignment and face right. Upper layers use
the upper canvas half, while lower layers use the lower half. The neck hinge is 20
logical pixels left of the image center. The editor exposes the upper and lower mouth
PNGs as independent layers; either mouth or jaw can optionally mirror its opposite at
render time. Segment layers should remain centered; the game rotates, scales, tapers,
and overlaps them along the live body path.

`default-tongue-ring-source.svg` is the deterministic source for the archived provisional
ring PNG. The shared ring comes directly from the current save; the editor and exported
worm packages operate on the rasterized PNG layers.
