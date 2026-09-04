#!/usr/bin/env node
// DEPLOY-02 gate — live production header verification against the REAL
// deployed URL (never astro dev/preview, which do not simulate Vercel's
// header layer). Plain Node ESM, zero third-party dependencies (node:fs
// only, plus the global fetch built into Node >=22.12).
//
// Contract (see 05-01-PLAN.md Task 1):
// - Takes the production URL from process.argv[2] into a single named
//   binding (PROD_URL) — never a duplicated literal domain anywhere else
//   in this file.
// - Exit 1 immediately, with a fixed usage message, if argv[2] is absent.
// - If the URL's protocol is not "https:", add a violation named "https"
//   and exit 1 WITHOUT fetching anything.
// - Fetches two paths off the given origin: "/" (expects 200) and
//   "/__gsd-404-probe" (a deliberately non-existent path, expects 404 —
//   proves the custom 404 page also carries the header set, and that the
//   "/(.*)" vercel.json rule matches sub-paths, not just the root).
// - Applies the full SEC-02/SEC-03 header assertion set to BOTH responses
//   independently: content-security-policy, strict-transport-security,
//   x-frame-options, x-content-type-options, referrer-policy,
//   permissions-policy.
// - Adds a "hash-drift" violation if vercel.json exists locally and its
//   Content-Security-Policy 'sha256-...' token set differs from the live
//   response's token set. Silently skipped if vercel.json is absent.
// - Accumulates every finding into a `violations` array — never exits on
//   the first failure.
// - Prints every header's actual value to stdout per fetched path, then
//   each violation to stderr as `verify-deploy-headers: <check> — <detail>`,
//   then exactly one summary line to stdout as the last line before exit:
//     DEPLOY SUMMARY url=<url> paths=<n> root_status=<n> notfound_status=<n> csp=<ok|fail> hsts=<ok|fail> xfo=<ok|fail> xcto=<ok|fail> refpol=<ok|fail> permpol=<ok|fail> violations=<n>
// - Exits 0 only when violations is empty.

import { readFileSync, existsSync } from "node:fs";

const PROD_URL = process.argv[2];

if (!PROD_URL) {
  console.error("usage: node scripts/verify-deploy-headers.mjs <production-url>");
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
  console.error(`verify-deploy-headers: url — "${PROD_URL}" is not a valid URL (${err.message})`);
  process.exit(1);
}

const checkResults = {
  csp: true,
  hsts: true,
  xfo: true,
  xcto: true,
  refpol: true,
  permpol: true,
};

function printSummaryAndExit(rootStatus, notfoundStatus, pathsAttempted) {
  for (const v of violations) {
    console.error(`verify-deploy-headers: ${v.check} — ${v.detail}`);
  }
  console.log(
    `DEPLOY SUMMARY url=${PROD_URL} paths=${pathsAttempted} root_status=${rootStatus} notfound_status=${notfoundStatus} csp=${
      checkResults.csp ? "ok" : "fail"
    } hsts=${checkResults.hsts ? "ok" : "fail"} xfo=${checkResults.xfo ? "ok" : "fail"} xcto=${
      checkResults.xcto ? "ok" : "fail"
    } refpol=${checkResults.refpol ? "ok" : "fail"} permpol=${
      checkResults.permpol ? "ok" : "fail"
    } violations=${violations.length}`
  );
  process.exit(violations.length === 0 ? 0 : 1);
}

if (parsedUrl.protocol !== "https:") {
  addViolation("https", `protocol is "${parsedUrl.protocol}", expected "https:" (DEPLOY-01 requires HTTPS)`);
  checkResults.csp = false;
  checkResults.hsts = false;
  checkResults.xfo = false;
  checkResults.xcto = false;
  checkResults.refpol = false;
  checkResults.permpol = false;
  printSummaryAndExit(0, 0, 0);
}

const ORIGIN = parsedUrl.origin;
const PATHS = [
  { name: "root", path: "/", expectedStatus: 200 },
  { name: "notfound", path: "/__gsd-404-probe", expectedStatus: 404 },
];

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
const REQUIRED_PERMPOL_FEATURES = ["camera=()", "microphone=()", "geolocation=()"];

let rootStatus = 0;
let notfoundStatus = 0;
let liveCspValue = null;

