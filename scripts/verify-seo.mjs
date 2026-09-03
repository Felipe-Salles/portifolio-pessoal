#!/usr/bin/env node
// SEO-01..SEO-05 gate — deterministic scan of dist/ proving every SEO
// artifact this phase produced (meta tags, sitemap, robots.txt, OG/Twitter
// share image, favicon set) against real build output. Plain Node ESM, zero
// dependencies (node:fs/node:path only), same contract as every other
// scripts/verify-*.mjs gate in this project.
//
// Contract (see 04-03-PLAN.md Task 1):
// - Exit 1 immediately, with a fixed message, if dist/ does not exist (the
//   RED state before any build has run).
// - Reads the expected origin live from astro.config.mjs's `site:` value —
//   never a hardcoded second copy of that literal — so a Phase 5 domain swap
//   updates this gate and the site together instead of silently drifting.
// - Guards each required entry file individually before scanning it; a
//   missing file fails only the check group(s) that depend on it (dist/
//   itself is the only all-or-nothing guard).
// - Accumulates every failure into a `violations` array — never exits on the
//   first failure — across seven independent check groups: sitemap, robots,
//   meta, og, ogimage, favicon, ogtemplate.
// - Prints each violation to stderr as `verify-seo: <check> — <detail>`.
// - Always prints exactly one summary line to stdout before exiting:
//     SEO SUMMARY sitemap=<ok|fail> robots=<ok|fail> meta=<ok|fail> og=<ok|fail> ogimage=<ok|fail> favicon=<ok|fail> ogtemplate=<ok|fail> violations=<n>
// - Exits 0 only when violations=0.

import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST_DIR = "dist";
const CONFIG_PATH = "astro.config.mjs";

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync(DIST_DIR)) {
  fail("dist/ not found — run npm run build first");
}

if (!existsSync(CONFIG_PATH)) {
  fail(`${CONFIG_PATH} not found — cannot determine the site origin`);
}

const configSrc = readFileSync(CONFIG_PATH, "utf8");
const siteMatch = /\bsite:\s*["']([^"']+)["']/.exec(configSrc);
if (!siteMatch) {
  fail(`${CONFIG_PATH}: could not find a \`site:\` config value to read the origin from`);
}
// The single source of truth for every absolute URL this gate checks —
// never duplicate this literal anywhere else in this file.
const ORIGIN = siteMatch[1].replace(/\/$/, "");

const violations = [];
function addViolation(check, detail) {
  violations.push({ check, detail });
}

/** Every <meta ...> tag in `html`, with its name/property key and content
 * value extracted (order-independent — some tags write `name` before
 * `content`, others write `property` before `content`). */
function collectMetaTags(html) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  return tags.map((tag) => {
    const keyMatch = /(?:name|property)\s*=\s*["']([^"']*)["']/i.exec(tag);
    const contentMatch = /content\s*=\s*["']([^"']*)["']/i.exec(tag);
    return {
      key: keyMatch ? keyMatch[1] : null,
      value: contentMatch ? contentMatch[1] : null,
      tag,
    };
  });
}

/** Every <link ...> tag in `html`, with its rel/href extracted. */
function collectLinkTags(html) {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  return tags.map((tag) => {
    const relMatch = /rel\s*=\s*["']([^"']*)["']/i.exec(tag);
    const hrefMatch = /href\s*=\s*["']([^"']*)["']/i.exec(tag);
    return {
      rel: relMatch ? relMatch[1].toLowerCase() : null,
      href: hrefMatch ? hrefMatch[1] : null,
      tag,
    };
  });
}

/** Every non-empty <title>...</title> text in `html`. */
function collectTitles(html) {
  return [...html.matchAll(/<title>([^<]*)<\/title>/gi)].map((m) => m[1].trim());
}

// -----------------------------------------------------------------------
// Check group: sitemap (SEO-03)
// -----------------------------------------------------------------------
let sitemapOk = true;
const sitemapIndexPath = join(DIST_DIR, "sitemap-index.xml");
const sitemap0Path = join(DIST_DIR, "sitemap-0.xml");

