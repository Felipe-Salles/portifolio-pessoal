#!/usr/bin/env node
// A11Y-03 + A11Y-04 gate — real-browser axe-core scan of both built routes.
// Structured after scripts/verify-shell.mjs / scripts/verify-no-external-
// origins.mjs (same dist/-guard + violations-array + summary-line +
// exit-code contract), and scripts/generate-og-image.mjs (same programmatic
// astro preview() + Playwright launch + try/finally teardown pattern).
//
// Contract (see 04-04-PLAN.md Task 1):
// - Exit 1 immediately with a fixed message if dist/index.html or
//   dist/404.html is missing (RED state before any build has run).
// - Boots a throwaway Astro preview() server on port 4326 (not 4325 — that
//   port is used transiently by scripts/generate-og-image.mjs during
//   `npm run build`, and could still be in flight) and a headless Chromium
//   via Playwright; both are always torn down in a `finally` block, so an
//   orphaned server/browser never holds the port or a process handle across
//   runs.
// - Scans "/" and "/404.html" with `@axe-core/playwright`'s
//   WCAG2A + WCAG2AA ruleset (`withTags(["wcag2a", "wcag2aa"])`).
// - Every entry in axe's `violations` fails the gate, regardless of impact
//   level — this project's verify-*.mjs gates are all-or-nothing.
// - Every axe `incomplete` entry is handled explicitly, never silently
//   dropped: every `color-contrast` incomplete result is parked into a
//   deferred-entries list for Task 2's pixel-sampling contrast check to
//   resolve (this task does not resolve them, only counts them as
//   unresolved); every other incomplete result (any rule other than
//   color-contrast) fails the gate outright via an explicit failing branch.
//   Deferred entries are tagged with whether their target sits inside
//   .glass-panel/.border-glow-cyan for diagnostic purposes (see the
//   "Deviation" note below), but the deferral itself is not gated on that —
//   see rationale.
//
// Deviation from the plan's initial routing (documented in 04-04-SUMMARY.md
// with evidence): the plan's <interfaces> section anticipated axe's
// composited-background blind spot as scoped to .glass-panel/
// .border-glow-cyan elements only. A live scan against the real build
// showed axe also reports `incomplete` color-contrast for elements with NO
// glass-panel ancestor at all — e.g. Nav.astro's own bar
// (`bg-background/60 backdrop-blur-xl`, the same composited-transparency
// pattern under a different class name) and the Hero heading/paragraph
// text, which sits directly on <body>'s `.bg-grid-pattern` background plus
// the two absolutely-positioned `.glow-cloud-*` divs with no glass wrapper
// at all. This is the same underlying axe limitation (RESEARCH.md Pitfall
// 6 — ancestor-background compositing across stacked non-opaque layers),
// just not confined to the two named primitive classes. Per the plan's own
// Task 1 instruction ("if the run surfaces a rule that is genuinely a false
// positive against this design, record it in the plan SUMMARY with
// evidence rather than silently suppressing it"), every color-contrast
// `incomplete` result is deferred to the deterministic pixel-sampling check
// regardless of ancestor class — the measured-pixel answer is authoritative
// for any element axe could not resolve, not just the two named classes.
// - Also asserts, from the live accessibility surface (not by parsing HTML,
//   so astro-icon's sprite <use> dedup — RESEARCH.md Pitfall 7 — is handled
//   the same way a browser handles it): every <img> has a non-empty `alt`
//   that is not a filename, and every <a> whose entire visible text is
//   empty carries a non-empty aria-label (A11Y-03/D-11/D-13).
// - Always prints exactly one summary line:
//     A11Y SUMMARY routes=<n> violations=<n> incomplete_total=<n> incomplete_resolved=<n> contrast_checked=<n> exit=<0|1>
// - Exits 0 only when violations=0.
//
// Contract (see 04-04-PLAN.md Task 2, added on top of Task 1 above):
// - Every entry deferred above is resolved here by measurement, never by
//   token-value assumption: obtain the element's boundingBox(), screenshot
//   the page clipped to that box, sample a real painted pixel a few px
//   inset from the box's top-left corner (background, not glyph stroke —
//   RESEARCH.md Pattern 4) via `sharp`, read the element's own computed
//   text color via `getComputedStyle`, and compute the ratio with
//   `wcag-contrast`'s `hex()`.
// - The WCAG AA threshold is size-dependent, not a single constant: 3.0 for
//   large text (computed font-size >= 24px, or >= 18.66px at font-weight
//   >= 700), 4.5 otherwise — both read from the element's own computed
//   style, never inferred from class names.
// - Any deferred entry that cannot be measured (no bounding box, zero-area
//   clip, unreadable computed color, or a sampling failure) is a violation,
//   never a silent skip.
// - After every route is scanned, incomplete_resolved must equal the total
//   number of deferred entries — asserted explicitly so an entry can never
//   fall through unaccounted.
// - Never patches a design token to silence a real contrast failure — a
//   genuine violation here is reported with its measured numbers only
//   (04-UI-SPEC.md's A11Y-04 section escalates token changes to
//   CONTEXT.md/UI-SPEC, not something this gate patches around).
// - Adds `verify:a11y` to package.json's scripts block and appends it to
//   the composite `verify` chain (the seventh gate).

