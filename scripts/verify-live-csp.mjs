#!/usr/bin/env node
// SEC-02 / DEPLOY-01 / DEPLOY-02 gate — real-browser CSP-enforcement and
// inline-script-execution check against the REAL deployed production URL
// (never astro dev/preview, which do not simulate Vercel's header layer —
// see scripts/verify-deploy-headers.mjs's header-check for the sibling
// gate this one complements).
//
// Dependency policy: plain Node ESM. The only permitted non-`node:` import
// is `chromium` from the already-installed `playwright` devDependency
// (same as scripts/verify-a11y.mjs) — everything else is a `node:` builtin
// or requires none at all.
//
// Contract (see 05-04-PLAN.md Task 1):
// - Takes the production URL from process.argv[2] into a single named
//   binding (PROD_URL) — never a duplicated literal domain anywhere else
//   in this file.
// - Exit 1 immediately, with the exact fixed usage message, if argv[2] is
//   absent.
// - If the URL's protocol is not "https:", record a violation named
//   "https" and exit 1 WITHOUT launching a browser.
// - Visits two pages at a 390x844 mobile viewport: PROD_URL itself (the
//   "root" page — literally whatever URL was passed, which is what makes
//   the inline-script-blocked negative-proof test work by pointing PROD_URL
//   at a page with no toggle) and PROD_URL's origin plus
//   "/__gsd-404-probe" (exercises the custom 404 page).
// - Before each navigation, installs a `securitypolicyviolation` collector
//   via page.addInitScript, and subscribes to `console` (error-type
//   messages only) and `pageerror` events — a CSP block on a module script
//   can surface as a console error phrased "Refused to execute…" without
//   always producing a `securitypolicyviolation` event, so both channels
//   are checked. The generic, unattributed Chromium diagnostic
//   `Failed to load resource: the server responded with a status of NNN ()`
//   is filtered out of the console-error channel entirely — it duplicates
//   the top-level navigation's own status code (a deliberately-probed 404
//   page is EXPECTED to produce this, per DEPLOY-02/verify-deploy-headers.mjs
//   already asserting that exact status), and gives no URL to attribute a
//   real failure to. A `response` listener below independently and more
//   precisely catches any *actual* broken subresource (non-document
//   request, status >= 400) with its real URL and status attached, which
//   is strictly better coverage than parsing the generic message text.
// - Accumulates every finding into a `violations` array — never exits on
//   the first failure.
// - On the root page (PROD_URL) only: asserts an element matching
//   `[data-nav-toggle]` is present, clicks it, waits for `#nav-overlay` to
//   carry `data-menu-open="true"`, clicks it again, waits for that
//   attribute to become `"false"`. Records a violation named
//   "inline-script-blocked" if the toggle is absent, if either state
//   transition does not happen within the timeout, or if the click itself
//   throws — the exact symptom of an enforcing CSP whose script-src hash
//   no longer matches the shipped script.
// - Also asserts, on the root page only, that document.title is non-empty
//   and a <main> landmark exists, so a CSP-driven blank render cannot pass
//   silently.
// - Always closes the browser in a `finally` block.
// - Prints each violation to stderr as `verify-live-csp: <check> — <detail>`,
//   then exactly one summary line to stdout as the last line before exit:
//     LIVECSP SUMMARY url=<url> pages=<n> csp_violations=<n> console_errors=<n> nav_toggle=<ok|fail> violations=<n>
// - Exits 0 only when violations is empty.

import { chromium } from "playwright";

const PROD_URL = process.argv[2];

if (!PROD_URL) {
  console.error("usage: node scripts/verify-live-csp.mjs <production-url>");
  process.exit(1);
}

const violations = [];
function addViolation(check, detail) {
  violations.push({ check, detail });
}

let parsedUrl;
try {
  parsedUrl = new URL(PROD_URL);
} catch (err) {
  console.error(`verify-live-csp: url — "${PROD_URL}" is not a valid URL (${err.message})`);
  process.exit(1);
}

let cspViolationCount = 0;
let consoleErrorCount = 0;
let navToggleOk = false;
let pagesAttempted = 0;

function printSummaryAndExit() {
  for (const v of violations) {
    console.error(`verify-live-csp: ${v.check} — ${v.detail}`);
  }
  console.log(
    `LIVECSP SUMMARY url=${PROD_URL} pages=${pagesAttempted} csp_violations=${cspViolationCount} console_errors=${consoleErrorCount} nav_toggle=${
      navToggleOk ? "ok" : "fail"
    } violations=${violations.length}`
  );
  process.exit(violations.length === 0 ? 0 : 1);
}