if (!existsSync(sitemapIndexPath)) {
  sitemapOk = false;
  addViolation("sitemap", `${sitemapIndexPath} not found`);
}
if (!existsSync(sitemap0Path)) {
  sitemapOk = false;
  addViolation("sitemap", `${sitemap0Path} not found`);
} else {
  const sitemap0 = readFileSync(sitemap0Path, "utf8");
  const locs = [...sitemap0.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  if (locs.length < 1) {
    sitemapOk = false;
    addViolation("sitemap", `${sitemap0Path} has no <loc> entries`);
  }
  for (const loc of locs) {
    if (loc.includes("og-template")) {
      sitemapOk = false;
      addViolation("sitemap", `${sitemap0Path} contains an og-template loc "${loc}"`);
    }
    if (loc.endsWith("/404") || loc.endsWith("/404.html")) {
      sitemapOk = false;
      addViolation("sitemap", `${sitemap0Path} contains a 404 loc "${loc}"`);
    }
    if (!loc.startsWith(ORIGIN)) {
      sitemapOk = false;
      addViolation(
        "sitemap",
        `${sitemap0Path} loc "${loc}" does not start with the configured origin "${ORIGIN}"`
      );
    }
  }
}

// -----------------------------------------------------------------------
// Check group: robots (SEO-04)
// -----------------------------------------------------------------------
let robotsOk = true;
const robotsPath = join(DIST_DIR, "robots.txt");
if (!existsSync(robotsPath)) {
  robotsOk = false;
  addViolation("robots", `${robotsPath} not found`);
} else {
  const robots = readFileSync(robotsPath, "utf8");
  if (!/User-agent:\s*\*/.test(robots)) {
    robotsOk = false;
    addViolation("robots", `${robotsPath} missing a "User-agent: *" line`);
  }
  if (!/Allow:\s*\//.test(robots)) {
    robotsOk = false;
    addViolation("robots", `${robotsPath} missing an "Allow: /" line`);
  }
  const sitemapLineMatch = /Sitemap:\s*(\S+)/.exec(robots);
  if (!sitemapLineMatch) {
    robotsOk = false;
    addViolation("robots", `${robotsPath} missing a "Sitemap:" line`);
  } else {
    const sitemapUrl = sitemapLineMatch[1];
    if (!sitemapUrl.startsWith(ORIGIN)) {
      robotsOk = false;
      addViolation(
        "robots",
        `${robotsPath} Sitemap URL "${sitemapUrl}" does not start with the configured origin "${ORIGIN}"`
      );
    }
    if (!sitemapUrl.endsWith("/sitemap-index.xml")) {
      robotsOk = false;
      addViolation(
        "robots",
        `${robotsPath} Sitemap URL "${sitemapUrl}" does not end with "/sitemap-index.xml"`
      );
    }
  }
}

// -----------------------------------------------------------------------
// Check groups: meta (SEO-01) + og (SEO-02) — per-page, then cross-page
// -----------------------------------------------------------------------
let metaOk = true;
let ogOk = true;

const PAGES = [
  { name: "index", path: join(DIST_DIR, "index.html") },
  { name: "404", path: join(DIST_DIR, "404.html") },
];

const REQUIRED_OG_KEYS = [
  "og:type",
  "og:title",
  "og:description",
  "og:image",
  "og:url",
  "og:locale",
  "og:site_name",
  "twitter:card",
  "twitter:title",
  "twitter:description",
  "twitter:image",
];

const pageData = {};

for (const page of PAGES) {
  if (!existsSync(page.path)) {
    metaOk = false;
    ogOk = false;
    addViolation("meta", `${page.path} not found`);
    addViolation("og", `${page.path} not found`);
    continue;
  }

  const html = readFileSync(page.path, "utf8");
  const titles = collectTitles(html);
  const metas = collectMetaTags(html);
  const links = collectLinkTags(html);

  // meta (SEO-01)
  if (titles.length !== 1 || !titles[0]) {
    metaOk = false;
    addViolation(
      "meta",
      `${page.path}: expected exactly one non-empty <title>, found ${titles.length}`
    );
  }
  const descriptions = metas.filter((m) => m.key === "description");
  if (descriptions.length !== 1 || !descriptions[0].value) {
    metaOk = false;
    addViolation(
      "meta",
      `${page.path}: expected exactly one non-empty meta name="description", found ${descriptions.length}`
    );
  }
  const canonicals = links.filter((l) => l.rel === "canonical");
  if (canonicals.length !== 1) {
    metaOk = false;
    addViolation(
      "meta",
      `${page.path}: expected exactly one link rel="canonical", found ${canonicals.length}`
    );
  } else if (!canonicals[0].href || !canonicals[0].href.startsWith(ORIGIN)) {
    metaOk = false;
    addViolation(
      "meta",
      `${page.path}: canonical href "${canonicals[0].href}" does not start with the configured origin "${ORIGIN}"`
    );
  }

  // og (SEO-02)
  const ogValues = {};
  for (const key of REQUIRED_OG_KEYS) {
    const found = metas.filter((m) => m.key === key);
    if (found.length < 1 || !found[0].value) {
      ogOk = false;
      addViolation("og", `${page.path}: missing or empty meta for "${key}"`);
    } else {
      ogValues[key] = found[0].value;
    }
  }
  const widthMeta = metas.find((m) => m.key === "og:image:width");
  if (!widthMeta || widthMeta.value !== "1200") {
    ogOk = false;
    addViolation(
      "og",
      `${page.path}: og:image:width must be exactly "1200", found "${widthMeta ? widthMeta.value : "(missing)"}"`
    );
  }
  const heightMeta = metas.find((m) => m.key === "og:image:height");
  if (!heightMeta || heightMeta.value !== "630") {
    ogOk = false;
    addViolation(
      "og",
      `${page.path}: og:image:height must be exactly "630", found "${heightMeta ? heightMeta.value : "(missing)"}"`
    );
  }
  if (ogValues["twitter:card"] && ogValues["twitter:card"] !== "summary_large_image") {
    ogOk = false;
    addViolation(
      "og",
      `${page.path}: twitter:card must be exactly "summary_large_image", found "${ogValues["twitter:card"]}"`
    );
  }
  for (const key of ["og:image", "og:url", "twitter:image"]) {
    const val = ogValues[key];
    if (val && !val.startsWith(ORIGIN)) {
      ogOk = false;
      addViolation(
        "og",
        `${page.path}: ${key} "${val}" must be an absolute URL starting with the configured origin "${ORIGIN}", not a relative path`
      );
    }
  }

  pageData[page.name] = { path: page.path, html, titles, descriptions, canonicals, ogValues, links };
}

// Cross-page checks — only meaningful once both pages were found above.
if (pageData.index && pageData["404"]) {
  if (
    pageData.index.titles[0] &&
    pageData.index.titles[0] === pageData["404"].titles[0]
  ) {
    metaOk = false;
    addViolation(
      "meta",
      "dist/index.html and dist/404.html share the same <title> text — SEO-01 requires each page to carry its own"
    );
  }
  const indexDesc = pageData.index.descriptions[0] ? pageData.index.descriptions[0].value : null;
  const notFoundDesc = pageData["404"].descriptions[0] ? pageData["404"].descriptions[0].value : null;
  if (indexDesc && indexDesc === notFoundDesc) {
    metaOk = false;
    addViolation(
      "meta",
      "dist/index.html and dist/404.html share the same meta description — SEO-01 requires each page to carry its own"
    );
  }
  const indexOgImage = pageData.index.ogValues["og:image"];
  const notFoundOgImage = pageData["404"].ogValues["og:image"];
  if (indexOgImage && notFoundOgImage && indexOgImage !== notFoundOgImage) {
    ogOk = false;
    addViolation(
      "og",
      `dist/index.html og:image "${indexOgImage}" does not match dist/404.html og:image "${notFoundOgImage}" — one shared OG image is required`
    );
  }
}

// -----------------------------------------------------------------------
// Check group: ogimage (SEO-02) — the real PNG behind og:image
// -----------------------------------------------------------------------
let ogimageOk = true;
const ogImagePath = join(DIST_DIR, "og-image.png");
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

if (!existsSync(ogImagePath)) {
  ogimageOk = false;
  addViolation("ogimage", `${ogImagePath} not found`);
} else {
  const buf = readFileSync(ogImagePath);
  if (buf.length < 24 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
    ogimageOk = false;
    addViolation("ogimage", `${ogImagePath} does not start with the PNG signature`);
  } else {
    // IHDR chunk always immediately follows the 8-byte signature + 8-byte
    // chunk header: width at bytes 16-19, height at 20-23, both big-endian.
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (width !== 1200) {
      ogimageOk = false;
      addViolation("ogimage", `${ogImagePath} width is ${width}, expected 1200`);
    }
    if (height !== 630) {
      ogimageOk = false;
      addViolation("ogimage", `${ogImagePath} height is ${height}, expected 630`);
    }
  }
}

// The path segment of each page's og:image must name a file that actually
// exists in dist/ — catches a rewritten-to-relative og:image (Pitfall 2).
for (const page of PAGES) {
  const data = pageData[page.name];
  if (!data) continue;
  const ogImageUrl = data.ogValues["og:image"];
  if (!ogImageUrl) continue;
  let pathname;
  try {
    pathname = new URL(ogImageUrl).pathname;
  } catch {
    ogimageOk = false;
    addViolation(
      "ogimage",
      `${page.path}: og:image "${ogImageUrl}" is not a valid absolute URL, cannot resolve to a dist/ file`
    );
    continue;
  }
  const resolvedPath = join(DIST_DIR, pathname);
  if (!existsSync(resolvedPath)) {
    ogimageOk = false;
    addViolation(
      "ogimage",
      `${page.path}: og:image resolves to "${pathname}", which does not exist in dist/`
    );
  }
}

// -----------------------------------------------------------------------
// Check group: favicon (SEO-05)
// -----------------------------------------------------------------------
let faviconOk = true;
const faviconSvgPath = join(DIST_DIR, "favicon.svg");
const faviconIcoPath = join(DIST_DIR, "favicon.ico");
const appleTouchIconPath = join(DIST_DIR, "apple-touch-icon.png");

for (const [label, filePath] of [
  ["favicon.svg", faviconSvgPath],
  ["favicon.ico", faviconIcoPath],
  ["apple-touch-icon.png", appleTouchIconPath],
]) {
  if (!existsSync(filePath)) {
    faviconOk = false;
    addViolation("favicon", `dist/${label} not found`);
  } else if (statSync(filePath).size === 0) {
    faviconOk = false;
    addViolation("favicon", `dist/${label} is empty`);
  }
}

if (existsSync(faviconSvgPath)) {
  const svg = readFileSync(faviconSvgPath, "utf8");
  if (!svg.includes("00f0ff")) {
    faviconOk = false;
    addViolation("favicon", 'dist/favicon.svg is missing the accent color "00f0ff"');
  }
  if (/<text\b/i.test(svg)) {
    faviconOk = false;
    addViolation(
      "favicon",
      "dist/favicon.svg contains a <text> element — the glyph must be a genuine vector shape, not literal text"
    );
  }
}

if (existsSync(faviconIcoPath)) {
  const icoBuf = readFileSync(faviconIcoPath);
  if (icoBuf.length < 6) {
    faviconOk = false;
    addViolation("favicon", "dist/favicon.ico is too small to read an embedded-image count");
  } else {
    // ICONDIR header: embedded-image count is a little-endian uint16 at
    // byte offset 4.
    const count = icoBuf.readUInt16LE(4);
    if (count !== 3) {
      faviconOk = false;
      addViolation(
        "favicon",
        `dist/favicon.ico embedded-image count is ${count}, expected 3`
      );
    }
  }
}

for (const page of PAGES) {
  const data = pageData[page.name];
  if (!data) continue;
  const hasSvgIcon = data.links.some((l) => l.rel === "icon" && l.href === "/favicon.svg");
  const hasIcoIcon = data.links.some((l) => l.rel === "icon" && l.href === "/favicon.ico");
  const hasAppleTouchIcon = data.links.some(
    (l) => l.rel === "apple-touch-icon" && l.href === "/apple-touch-icon.png"
  );
  if (!hasSvgIcon) {
    faviconOk = false;
    addViolation("favicon", `${page.path}: missing rel="icon" href="/favicon.svg"`);
  }
  if (!hasIcoIcon) {
    faviconOk = false;
    addViolation("favicon", `${page.path}: missing rel="icon" href="/favicon.ico"`);
  }
  if (!hasAppleTouchIcon) {
    faviconOk = false;
    addViolation(
      "favicon",
      `${page.path}: missing rel="apple-touch-icon" href="/apple-touch-icon.png"`
    );
  }
}

// -----------------------------------------------------------------------
// Check group: ogtemplate (SEO-02 hygiene — the internal screenshot route
// must never be indexed)
// -----------------------------------------------------------------------
let ogtemplateOk = true;
const ogTemplatePath = join(DIST_DIR, "og-template", "index.html");
if (!existsSync(ogTemplatePath)) {
  ogtemplateOk = false;
  addViolation("ogtemplate", `${ogTemplatePath} not found`);
} else {
  const html = readFileSync(ogTemplatePath, "utf8");
  const metas = collectMetaTags(html);
  const robotsMeta = metas.find((m) => m.key === "robots");
  if (!robotsMeta || !robotsMeta.value || !robotsMeta.value.includes("noindex")) {
    ogtemplateOk = false;
    addViolation(
      "ogtemplate",
      `${ogTemplatePath} missing a meta name="robots" tag whose content includes "noindex"`
    );
  }
}

// -----------------------------------------------------------------------
// Print violations + summary line.
// -----------------------------------------------------------------------
for (const v of violations) {
  console.error(`verify-seo: ${v.check} — ${v.detail}`);
}

console.log(
  `SEO SUMMARY sitemap=${sitemapOk ? "ok" : "fail"} robots=${
    robotsOk ? "ok" : "fail"
  } meta=${metaOk ? "ok" : "fail"} og=${ogOk ? "ok" : "fail"} ogimage=${
    ogimageOk ? "ok" : "fail"
  } favicon=${faviconOk ? "ok" : "fail"} ogtemplate=${
    ogtemplateOk ? "ok" : "fail"
  } violations=${violations.length}`
);

process.exit(violations.length === 0 ? 0 : 1);
