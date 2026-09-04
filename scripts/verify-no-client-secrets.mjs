#!/usr/bin/env node
// SEC-04 gate — client-secret hygiene: no env file tracked by git, no unsafe
// import.meta.env reference in src/, no secret-shaped token in dist/.
//
// Contract (see 05-02-PLAN.md Task 1):
// - Dependency policy: plain Node ESM, zero third-party dependencies — only
//   node:fs, node:path and node:child_process (for `git ls-files`).
// - Exit 1 immediately if dist/ does not exist, with a fixed message (this
//   gate scans build output, so a build must run first).
// - Four independent check groups, all accumulating into one shared
//   violations array — never exit on the first failure:
//     * tracked-env — no `.env*` file is tracked by git
//     * gitignore   — .gitignore still ignores `.env`
//     * src-env     — every import.meta.env.<NAME> reference in src/ is
//                      PUBLIC_-prefixed or an Astro built-in; no bracket
//                      (computed-key) access
//     * dist-tokens — no secret-shaped token appears anywhere in dist/
// - Prints each violation to stderr as:
//     verify-no-client-secrets: <check> — <detail>
// - Prints exactly one fixed-format summary line to stdout as the last line:
//     SECRETS SUMMARY tracked_env=<n> gitignore=<ok|fail> src_files=<n>
//     env_refs=<n> unsafe_env_refs=<n> dist_files=<n> token_matches=<n>
//     violations=<n>
// - Exits 0 only when violations is empty.
//
// Secret-shaped matches found in dist/ are reported by PATTERN NAME only —
// the matched value itself is never printed, so this gate's own output can
// never become a leak.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, extname, basename } from "node:path";
import { execFileSync } from "node:child_process";

const DIST_DIR = "dist";
const SRC_DIR = "src";
const GITIGNORE_PATH = ".gitignore";

const SRC_EXTENSIONS = new Set([
  ".astro",
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".json",
  ".md",
]);
const DIST_EXTENSIONS = new Set([
  ".html",
  ".js",
  ".mjs",
  ".css",
  ".json",
  ".xml",
  ".txt",
  ".svg",
]);

const ASTRO_BUILTINS = new Set([
  "MODE",
  "PROD",
  "DEV",
  "BASE_URL",
  "SITE",
  "ASSETS_PREFIX",
  "SSR",
]);

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

const violations = [];

function addViolation(check, detail) {
  violations.push({ check, detail });
}

// --- Group: tracked-env -----------------------------------------------------
// A future .env file (or key file) becoming tracked and then published with
// the repo. Scans the real git index, not the working tree.
let trackedEnvCount = 0;
try {
  const output = execFileSync("git", ["ls-files"], { encoding: "utf8" });
  const trackedPaths = output.split("\n").filter(Boolean);
  for (const p of trackedPaths) {
    if (/^\.env/i.test(basename(p))) {
      trackedEnvCount++;
      addViolation("tracked-env", `${p} is tracked by git`);
    }
  }
} catch (err) {
  // A silently skipped check is worse than no check — a git failure here is
  // itself a finding, not a pass.
  trackedEnvCount++;
  addViolation(
    "tracked-env",
    `git ls-files failed — cannot verify no .env file is tracked (${err.message})`
  );
}

// --- Group: gitignore --------------------------------------------------------
// Regression barrier: stops the tracked-env check above from becoming
// trivially satisfiable if the .env ignore rule is ever removed.
let gitignoreOk = false;
if (existsSync(GITIGNORE_PATH)) {
  const lines = readFileSync(GITIGNORE_PATH, "utf8")
    .split("\n")
    .map((l) => l.trim());
  gitignoreOk = lines.includes(".env");
}
if (!gitignoreOk) {
  addViolation("gitignore", `${GITIGNORE_PATH} has no line equal to ".env"`);
}

// --- Group: src-env -----------------------------------------------------------
// Astro inlines only PUBLIC_-prefixed env vars into the client bundle; every
// other name is build/server-only. A computed bracket-access key cannot be
// statically proven safe, so it is always flagged.
let srcFilesScanned = 0;
let envRefsCount = 0;
let unsafeEnvRefsCount = 0;

