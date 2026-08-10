# Worm sprite sets

The nine `licker-default-*.png` files are Licker's built-in appearance and were extracted
without resampling from the current per-type Licker save. The older nine `default-*.png`
files remain Spitter's provisional built-in appearance. The game resolves defaults by
worm type whenever that type has no player-made appearance saved. They are 2× assets.
After converting them to logical dimensions, the current experimental 62.5% entity scale
halves them again before the growth multiplier is applied.

| File | Pixel size | Purpose |
| --- | ---: | --- |
| `licker-default-head-upper.png` | 128 × 96 | Upper jaw source, facing right and pivoted from the neck |
| `licker-default-head-lower.png` | 128 × 96 | Saved lower jaw layer retained for editing |
| `licker-default-mouth-upper.png` | 128 × 96 | Upper mouth cavity and teeth source |
| `licker-default-mouth-lower.png` | 128 × 96 | Saved lower mouth layer retained for editing |
| `licker-default-segment.png` | 80 × 80 | Body fill |
| `licker-default-segment-band.png` | 80 × 80 | Transparent alternating-ring overlay |
| `licker-default-segment-outline.png` | 80 × 80 | Body outline layer |
| `licker-default-tongue.png` | 80 × 80 | Repeating tapered tongue-segment texture |
| `licker-default-tongue-ring.png` | 80 × 80 | Repeating editable overlay at tongue joints |

Licker's default mirrors `headUpper` to the lower jaw and `mouthUpper` to the lower
mouth, matching the settings in its saved appearance. Spitter currently uses the same
reflection choices with its separate provisional artwork.

Keep the canvas dimensions and transparent backgrounds when replacing the files.
The jaw and mouth layers must share the same alignment and face right. Upper layers use
the upper canvas half, while lower layers use the lower half. The neck hinge is 20
logical pixels left of the image center. The editor exposes the upper and lower mouth
PNGs as independent layers; either mouth or jaw can optionally mirror its opposite at
render time. Segment layers should remain centered; the game rotates, scales, tapers,
and overlaps them along the live body path.

`default-tongue-ring-source.svg` is the deterministic source for Spitter's provisional
ring PNG. Licker's ring comes directly from its current save; the editor and exported
worm packages operate on the rasterized PNG layers.
