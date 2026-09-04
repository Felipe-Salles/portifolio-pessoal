#!/usr/bin/env node
// SEC-02/SEC-03 gate — build-time CSP-hash drift + header-shape check over
// dist/ and vercel.json. Plain Node ESM, zero third-party dependencies
// (node:fs/node:path/node:crypto only), same contract as every other
// scripts/verify-*.mjs gate in this project.
//
// Contract (see 05-01-PLAN.md Task 3):
// - Exit 1 immediately, with a fixed message, if dist/ does not exist (run
//   npm run build first) or if vercel.json does not exist (SEC-02's CSP
//   header source is missing).
// - Walks dist/ recursively, collecting every .html file. For each, extracts
//   every inline <script> (no src= attribute), hashes its body SHA-256
//   base64 prefixed "sha256-", and collects the deduplicated set. Also
//   counts every <style tag and every ` style="` attribute occurrence.
// - Reads vercel.json's Content-Security-Policy (and the other five SEC-03
//   header values) from the headers entry whose source is "/(.*)".
// - Accumulates every finding into a `violations` array — never exits on
//   the first failure — across five checks: missing-hash, stale-hash,
//   inline-style, csp-directive, sec03-header.
// - Prints each violation to stderr as `verify-csp-hash: <check> — <detail>`.
// - Always prints exactly one summary line to stdout before exiting:
//     CSPHASH SUMMARY pages=<n> inline_scripts=<n> hashes=<n> matched=<n> stale=<n> inline_styles=<n> sec03=<ok|fail> violations=<n>
// - Exits 0 only when violations=0.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { createHash } from "node:crypto";

const DIST_DIR = "dist";
const VERCEL_JSON = "vercel.json";

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync(DIST_DIR)) {
  fail("dist/ not found — run npm run build first");
}

if (!existsSync(VERCEL_JSON)) {
  fail("vercel.json not found — SEC-02's CSP header source is missing");
}

/** Recursively collect every .html file path under a directory. */
function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, acc);
    } else if (stat.isFile() && extname(fullPath).toLowerCase() === ".html") {
      acc.push(fullPath);
    }
  }
  return acc;
}

const violations = [];
function addViolation(check, detail) {
  violations.push({ check, detail });
}

const htmlFiles = walk(DIST_DIR);

const INLINE_SCRIPT_REGEX = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g;

let inlineScriptCount = 0;
let inlineStyleCount = 0;
const computedHashes = new Set();

