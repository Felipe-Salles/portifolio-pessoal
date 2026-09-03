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
// Task 2 extends this file with a supplementary pixel-sampling contrast
// check (sharp + wcag-contrast) that resolves every deferred glass-panel
// entry parked here by measuring the actually-painted pixel, and wires
// `verify:a11y` into package.json's composite verify chain.

import { existsSync } from "node:fs";
import { chromium } from "playwright";
import { preview } from "astro";
import AxeBuilder from "@axe-core/playwright";

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
// Resolved by the Task 2 supplementary contrast check (not yet added).
let incompleteResolved = 0;
let contrastChecked = 0;

// Deferred color-contrast `incomplete` results — parked here rather than
// resolved; Task 2's supplementary pixel-sampling check consumes and
// resolves every entry (see the file-header Deviation note for why every
// color-contrast incomplete entry is deferred, not just glass-panel ones).
const deferredContrastEntries = [];

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

    await context.close();
  }

  // Task 2 will resolve every entry in deferredContrastEntries here via the
  // supplementary pixel-sampling contrast check, incrementing
  // incompleteResolved/contrastChecked and asserting the two counts match.
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