import { existsSync } from "node:fs";
import { chromium } from "playwright";
import { preview } from "astro";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";
import { hex as wcagHex } from "wcag-contrast";

const PORT = 4326;
const ROUTES = ["/", "/404.html"];

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync("dist/index.html") || !existsSync("dist/404.html")) {
  fail(
    "dist/index.html and dist/404.html not found — run npm run build first",
  );
}

const violations = [];
function addViolation(check, detail) {
  violations.push({ check, detail });
}

let incompleteTotal = 0;
// Incremented only when a deferred entry's measured ratio clears the
// applicable AA threshold (the literal "resolved" outcome per the summary
// line contract). A failing measurement is still fully accounted for via
// processedDeferred + its own "contrast" violation — see the coverage
// assertion after the route loop.
let incompleteResolved = 0;
let contrastChecked = 0;
// Counts every deferred entry that reached a terminal outcome (measured +
// passed, or explicitly failed as unmeasurable/violation) — used only for
// the fall-through coverage assertion below, distinct from
// incompleteResolved.
let processedDeferred = 0;

// Deferred color-contrast `incomplete` results — parked here rather than
// resolved; Task 2's supplementary pixel-sampling check consumes and
// resolves every entry (see the file-header Deviation note for why every
// color-contrast incomplete entry is deferred, not just glass-panel ones).
const deferredContrastEntries = [];

/**
 * Convert a Playwright-evaluated CSS color string (e.g. "rgb(1, 2, 3)" or
 * "rgba(1, 2, 3, 0.5)") to a "#rrggbb" hex string.
 */