for (const filePath of htmlFiles) {
  const content = readFileSync(filePath, "utf8");

  for (const match of content.matchAll(INLINE_SCRIPT_REGEX)) {
    inlineScriptCount++;
    const hash = `sha256-${createHash("sha256").update(match[1], "utf8").digest("base64")}`;
    computedHashes.add(hash);
  }

  const styleTagMatches = content.match(/<style\b/gi);
  if (styleTagMatches) {
    inlineStyleCount += styleTagMatches.length;
    addViolation(
      "inline-style",
      `${filePath}: contains ${styleTagMatches.length} <style> tag(s), which style-src 'self' would block`
    );
  }

  const styleAttrMatches = content.match(/ style="/g);
  if (styleAttrMatches) {
    inlineStyleCount += styleAttrMatches.length;
    addViolation(
      "inline-style",
      `${filePath}: contains ${styleAttrMatches.length} style="..." attribute(s), which style-src 'self' would block`
    );
  }
}

const vercelConfig = JSON.parse(readFileSync(VERCEL_JSON, "utf8"));
const entry = (vercelConfig.headers || []).find((h) => h.source === "/(.*)");
if (!entry) {
  fail(`${VERCEL_JSON}: no headers entry with source "/(.*)" found`);
}
const headerMap = Object.fromEntries(entry.headers.map((h) => [h.key, h.value]));
const csp = headerMap["Content-Security-Policy"];
const hsts = headerMap["Strict-Transport-Security"];
const xfo = headerMap["X-Frame-Options"];
const xcto = headerMap["X-Content-Type-Options"];
const refpol = headerMap["Referrer-Policy"];
const permpol = headerMap["Permissions-Policy"];

// missing-hash / stale-hash — dist/ inline-script hashes vs. the CSP's
// declared 'sha256-...' tokens.
const declaredHashes = csp
  ? new Set([...csp.matchAll(/'(sha256-[A-Za-z0-9+/=]+)'/g)].map((m) => m[1]))
  : new Set();

let matched = 0;
for (const h of computedHashes) {
  if (declaredHashes.has(h)) {
    matched++;
  } else {
    addViolation("missing-hash", `dist/ inline-script hash "${h}" not found in vercel.json's CSP script-src`);
  }
}

let staleCount = 0;
for (const h of declaredHashes) {
  if (!computedHashes.has(h)) {
    staleCount++;
    addViolation("stale-hash", `vercel.json CSP script-src contains "${h}", which no dist/ inline script reproduces`);
  }
}

// csp-directive — required CSP substrings + script-src 'self'.
const REQUIRED_CSP_SUBSTRINGS = [
  "default-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "font-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
];

if (!csp) {
  addViolation("csp-directive", "vercel.json missing a Content-Security-Policy header value");
} else {
  for (const substr of REQUIRED_CSP_SUBSTRINGS) {
    if (!csp.includes(substr)) {
      addViolation("csp-directive", `Content-Security-Policy missing "${substr}"`);
    }
  }
  const scriptSrcMatch = /script-src([^;]*)/.exec(csp);
  if (!scriptSrcMatch || !scriptSrcMatch[1].includes("'self'")) {
    addViolation("csp-directive", "Content-Security-Policy script-src omits 'self'");
  }
}

// sec03-header — HSTS (no preload, D-03), X-Frame-Options, X-Content-Type-
// Options, Referrer-Policy, Permissions-Policy.
let sec03Ok = true;

if (!hsts) {
  sec03Ok = false;
  addViolation("sec03-header", "Strict-Transport-Security header missing");
} else {
  const maxAgeMatch = /max-age=(\d+)/.exec(hsts);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
  if (!maxAgeMatch || maxAge < 31536000) {
    sec03Ok = false;
    addViolation(
      "sec03-header",
      `Strict-Transport-Security max-age is ${maxAgeMatch ? maxAge : "(missing)"}, expected >= 31536000`
    );
  }
  if (!/includeSubDomains/i.test(hsts)) {
    sec03Ok = false;
    addViolation("sec03-header", "Strict-Transport-Security missing includeSubDomains");
  }
  if (/preload/i.test(hsts)) {
    sec03Ok = false;
    addViolation("sec03-header", "Strict-Transport-Security contains forbidden preload token (D-03 forbids it)");
  }
}

if (xfo !== "DENY") {
  sec03Ok = false;
  addViolation("sec03-header", `X-Frame-Options is "${xfo ?? "(missing)"}", expected exactly "DENY"`);
}

if (xcto !== "nosniff") {
  sec03Ok = false;
  addViolation("sec03-header", `X-Content-Type-Options is "${xcto ?? "(missing)"}", expected exactly "nosniff"`);
}

if (refpol !== "strict-origin-when-cross-origin") {
  sec03Ok = false;
  addViolation(
    "sec03-header",
    `Referrer-Policy is "${refpol ?? "(missing)"}", expected exactly "strict-origin-when-cross-origin"`
  );
}

const REQUIRED_PERMPOL_FEATURES = ["camera=()", "microphone=()", "geolocation=()"];
if (!permpol) {
  sec03Ok = false;
  addViolation("sec03-header", "Permissions-Policy header missing");
} else {
  for (const feat of REQUIRED_PERMPOL_FEATURES) {
    if (!permpol.includes(feat)) {
      sec03Ok = false;
      addViolation("sec03-header", `Permissions-Policy missing "${feat}"`);
    }
  }
}

for (const v of violations) {
  console.error(`verify-csp-hash: ${v.check} — ${v.detail}`);
}

console.log(
  `CSPHASH SUMMARY pages=${htmlFiles.length} inline_scripts=${inlineScriptCount} hashes=${computedHashes.size} matched=${matched} stale=${staleCount} inline_styles=${inlineStyleCount} sec03=${
    sec03Ok ? "ok" : "fail"
  } violations=${violations.length}`
);

process.exit(violations.length === 0 ? 0 : 1);
