#!/usr/bin/env node
// SEC-01 gate — deterministic scan of dist/ for any external network origin
// (script/font/icon). Plain Node ESM, zero dependencies (node:fs/node:path only).
//
// Contract (see 01-01-PLAN.md Task 1):
// - Exit 1 immediately if dist/ does not exist, with a fixed message (RED state
//   before any build has run).
// - Walk dist/ recursively, read every file matching SCAN_EXTENSIONS.
// - Report violations (file + 1-based line number) for:
//     * literal substrings: fonts.googleapis.com, fonts.gstatic.com, cdn.tailwindcss.com
//     * <link href="http(s)://...">
//     * <script src="http(s)://...">
//     * CSS @import targeting an absolute http(s) URL
//     * rel="preconnect" / rel="dns-prefetch" pointing at an absolute external URL
//     * @font-face src: url(...) targeting an absolute http(s) URL
// - Does NOT flag the bare string "material-symbols" — SEC-01 is about origins,
//   not identifiers (astro-icon legitimately inlines that name in attributes).
// - Always prints exactly one summary line before exiting:
//     SEC01 SUMMARY files=<n> woff2=<n> fontface=<n> inline_svg=<n> external_refs=<n>
// - Exits 0 only when external_refs=0.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const DIST_DIR = "dist";
const SCAN_EXTENSIONS = new Set([
  ".html",
  ".css",
  ".js",
  ".mjs",
  ".json",
  ".xml",
  ".txt",
  ".svg",
]);

const LITERAL_SUBSTRINGS = [
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "cdn.tailwindcss.com",
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync(DIST_DIR)) {
  fail("dist/ not found — run npm run build first");
}

/** Recursively collect every file path under a directory. */
function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, acc);
    } else if (stat.isFile()) {
      acc.push(fullPath);
    }
  }
  return acc;
}

function lineNumberAt(content, index) {
  return content.slice(0, index).split("\n").length;
}

const allFiles = walk(DIST_DIR);

let filesScanned = 0;
let woff2Count = 0;
let fontfaceCount = 0;
let inlineSvgCount = 0;
const violations = [];

function addViolation(filePath, index, content, reason) {
  const line = lineNumberAt(content, index);
  violations.push({ filePath, line, reason });
}

for (const filePath of allFiles) {
  const ext = extname(filePath).toLowerCase();

  if (ext === ".woff2") {
    woff2Count++;
    continue;
  }

  if (!SCAN_EXTENSIONS.has(ext)) {
    continue;
  }

  filesScanned++;
  const content = readFileSync(filePath, "utf8");

  // 1. Literal external-host substrings.
  for (const needle of LITERAL_SUBSTRINGS) {
    let searchFrom = 0;
    let idx;
    while ((idx = content.indexOf(needle, searchFrom)) !== -1) {
      addViolation(filePath, idx, content, `contains literal "${needle}"`);
      searchFrom = idx + needle.length;
    }
  }

  // 2. <link ...> tags — check href + rel together.
  const linkTagRegex = /<link\b[^>]*>/gi;
  let linkMatch;
  while ((linkMatch = linkTagRegex.exec(content)) !== null) {
    const tag = linkMatch[0];
    const hrefMatch = /href\s*=\s*["']([^"']*)["']/i.exec(tag);
    const relMatch = /rel\s*=\s*["']([^"']*)["']/i.exec(tag);
    const href = hrefMatch ? hrefMatch[1] : null;
    const rel = relMatch ? relMatch[1].toLowerCase() : null;

    if (href && /^https?:\/\//i.test(href)) {
      if (rel === "preconnect" || rel === "dns-prefetch") {
        addViolation(
          filePath,
          linkMatch.index,
          content,
          `<link rel="${rel}"> targets external origin "${href}"`
        );
      } else {
        addViolation(
          filePath,
          linkMatch.index,
          content,
          `<link href> targets external origin "${href}"`
        );
      }
    }
  }

  // 3. <script ...> tags — check src.
  const scriptTagRegex = /<script\b[^>]*>/gi;
  let scriptMatch;
  while ((scriptMatch = scriptTagRegex.exec(content)) !== null) {
    const tag = scriptMatch[0];
    const srcMatch = /src\s*=\s*["']([^"']*)["']/i.exec(tag);
    const src = srcMatch ? srcMatch[1] : null;
    if (src && /^https?:\/\//i.test(src)) {
      addViolation(
        filePath,
        scriptMatch.index,
        content,
        `<script src> targets external origin "${src}"`
      );
    }
  }

  // 4. CSS @import targeting an absolute external URL.
  const importRegex = /@import\s+(?:url\(\s*)?["']?(https?:\/\/[^"')\s]+)["']?\)?/gi;
  let importMatch;
  while ((importMatch = importRegex.exec(content)) !== null) {
    addViolation(
      filePath,
      importMatch.index,
      content,
      `@import targets external origin "${importMatch[1]}"`
    );
  }

  // 5. @font-face blocks — count them, and check src: url(...) targets.
  const fontFaceBlockRegex = /@font-face\s*\{([^}]*)\}/gi;
  let fontFaceMatch;
  while ((fontFaceMatch = fontFaceBlockRegex.exec(content)) !== null) {
    fontfaceCount++;
    const blockBody = fontFaceMatch[1];
    const blockStart = fontFaceMatch.index;
    const urlRegex = /url\(\s*["']?([^"')]+)["']?\s*\)/gi;
    let urlMatch;
    while ((urlMatch = urlRegex.exec(blockBody)) !== null) {
      const url = urlMatch[1];
      if (/^https?:\/\//i.test(url)) {
        addViolation(
          filePath,
          blockStart + urlMatch.index,
          content,
          `@font-face src url() targets external origin "${url}"`
        );
      }
    }
  }

  // 6. Inline SVG count (HTML files only).
  if (ext === ".html") {
    const svgRegex = /<svg\b/gi;
    const matches = content.match(svgRegex);
    if (matches) {
      inlineSvgCount += matches.length;
    }
  }
}

if (violations.length > 0) {
  for (const v of violations) {
    console.error(`${v.filePath}:${v.line}: ${v.reason}`);
  }
}

console.log(
  `SEC01 SUMMARY files=${filesScanned} woff2=${woff2Count} fontface=${fontfaceCount} inline_svg=${inlineSvgCount} external_refs=${violations.length}`
);

process.exit(violations.length === 0 ? 0 : 1);