for (const p of PATHS) {
  const targetUrl = `${ORIGIN}${p.path}`;
  let res;
  try {
    res = await fetch(targetUrl, { method: "GET", redirect: "follow" });
  } catch (err) {
    addViolation("fetch", `failed to fetch "${targetUrl}": ${err.message}`);
    checkResults.csp = false;
    checkResults.hsts = false;
    checkResults.xfo = false;
    checkResults.xcto = false;
    checkResults.refpol = false;
    checkResults.permpol = false;
    continue;
  }

  if (p.name === "root") rootStatus = res.status;
  if (p.name === "notfound") notfoundStatus = res.status;

  if (res.status !== p.expectedStatus) {
    addViolation("status", `${p.path} returned status ${res.status}, expected ${p.expectedStatus}`);
  }

  const csp = res.headers.get("content-security-policy");
  const hsts = res.headers.get("strict-transport-security");
  const xfo = res.headers.get("x-frame-options");
  const xcto = res.headers.get("x-content-type-options");
  const refpol = res.headers.get("referrer-policy");
  const permpol = res.headers.get("permissions-policy");

  console.log(`${p.path} content-security-policy: ${csp ?? "(missing)"}`);
  console.log(`${p.path} strict-transport-security: ${hsts ?? "(missing)"}`);
  console.log(`${p.path} x-frame-options: ${xfo ?? "(missing)"}`);
  console.log(`${p.path} x-content-type-options: ${xcto ?? "(missing)"}`);
  console.log(`${p.path} referrer-policy: ${refpol ?? "(missing)"}`);
  console.log(`${p.path} permissions-policy: ${permpol ?? "(missing)"}`);

  if (p.name === "root") {
    liveCspValue = csp;
  }

  // content-security-policy
  if (!csp) {
    checkResults.csp = false;
    addViolation("csp", `${p.path}: content-security-policy header missing`);
  } else {
    const scriptSrcMatch = /script-src([^;]*)/.exec(csp);
    if (!scriptSrcMatch) {
      checkResults.csp = false;
      addViolation("csp", `${p.path}: missing script-src directive`);
    } else {
      const scriptSrcVal = scriptSrcMatch[1];
      if (!scriptSrcVal.includes("'self'")) {
        checkResults.csp = false;
        addViolation("csp", `${p.path}: script-src missing 'self'`);
      }
      if (!/'sha256-/.test(scriptSrcVal)) {
        checkResults.csp = false;
        addViolation("csp", `${p.path}: script-src missing a 'sha256-...' token`);
      }
    }
    for (const substr of REQUIRED_CSP_SUBSTRINGS) {
      if (!csp.includes(substr)) {
        checkResults.csp = false;
        addViolation("csp", `${p.path}: missing "${substr}"`);
      }
    }
  }

  // strict-transport-security
  if (!hsts) {
    checkResults.hsts = false;
    addViolation("hsts", `${p.path}: strict-transport-security header missing`);
  } else {
    const maxAgeMatch = /max-age=(\d+)/.exec(hsts);
    const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
    if (!maxAgeMatch || maxAge < 31536000) {
      checkResults.hsts = false;
      addViolation(
        "hsts",
        `${p.path}: max-age is ${maxAgeMatch ? maxAge : "(missing)"}, expected >= 31536000`
      );
    }
    if (!/includeSubDomains/i.test(hsts)) {
      checkResults.hsts = false;
      addViolation("hsts", `${p.path}: missing includeSubDomains`);
    }
    if (/preload/i.test(hsts)) {
      checkResults.hsts = false;
      addViolation("hsts", `${p.path}: contains forbidden preload token (D-03 locks preload out)`);
    }
  }

  // x-frame-options
  if (!xfo || xfo.toUpperCase() !== "DENY") {
    checkResults.xfo = false;
    addViolation("xfo", `${p.path}: x-frame-options is "${xfo ?? "(missing)"}", expected "DENY"`);
  }

  // x-content-type-options
  if (!xcto || xcto.toLowerCase() !== "nosniff") {
    checkResults.xcto = false;
    addViolation(
      "xcto",
      `${p.path}: x-content-type-options is "${xcto ?? "(missing)"}", expected "nosniff"`
    );
  }

  // referrer-policy
  if (!refpol || refpol !== "strict-origin-when-cross-origin") {
    checkResults.refpol = false;
    addViolation(
      "refpol",
      `${p.path}: referrer-policy is "${refpol ?? "(missing)"}", expected "strict-origin-when-cross-origin"`
    );
  }

  // permissions-policy
  if (!permpol) {
    checkResults.permpol = false;
    addViolation("permpol", `${p.path}: permissions-policy header missing`);
  } else {
    for (const feat of REQUIRED_PERMPOL_FEATURES) {
      if (!permpol.includes(feat)) {
        checkResults.permpol = false;
        addViolation("permpol", `${p.path}: missing "${feat}"`);
      }
    }
  }
}

// hash-drift — only when a local vercel.json exists (skip silently otherwise).
if (existsSync("vercel.json")) {
  try {
    const vercelConfig = JSON.parse(readFileSync("vercel.json", "utf8"));
    const entry = (vercelConfig.headers || []).find((h) => h.source === "/(.*)");
    const cspHeaderObj = entry ? entry.headers.find((h) => h.key === "Content-Security-Policy") : null;
    const vercelCspValue = cspHeaderObj ? cspHeaderObj.value : null;
    if (vercelCspValue && liveCspValue) {
      const extractHashes = (val) =>
        new Set([...val.matchAll(/'(sha256-[A-Za-z0-9+/=]+)'/g)].map((m) => m[1]));
      const liveHashes = extractHashes(liveCspValue);
      const vercelHashes = extractHashes(vercelCspValue);
      const same =
        liveHashes.size === vercelHashes.size && [...liveHashes].every((h) => vercelHashes.has(h));
      if (!same) {
        addViolation(
          "hash-drift",
          `live CSP script-src hashes [${[...liveHashes].join(", ")}] do not match vercel.json's [${[
            ...vercelHashes,
          ].join(", ")}]`
        );
      }
    }
  } catch (err) {
    addViolation("hash-drift", `failed to read/parse vercel.json: ${err.message}`);
  }
}

printSummaryAndExit(rootStatus, notfoundStatus, PATHS.length);