if (existsSync(SRC_DIR)) {
  const srcFiles = walk(SRC_DIR).filter((f) =>
    SRC_EXTENSIONS.has(extname(f).toLowerCase())
  );
  const dotRefRegex = /import\.meta\.env\.([A-Za-z_][A-Za-z0-9_]*)/g;
  const bracketRefRegex = /import\.meta\.env\[/g;

  for (const filePath of srcFiles) {
    srcFilesScanned++;
    const content = readFileSync(filePath, "utf8");

    dotRefRegex.lastIndex = 0;
    let dotMatch;
    while ((dotMatch = dotRefRegex.exec(content)) !== null) {
      envRefsCount++;
      const name = dotMatch[1];
      if (!name.startsWith("PUBLIC_") && !ASTRO_BUILTINS.has(name)) {
        unsafeEnvRefsCount++;
        addViolation(
          "src-env",
          `${filePath} references import.meta.env.${name}, which is neither PUBLIC_-prefixed nor an Astro built-in`
        );
      }
    }

    bracketRefRegex.lastIndex = 0;
    while (bracketRefRegex.exec(content) !== null) {
      envRefsCount++;
      unsafeEnvRefsCount++;
      addViolation(
        "src-env",
        `${filePath} uses import.meta.env[...] computed-key access, which cannot be statically proven safe`
      );
    }
  }
}

// --- Group: dist-tokens --------------------------------------------------------
// A secret pasted into content, config or a component reaching dist/ and then
// production. Reports the pattern NAME only — never the matched value.
let distFilesScanned = 0;
let tokenMatchesCount = 0;

const LITERAL_PREFIXES = ["sk_live_", "sk_test_", "pk_live_", "github_pat_"];
const REGEX_PATTERNS = [
  { name: "aws-access-key-id", regex: /AKIA[0-9A-Z]{16}/ },
  { name: "google-api-key", regex: /AIza[0-9A-Za-z_-]{35}/ },
  { name: "github-pat-classic", regex: /ghp_[A-Za-z0-9]{36}/ },
  { name: "slack-token", regex: /xox[baprs]-[0-9A-Za-z-]{10,}/ },
  { name: "jwt-header", regex: /eyJhbGciOi[A-Za-z0-9_-]{5,}/ },
];

const distFiles = walk(DIST_DIR).filter((f) =>
  DIST_EXTENSIONS.has(extname(f).toLowerCase())
);

for (const filePath of distFiles) {
  distFilesScanned++;
  const content = readFileSync(filePath, "utf8");

  for (const prefix of LITERAL_PREFIXES) {
    if (content.includes(prefix)) {
      tokenMatchesCount++;
      addViolation(
        "dist-tokens",
        `${filePath} contains a token matching prefix "${prefix}"`
      );
    }
  }

  if (content.includes("-----BEGIN") && content.includes("PRIVATE KEY-----")) {
    tokenMatchesCount++;
    addViolation("dist-tokens", `${filePath} contains a PEM private key block`);
  }

  for (const { name, regex } of REGEX_PATTERNS) {
    if (regex.test(content)) {
      tokenMatchesCount++;
      addViolation(
        "dist-tokens",
        `${filePath} contains a token matching pattern "${name}"`
      );
    }
  }
}

// --- Report ----------------------------------------------------------------
for (const v of violations) {
  console.error(`verify-no-client-secrets: ${v.check} — ${v.detail}`);
}

console.log(
  `SECRETS SUMMARY tracked_env=${trackedEnvCount} gitignore=${
    gitignoreOk ? "ok" : "fail"
  } src_files=${srcFilesScanned} env_refs=${envRefsCount} unsafe_env_refs=${unsafeEnvRefsCount} dist_files=${distFilesScanned} token_matches=${tokenMatchesCount} violations=${violations.length}`
);

process.exit(violations.length === 0 ? 0 : 1);
