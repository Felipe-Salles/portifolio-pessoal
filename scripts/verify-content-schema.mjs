#!/usr/bin/env node
// Content Collection schema enforcement gate — plan 01-03.
//
// Dependency-free Node ESM (node:fs, node:path, node:child_process only).
//
// Contract (see 01-03-PLAN.md Task 1):
// 1. Location check — `src/content.config.ts` exists, `src/content/config.ts`
//    does NOT (the legacy path is silently ignored by Astro 6+).
// 2. Shape check — `src/content.config.ts` declares its schema as the
//    injected-function form `({ image }) => z.object({...})`, uses the
//    glob() loader with base "./src/content/projects", and contains all 8
//    required field names.
// 3. Positive test — `npx astro build` must exit 0 with the valid placeholder
//    entry in place.
// 4. Negative test — a temporary probe entry missing the required
//    `description` field must make `npx astro build` exit non-zero. The
//    probe is always deleted afterward (success, failure, or throw).
// 5. D-03 convention check — no project content file (and src/data/site.ts,
//    once it exists) contains the prototype's fictional persona strings, and
//    each contains at least one PLACEHOLDER/bracketed marker.
//
// Always prints exactly one summary line before exiting:
//   SCHEMA SUMMARY location=ok shape=ok positive=<pass|fail> negative=<pass|fail> placeholders=<n>_files_ok
// Exits 0 only when every check passes.

import {
  readFileSync,
  writeFileSync,
  rmSync,
  existsSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const CONTENT_CONFIG = "src/content.config.ts";
const LEGACY_CONFIG = "src/content/config.ts";
const PROJECTS_DIR = "src/content/projects";
const PROBE_PATH = join(PROJECTS_DIR, "__schema-probe.md");
const SITE_DATA_PATH = "src/data/site.ts";

const REQUIRED_FIELDS = [
  "title",
  "description",
  "tags",
  "liveUrl",
  "repoUrl",
  "coverImage",
  "featured",
  "order",
];

const FICTIONAL_STRINGS = [
  "SYSTEM_ARCHITECT",
  "ARCHITECT",
  "SYSTEM.CORE",
  "Neural Engine",
  "Vault-X",
  "Omni-Stream",
  "AVAILABLE FOR NEW PROJECTS",
];

const errors = [];

function fail(message) {
  errors.push(message);
  console.error(message);
}

// ---------------------------------------------------------------------------
// 1. Location check
// ---------------------------------------------------------------------------
let locationOk = true;
if (!existsSync(CONTENT_CONFIG)) {
  locationOk = false;
  fail(`${CONTENT_CONFIG} does not exist`);
}
if (existsSync(LEGACY_CONFIG)) {
  locationOk = false;
  fail(
    `${LEGACY_CONFIG} exists — legacy collection location, silently ignored by Astro 6+`
  );
}

// ---------------------------------------------------------------------------
// 2. Shape check
// ---------------------------------------------------------------------------
let shapeOk = true;
if (existsSync(CONTENT_CONFIG)) {
  const configText = readFileSync(CONTENT_CONFIG, "utf8");

  const schemaFunctionRegex = /schema:\s*\(\{\s*image\s*\}\)\s*=>/;
  if (!schemaFunctionRegex.test(configText)) {
    shapeOk = false;
    fail(
      "schema is not declared in the injected-function form `({ image }) => z.object({...})`"
    );
  }

  const globBaseRegex =
    /glob\(\{[^}]*base:\s*["']\.\/src\/content\/projects["']/;
  if (!globBaseRegex.test(configText)) {
    shapeOk = false;
    fail(
      `glob() loader with base "./src/content/projects" not found in ${CONTENT_CONFIG}`
    );
  }

  for (const field of REQUIRED_FIELDS) {
    if (!configText.includes(field)) {
      shapeOk = false;
      fail(`required field "${field}" not found in ${CONTENT_CONFIG}`);
    }
  }
} else {
  shapeOk = false;
}

// ---------------------------------------------------------------------------
// 3. Positive test — the valid placeholder entry must build clean.
// ---------------------------------------------------------------------------
let positivePass = false;
try {
  execSync("npx astro build", { stdio: "pipe" });
  positivePass = true;
} catch (err) {
  positivePass = false;
  fail("positive test failed: `npx astro build` exited non-zero with only the valid placeholder entry present");
  if (err.stdout) console.error(err.stdout.toString());
  if (err.stderr) console.error(err.stderr.toString());
}

// ---------------------------------------------------------------------------
// 4. Negative test — an entry missing the required `description` field must
//    break the build. Probe is deleted in a finally-style cleanup no matter
//    what happens.
// ---------------------------------------------------------------------------
let negativePass = false;
try {
  writeFileSync(
    PROBE_PATH,
    `---\ntitle: "[Probe]"\ntags: ["PLACEHOLDER"]\n---\n\nPLACEHOLDER — invalid probe entry, missing required description.\n`,
    "utf8"
  );

  let buildSucceeded = false;
  try {
    execSync("npx astro build", { stdio: "pipe" });
    buildSucceeded = true;
  } catch {
    buildSucceeded = false;
  }

  if (buildSucceeded) {
    negativePass = false;
    fail(
      "negative test failed: `npx astro build` exited 0 with an invalid probe entry present — the schema is not being enforced"
    );
  } else {
    negativePass = true;
  }
} finally {
  if (existsSync(PROBE_PATH)) {
    rmSync(PROBE_PATH);
  }
}

// ---------------------------------------------------------------------------
// 5. D-03 placeholder-convention check
// ---------------------------------------------------------------------------
let placeholderFilesOk = 0;
let placeholderCheckFailed = false;

function checkPlaceholderFile(filePath) {
  const text = readFileSync(filePath, "utf8");

  for (const fictional of FICTIONAL_STRINGS) {
    if (text.includes(fictional)) {
      placeholderCheckFailed = true;
      fail(`${filePath} contains fictional persona string "${fictional}"`);
      return;
    }
  }

  const hasPlaceholderMarker = text.includes("PLACEHOLDER");
  const hasBracketMarker = /\[[^\]\n]+\]/.test(text);
  if (!hasPlaceholderMarker && !hasBracketMarker) {
    placeholderCheckFailed = true;
    fail(
      `${filePath} contains no PLACEHOLDER or bracketed [...] marker — provisional content must be conspicuous (D-03)`
    );
    return;
  }

  placeholderFilesOk++;
}

if (existsSync(PROJECTS_DIR)) {
  for (const entry of readdirSync(PROJECTS_DIR)) {
    if (entry.endsWith(".md")) {
      checkPlaceholderFile(join(PROJECTS_DIR, entry));
    }
  }
} else {
  placeholderCheckFailed = true;
  fail(`${PROJECTS_DIR} does not exist`);
}

// Skip src/data/site.ts gracefully if it doesn't exist yet (Task 1 must pass
// before Task 2 creates it).
if (existsSync(SITE_DATA_PATH)) {
  checkPlaceholderFile(SITE_DATA_PATH);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
const allPass =
  locationOk &&
  shapeOk &&
  positivePass &&
  negativePass &&
  !placeholderCheckFailed;

console.log(
  `SCHEMA SUMMARY location=${locationOk ? "ok" : "fail"} shape=${
    shapeOk ? "ok" : "fail"
  } positive=${positivePass ? "pass" : "fail"} negative=${
    negativePass ? "pass" : "fail"
  } placeholders=${placeholderFilesOk}_files_ok`
);

process.exit(allPass ? 0 : 1);
