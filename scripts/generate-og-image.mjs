#!/usr/bin/env node
// Build-time OG share-image generator (SEO-02) — screenshots the internal
// /og-template/ route (src/pages/og-template/index.astro) at a fixed
// 1200x630 viewport using a real headless browser (Playwright + Chromium),
// so the preview image can never visually drift from the live Hero design.
//
// Contract (see 04-02-PLAN.md Task 3):
// - Inputs: dist/ (must already be built by `astro build`) and the
//   /og-template/ route it contains.
// - Outputs: public/og-image.png (committed to git — guarantees a valid
//   preview even in a build environment without Chromium, e.g. a future
//   Phase 5 / DEPLOY-01 Vercel build) and dist/og-image.png (available to
//   the build that just ran, no second `astro build` needed).
// - Runs on every `npm run build` (chained after `astro build`) and is also
//   available standalone via `npm run generate:og`.
// - Exits nonzero on ANY failure — never silently ships a stale or missing
//   preview image.
// - Starts Astro's preview server programmatically (import { preview } from
//   "astro"), not via `spawn`/child process — avoids orphaned-process and
//   process-tree-kill problems on Windows. Server + browser are always torn
//   down in a `finally` block, even on error.
// - Generation is build-time-local only: the sole network origin touched is
//   the localhost preview server started by this script. No hosted/SaaS
//   OG-image service is used (T-04-02-03) — verify:sec01 keeps external
//   origins out of dist/ regardless.

import { existsSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { preview } from "astro";

const PORT = 4325;
const OG_TEMPLATE_MARKER = "dist/og-template/index.html";

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync(OG_TEMPLATE_MARKER)) {
  fail(
    "dist/og-template/index.html not found — run `npm run build` (or `astro build`) first.",
  );
}

let server;
let browser;

try {
  server = await preview({ server: { port: PORT } });

  browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });

  const host = server.host ?? "localhost";
  const url = `http://${host}:${server.port}/og-template/`;

  await page.goto(url, { waitUntil: "networkidle" });
  // Wait for self-hosted Lexend/JetBrains Mono to finish painting before
  // capture — otherwise the screenshot can catch a fallback-font frame.
  await page.evaluate(() => document.fonts.ready);

  // animations: "disabled" is required because the availability badge's dot
  // carries animate-pulse and would otherwise make output nondeterministic
  // between runs (verified by plan 04-02's byte-identical-across-builds gate).
  const buffer = await page.screenshot({
    animations: "disabled",
    fullPage: false,
  });

  writeFileSync("public/og-image.png", buffer);
  writeFileSync("dist/og-image.png", buffer);

  console.log(
    `OG-IMAGE SUMMARY outputs=public/og-image.png,dist/og-image.png dimensions=1200x630 bytes=${buffer.length}`,
  );
} finally {
  if (browser) {
    await browser.close();
  }
  if (server) {
    await server.stop();
  }
}
