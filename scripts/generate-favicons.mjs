#!/usr/bin/env node
// Favicon generator (SEO-05, D-09/D-10) — a one-time/on-demand script, NOT
// chained into `npm run build` or `npm run verify` (04-RESEARCH.md
// Assumption A4: the >_ glyph is stable, so re-running per build is
// unnecessary DX overhead). Invoke manually via `npm run generate:favicons`
// whenever the glyph definition below changes.
//
// Contract (see 04-01-PLAN.md Task 2):
// - Single input: the inline SVG source string defined below — the >_
//   glyph, a 24x24 viewBox (matching the Material Symbols grid), transparent
//   background, flat #00f0ff fill/stroke, no gradient/blur/glow (a
//   box-shadow-style glow does not survive rasterization at 16px).
// - Three outputs, all written under public/:
//     * favicon.svg          — the SVG source, written verbatim
//     * favicon.ico           — 16/32/48 multi-resolution ICO container
//     * apple-touch-icon.png  — 180x180, solid #0c0e12 background (the one
//       deliberate non-transparent asset — iOS does not honor PNG
//       transparency on home-screen icons)
// - Idempotent: re-running with an unchanged glyph definition produces the
//   same output.

import { writeFileSync } from "node:fs";
import sharp from "sharp";
import pngToIco from "png-to-ico";

// The >_ mark (D-09): a genuine vector chevron + underscore, not typed text.
// Chevron: stroked polyline through (5,7) -> (10,12) -> (5,17).
// Underscore: filled rounded rect at x=12, y=15.5, width=8, height=2.5, rx=1.
const GLYPH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
  <polyline points="5,7 10,12 5,17" stroke="#00f0ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  <rect x="12" y="15.5" width="8" height="2.5" rx="1" fill="#00f0ff" />
</svg>
`;

const SVG_BUFFER = Buffer.from(GLYPH_SVG, "utf8");
// A high explicit density keeps small raster sizes (16/32px) crisp instead
// of blurry — the SVG's own 24x24 viewBox is otherwise rasterized at the
// sharp default of 72 DPI.
const RASTER_DENSITY = 600;

async function rasterize(size) {
  return sharp(SVG_BUFFER, { density: RASTER_DENSITY })
    .resize(size, size)
    .png()
    .toBuffer();
}

async function main() {
  // 1. favicon.svg — verbatim source, transparent, scalable.
  writeFileSync("public/favicon.svg", GLYPH_SVG);

  // 2. favicon.ico — 16/32/48 multi-resolution legacy fallback.
  const icoSizes = [16, 32, 48];
  const pngBuffers = await Promise.all(icoSizes.map(rasterize));
  const icoBuffer = await pngToIco(pngBuffers);
  writeFileSync("public/favicon.ico", icoBuffer);

  // 3. apple-touch-icon.png — 180x180, solid #0c0e12 field. Render the
  // glyph at 120x120, then extend 30px on each side and flatten onto the
  // solid background (the one deliberate non-transparent exception).
  const glyph120 = await rasterize(120);
  const appleTouchIcon = await sharp(glyph120)
    .extend({
      top: 30,
      bottom: 30,
      left: 30,
      right: 30,
      background: "#0c0e12",
    })
    .flatten({ background: "#0c0e12" })
    .png()
    .toBuffer();
  writeFileSync("public/apple-touch-icon.png", appleTouchIcon);

  console.log(
    `GENERATE-FAVICONS SUMMARY svg=1 ico_sizes=${icoSizes.length} apple_touch_icon=1`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