if (parsedUrl.protocol !== "https:") {
  addViolation("https", `protocol is "${parsedUrl.protocol}", expected "https:" (DEPLOY-01 requires HTTPS)`);
  printSummaryAndExit();
}

const ORIGIN = parsedUrl.origin;
const PAGES = [PROD_URL, `${ORIGIN}/__gsd-404-probe`];
const VIEWPORT = { width: 390, height: 844 };
const STATE_TIMEOUT_MS = 5000;

let browser;
try {
  browser = await chromium.launch();

  for (let i = 0; i < PAGES.length; i++) {
    const pageUrl = PAGES[i];
    const isRootPage = i === 0;
    pagesAttempted++;

    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();

    // Collector for securitypolicyviolation events, installed before
    // navigation so it captures every violation from the very first paint.
    await page.addInitScript(() => {
      window.__gsdCspViolations = [];
      document.addEventListener("securitypolicyviolation", (event) => {
        window.__gsdCspViolations.push({
          violatedDirective: event.violatedDirective,
          blockedURI: event.blockedURI,
          sourceFile: event.sourceFile,
          lineNumber: event.lineNumber,
        });
      });
    });

    const consoleErrors = [];
    // Generic, unattributed navigation-status diagnostic — see file-header
    // comment. Only ever matches this exact Chromium-generated string, so
    // it never masks a real "Refused to ..." CSP message or an application
    // console.error() call.
    const GENERIC_RESOURCE_STATUS_RE = /^Failed to load resource: the server responded with a status of \d+ \(\)$/;
    page.on("console", (msg) => {
      if (msg.type() === "error" && !GENERIC_RESOURCE_STATUS_RE.test(msg.text())) {
        consoleErrors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => {
      consoleErrors.push(err.message);
    });

    const subresourceFailures = [];
    page.on("response", (res) => {
      if (res.request().resourceType() !== "document" && res.status() >= 400) {
        subresourceFailures.push({ url: res.url(), status: res.status() });
      }
    });

    try {
      await page.goto(pageUrl, { waitUntil: "networkidle" });
    } catch (err) {
      addViolation("navigation", `${pageUrl} — failed to load (${err.message})`);
      await context.close();
      continue;
    }

    const collectedCsp = await page.evaluate(() => window.__gsdCspViolations || []);
    for (const v of collectedCsp) {
      cspViolationCount++;
      addViolation(
        "csp-violation",
        `${pageUrl} directive=${v.violatedDirective} blockedURI=${v.blockedURI}`
      );
    }

    for (const errText of consoleErrors) {
      consoleErrorCount++;
      const truncated = String(errText).split("\n")[0].slice(0, 200);
      addViolation("console-error", `${pageUrl}: ${truncated}`);
    }

    for (const f of subresourceFailures) {
      addViolation("broken-subresource", `${pageUrl}: ${f.url} responded with status ${f.status}`);
    }

    if (isRootPage) {
      try {
        const toggle = page.locator("[data-nav-toggle]").first();
        const toggleCount = await toggle.count();
        if (toggleCount === 0) {
          addViolation("inline-script-blocked", `${pageUrl}: no [data-nav-toggle] element found`);
        } else {
          await toggle.click();
          await page.waitForFunction(
            () => document.getElementById("nav-overlay")?.getAttribute("data-menu-open") === "true",
            null,
            { timeout: STATE_TIMEOUT_MS }
          );
          await toggle.click();
          await page.waitForFunction(
            () => document.getElementById("nav-overlay")?.getAttribute("data-menu-open") === "false",
            null,
            { timeout: STATE_TIMEOUT_MS }
          );
          navToggleOk = true;
        }
      } catch (err) {
        addViolation("inline-script-blocked", `${pageUrl}: ${err.message.split("\n")[0]}`);
      }

      const renderState = await page.evaluate(() => ({
        title: document.title,
        hasMain: !!document.querySelector("main"),
      }));
      if (!renderState.title || renderState.title.trim() === "") {
        addViolation("blank-render", `${pageUrl}: document.title is empty`);
      }
      if (!renderState.hasMain) {
        addViolation("blank-render", `${pageUrl}: no <main> landmark found`);
      }
    }

    await context.close();
  }
} finally {
  if (browser) {
    await browser.close();
  }
}

printSummaryAndExit();