function cssColorToHex(cssColor) {
  const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(cssColor);
  if (!m) return null;
  const [, r, g, b] = m;
  const toHex = (n) =>
    Math.max(0, Math.min(255, Math.round(Number(n))))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

let server;
let browser;

try {
  server = await preview({ server: { port: PORT } });
  browser = await chromium.launch();
  const host = server.host ?? "localhost";

  for (const route of ROUTES) {
    // @axe-core/playwright requires the page to originate from an explicit
    // browser.newContext() (see dequelabs/axe-core-npm error-handling.md) —
    // browser.newPage()'s implicit context is not sufficient.
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const url = `http://${host}:${server.port}${route}`;

    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    for (const v of results.violations) {
      const target = v.nodes[0]?.target?.[0] ?? "(unknown target)";
      addViolation(
        "axe",
        `${route} rule=${v.id} impact=${v.impact} target=${target}`,
      );
    }

    incompleteTotal += results.incomplete.reduce(
      (sum, inc) => sum + inc.nodes.length,
      0,
    );
    for (const inc of results.incomplete) {
      if (inc.id === "color-contrast") {
        // Glass-panel deferral branch: every color-contrast incomplete node
        // is parked for Task 2's pixel-sampling check, tagged with whether
        // it sits inside .glass-panel/.border-glow-cyan (diagnostic only —
        // see the file-header Deviation note for why the defer itself is
        // not gated on this).
        for (const node of inc.nodes) {
          const selector = node.target?.[0];
          if (!selector) {
            addViolation(
              "axe-incomplete",
              `${route} rule=${inc.id} — incomplete node with no target selector, cannot resolve`,
            );
            continue;
          }
          const isGlass = await page.evaluate(
            (sel) => {
              const el = document.querySelector(sel);
              return el ? !!el.closest(".glass-panel, .border-glow-cyan") : false;
            },
            selector,
          );
          deferredContrastEntries.push({ route, selector, isGlass });
        }
      } else {
        // Explicit failing branch: any incomplete rule other than
        // color-contrast is never silently treated as a pass.
        const target = inc.nodes[0]?.target?.[0] ?? "(unknown target)";
        addViolation(
          "axe-incomplete",
          `${route} rule=${inc.id} target=${target} — unhandled incomplete result (not color-contrast)`,
        );
      }
    }

    // A11Y-03: alt-text completeness + icon-only link labeling, asserted
    // directly against the live accessibility surface.
    const surfaceIssues = await page.evaluate(() => {
      const issues = [];
      const filenameExt = /\.(png|jpe?g|jpeg|webp|avif|svg)$/i;
      document.querySelectorAll("img").forEach((img) => {
        const alt = img.getAttribute("alt");
        if (alt === null || alt.trim() === "") {
          issues.push(`img missing non-empty alt (src="${img.getAttribute("src")}")`);
        } else if (filenameExt.test(alt.trim())) {
          issues.push(`img alt looks like a filename: "${alt}"`);
        }
      });
      document.querySelectorAll("a").forEach((a) => {
        const text = (a.textContent || "").trim();
        if (text === "") {
          const label = a.getAttribute("aria-label");
          if (!label || label.trim() === "") {
            issues.push(
              `icon-only <a href="${a.getAttribute("href")}"> missing non-empty aria-label`,
            );
          }
        }
      });
      return issues;
    });
    for (const issue of surfaceIssues) {
      addViolation("a11y-surface", `${route}: ${issue}`);
    }

    // -----------------------------------------------------------------
    // Supplementary pixel-sampling contrast check (Task 2, A11Y-04) —
    // resolves every entry deferred above for this route, while the page
    // is still open (avoids a second navigation/render pass).
    // -----------------------------------------------------------------
    const routeDeferred = deferredContrastEntries.filter((e) => e.route === route);
    for (const entry of routeDeferred) {
      const locator = page.locator(entry.selector).first();
      const box = await locator.boundingBox().catch(() => null);
      if (!box || box.width <= 0 || box.height <= 0) {
        processedDeferred++;
        addViolation(
          "contrast",
          `${route} ${entry.selector} — could not measure (no usable bounding box), cannot verify contrast`,
        );
        continue;
      }

      const computed = await locator
        .evaluate((el) => {
          const cs = getComputedStyle(el);
          return {
            color: cs.color,
            fontSize: parseFloat(cs.fontSize),
            fontWeight: parseInt(cs.fontWeight, 10) || 400,
          };
        })
        .catch(() => null);

      if (!computed || !computed.color) {
        processedDeferred++;
        addViolation(
          "contrast",
          `${route} ${entry.selector} — could not read computed color, cannot verify contrast`,
        );
        continue;
      }

      const fgHex = cssColorToHex(computed.color);
      if (!fgHex) {
        processedDeferred++;
        addViolation(
          "contrast",
          `${route} ${entry.selector} — unreadable computed color "${computed.color}"`,
        );
        continue;
      }

      // Sample a pixel a few px inset from the box's top-left corner —
      // background, not glyph stroke (RESEARCH.md Pattern 4). Text is
      // centered/baseline-aligned, so the corner is background.
      const insetX = Math.min(2, Math.max(0, Math.floor(box.width / 2) - 1));
      const insetY = Math.min(2, Math.max(0, Math.floor(box.height / 2) - 1));
      let bgHex;
      try {
        // locator.screenshot() (not page.screenshot({clip})) — auto-scrolls
        // the element into view first, so elements below the fold (this
        // page is far taller than the 900px viewport) are captured
        // correctly instead of producing an out-of-viewport empty clip.
        const screenshotBuffer = await locator.screenshot();
        const { data } = await sharp(screenshotBuffer)
          .extract({ left: insetX, top: insetY, width: 1, height: 1 })
          .raw()
          .toBuffer({ resolveWithObject: true });
        bgHex = `#${[...data.subarray(0, 3)]
          .map((c) => c.toString(16).padStart(2, "0"))
          .join("")}`;
      } catch (err) {
        processedDeferred++;
        addViolation(
          "contrast",
          `${route} ${entry.selector} — could not sample painted pixel (${err.message})`,
        );
        continue;
      }

      const ratio = wcagHex(bgHex, fgHex);
      // AA threshold is size-dependent, read from computed style — never
      // inferred from class names (Task 2 requirement).
      const isLarge =
        computed.fontSize >= 24 ||
        (computed.fontSize >= 18.66 && computed.fontWeight >= 700);
      const required = isLarge ? 3 : 4.5;

      processedDeferred++;
      if (ratio < required) {
        // Never patch a design token to silence this — report the measured
        // numbers only (04-UI-SPEC.md A11Y-04, T-04-04-04).
        addViolation(
          "contrast",
          `${route} ${entry.selector} ratio=${ratio.toFixed(2)} required=${required} fg=${fgHex} bg=${bgHex}`,
        );
      } else {
        incompleteResolved++;
        contrastChecked++;
      }
    }

    await context.close();
  }

  // Coverage assertion: every deferred entry must have been either resolved
  // (measured, cleared AA) or reported as a specific "contrast" violation
  // above — processedDeferred counts both paths, so this only fires on a
  // true silent-drop bug (an entry that was neither measured nor reported),
  // not on a genuine contrast failure (which already has its own violation
  // and correctly keeps the gate red).
  if (processedDeferred !== deferredContrastEntries.length) {
    addViolation(
      "contrast",
      `processed ${processedDeferred} deferred entries but ${deferredContrastEntries.length} were parked — an entry fell through unaccounted`,
    );
  }
} finally {
  if (browser) {
    await browser.close();
  }
  if (server) {
    await server.stop();
  }
}

for (const v of violations) {
  console.error(`verify-a11y: ${v.check} — ${v.detail}`);
}

const exitCode = violations.length === 0 ? 0 : 1;
console.log(
  `A11Y SUMMARY routes=${ROUTES.length} violations=${violations.length} incomplete_total=${incompleteTotal} incomplete_resolved=${incompleteResolved} contrast_checked=${contrastChecked} exit=${exitCode}`,
);
process.exit(exitCode);
