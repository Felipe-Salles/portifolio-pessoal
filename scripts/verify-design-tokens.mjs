#!/usr/bin/env node
// Token fidelity gate — re-derives expected values from
// `Arquivos de design/DESIGN.md` (source of truth) on every run and diffs
// them against `src/styles/global.css`'s @theme block and the built
// dist/ CSS. Plain Node ESM, zero dependencies (no YAML library — DESIGN.md's
// frontmatter has a fixed, regular structure that a small line-based reader
// can parse reliably).
//
// Contract (see 01-02-PLAN.md Task 2):
// - Parse DESIGN.md's colors/typography/rounded/spacing blocks.
// - Assert every parsed token is present (and value-matching) in the
//   @theme block of src/styles/global.css.
// - Assert every --color-* property and the representative utility classes
//   survived into the built dist/ CSS.
// - Assert the 6 custom primitive classes + mobile grid media query exist.
// - Abort loudly if the parse yields implausible counts (parser regression
//   guard — never allow a vacuous pass).
// - Print every mismatch with token name, expected (DESIGN.md) value, and
//   actual value found; print a final `TOKENS SUMMARY ...` line; exit 0
//   only when mismatches=0.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const DESIGN_MD_PATH = "Arquivos de design/DESIGN.md";
const GLOBAL_CSS_PATH = "src/styles/global.css";
const DIST_DIR = "dist";

const CUSTOM_CLASS_SELECTORS = [
  ".glow-cloud-top-right",
  ".glow-cloud-bottom-left",
  ".bg-grid-pattern",
  ".glass-panel",
  ".border-glow-cyan",
  ".btn-primary:hover",
];

const REPRESENTATIVE_UTILITIES = [
  ".bg-surface-container",
  ".text-on-surface-variant",
  ".border-outline-variant",
  ".text-display-lg",
  ".text-headline-md",
  ".text-body-md",
  ".text-mono-label",
  ".font-mono-label",
  ".px-margin-mobile",
  ".px-gutter",
  ".max-w-container-max",
  ".rounded",
  ".rounded-lg",
  ".rounded-full",
];

/** Roles that declare a letterSpacing in DESIGN.md. */
const LETTER_SPACING_ROLES = new Set(["display-lg", "display-lg-mobile", "headline-md", "mono-label"]);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function stripQuotes(value) {
  const trimmed = value.trim();
  const m = /^'(.*)'$/.exec(trimmed);
  return m ? m[1] : trimmed;
}

// ---------------------------------------------------------------------
// 1. Parse DESIGN.md frontmatter.
// ---------------------------------------------------------------------

if (!existsSync(DESIGN_MD_PATH)) {
  fail(`${DESIGN_MD_PATH} not found — cannot derive expected token values`);
}

const designMdRaw = readFileSync(DESIGN_MD_PATH, "utf8");
const frontmatterMatch = /^---\r?\n([\s\S]*?)\r?\n---/.exec(designMdRaw);
if (!frontmatterMatch) {
  fail(`Could not locate YAML frontmatter (--- fences) in ${DESIGN_MD_PATH}`);
}
const frontmatterLines = frontmatterMatch[1].split(/\r?\n/);

const colors = {}; // key -> value
const typography = {}; // role -> { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing }
const rounded = {}; // key -> value
const spacing = {}; // key -> value

let section = null; // 'colors' | 'typography' | 'rounded' | 'spacing' | null
let currentRole = null; // for typography sub-blocks

for (const rawLine of frontmatterLines) {
  if (rawLine.trim() === "" || rawLine.trim() === "name: Cyber-Sophisticate") continue;

  const topLevelMatch = /^(\w[\w-]*):\s*$/.exec(rawLine);
  const twoSpaceKeyValue = /^ {2}([\w.-]+):\s*(.+)$/.exec(rawLine);
  const twoSpaceKeyOnly = /^ {2}([\w.-]+):\s*$/.exec(rawLine);
  const fourSpaceKeyValue = /^ {4}(\w+):\s*(.+)$/.exec(rawLine);

  if (topLevelMatch && !rawLine.startsWith(" ")) {
    const name = topLevelMatch[1];
    if (["colors", "typography", "rounded", "spacing"].includes(name)) {
      section = name;
      currentRole = null;
      continue;
    }
    // Unrecognized top-level key (e.g. a future frontmatter addition) — stop
    // attributing subsequent lines to any known section.
    section = null;
    currentRole = null;
    continue;
  }

  if (section === "colors" && twoSpaceKeyValue) {
    colors[twoSpaceKeyValue[1]] = stripQuotes(twoSpaceKeyValue[2]);
    continue;
  }

  if (section === "rounded" && twoSpaceKeyValue) {
    rounded[twoSpaceKeyValue[1]] = stripQuotes(twoSpaceKeyValue[2]);
    continue;
  }

  if (section === "spacing" && twoSpaceKeyValue) {
    spacing[twoSpaceKeyValue[1]] = stripQuotes(twoSpaceKeyValue[2]);
    continue;
  }

  if (section === "typography") {
    if (twoSpaceKeyOnly) {
      currentRole = twoSpaceKeyOnly[1];
      typography[currentRole] = {};
      continue;
    }
    if (currentRole && fourSpaceKeyValue) {
      typography[currentRole][fourSpaceKeyValue[1]] = stripQuotes(fourSpaceKeyValue[2]);
      continue;
    }
  }
}

const colorKeys = Object.keys(colors);
const typographyRoles = Object.keys(typography);
const roundedKeys = Object.keys(rounded);
const spacingKeys = Object.keys(spacing);

// Parser regression guard — never allow a vacuous pass.
if (colorKeys.length < 40) fail(`Parser regression: only parsed ${colorKeys.length} colour keys from DESIGN.md (expected >= 40)`);
if (typographyRoles.length < 7) fail(`Parser regression: only parsed ${typographyRoles.length} typography roles from DESIGN.md (expected >= 7)`);
if (roundedKeys.length < 6) fail(`Parser regression: only parsed ${roundedKeys.length} rounded keys from DESIGN.md (expected >= 6)`);
if (spacingKeys.length < 5) fail(`Parser regression: only parsed ${spacingKeys.length} spacing keys from DESIGN.md (expected >= 5)`);

// ---------------------------------------------------------------------
// 2. Isolate the @theme block from src/styles/global.css.
// ---------------------------------------------------------------------

if (!existsSync(GLOBAL_CSS_PATH)) {
  fail(`${GLOBAL_CSS_PATH} not found`);
}
const globalCss = readFileSync(GLOBAL_CSS_PATH, "utf8");

function extractBracedBlock(source, marker) {
  const markerIdx = source.indexOf(marker);
  if (markerIdx === -1) return null;
  const braceStart = source.indexOf("{", markerIdx);
  if (braceStart === -1) return null;
  let depth = 0;
  for (let i = braceStart; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(braceStart + 1, i);
    }
  }
  return null;
}

const themeBlock = extractBracedBlock(globalCss, "@theme");
if (themeBlock === null) {
  fail(`No @theme { ... } block found in ${GLOBAL_CSS_PATH}`);
}

function readCustomProp(block, propName) {
  const re = new RegExp(`--${propName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*([^;]+);`);
  const m = re.exec(block);
  return m ? m[1].trim() : null;
}

const mismatches = [];

function normalizeForCompare(value) {
  return value.trim().toLowerCase();
}

function assertMatch(tokenName, expected, actual) {
  if (actual === null) {
    mismatches.push(`${tokenName}: MISSING in @theme (expected "${expected}")`);
    return false;
  }
  if (normalizeForCompare(actual) !== normalizeForCompare(expected)) {
    mismatches.push(`${tokenName}: expected "${expected}", found "${actual}"`);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------
// 3. Colors — assert --color-{key} matches.
// ---------------------------------------------------------------------

let colorsMatched = 0;
for (const key of colorKeys) {
  const actual = readCustomProp(themeBlock, `color-${key}`);
  if (assertMatch(`--color-${key}`, colors[key], actual)) colorsMatched++;
}

// ---------------------------------------------------------------------
// 4. Typography — each role must match family, size, line-height,
//    font-weight, and (conditionally) letter-spacing.
// ---------------------------------------------------------------------

let typographyMatched = 0;
for (const role of typographyRoles) {
  const spec = typography[role];
  let roleOk = true;

  const fontActual = readCustomProp(themeBlock, `font-${role}`);
  if (fontActual === null || !normalizeForCompare(fontActual).includes(normalizeForCompare(spec.fontFamily))) {
    mismatches.push(`--font-${role}: expected to include "${spec.fontFamily}", found "${fontActual}"`);
    roleOk = false;
  }

  const sizeActual = readCustomProp(themeBlock, `text-${role}`);
  if (!assertMatch(`--text-${role}`, spec.fontSize, sizeActual)) roleOk = false;

  const lineHeightActual = readCustomProp(themeBlock, `text-${role}--line-height`);
  if (!assertMatch(`--text-${role}--line-height`, spec.lineHeight, lineHeightActual)) roleOk = false;

  const fontWeightActual = readCustomProp(themeBlock, `text-${role}--font-weight`);
  if (!assertMatch(`--text-${role}--font-weight`, spec.fontWeight, fontWeightActual)) roleOk = false;

  const expectsLetterSpacing = LETTER_SPACING_ROLES.has(role) && spec.letterSpacing !== undefined;
  const letterSpacingActual = readCustomProp(themeBlock, `text-${role}--letter-spacing`);
  if (expectsLetterSpacing) {
    if (!assertMatch(`--text-${role}--letter-spacing`, spec.letterSpacing, letterSpacingActual)) roleOk = false;
  } else if (letterSpacingActual !== null) {
    mismatches.push(`--text-${role}--letter-spacing: should NOT exist (DESIGN.md declares no letterSpacing for "${role}"), found "${letterSpacingActual}"`);
    roleOk = false;
  }

  if (roleOk) typographyMatched++;
}

// ---------------------------------------------------------------------
// 5. Radius — DEFAULT maps to the unsuffixed --radius property.
// ---------------------------------------------------------------------

let radiusMatched = 0;
for (const key of roundedKeys) {
  const propName = key === "DEFAULT" ? "radius" : `radius-${key}`;
  const tokenLabel = key === "DEFAULT" ? "--radius" : `--radius-${key}`;
  const actual = readCustomProp(themeBlock, propName);
  if (assertMatch(tokenLabel, rounded[key], actual)) radiusMatched++;
}

// ---------------------------------------------------------------------
// 6. Spacing — --spacing-{key}.
// ---------------------------------------------------------------------

let spacingMatched = 0;
for (const key of spacingKeys) {
  const actual = readCustomProp(themeBlock, `spacing-${key}`);
  if (assertMatch(`--spacing-${key}`, spacing[key], actual)) spacingMatched++;
}

// ---------------------------------------------------------------------
// 7. Custom class selectors + mobile grid media query (source file).
// ---------------------------------------------------------------------

let customClassesMatched = 0;
for (const selector of CUSTOM_CLASS_SELECTORS) {
  if (globalCss.includes(`${selector} {`) || globalCss.includes(`${selector}{`)) {
    customClassesMatched++;
  } else {
    mismatches.push(`custom class ${selector}: MISSING in ${GLOBAL_CSS_PATH}`);
  }
}

const mobileGridMediaRe = /@media\s*\(max-width:\s*768px\)\s*\{[^}]*\.bg-grid-pattern\s*\{[^}]*background-size:\s*32px 32px/;
if (!mobileGridMediaRe.test(globalCss)) {
  mismatches.push(`@media (max-width: 768px) .bg-grid-pattern { background-size: 32px 32px }: MISSING or malformed in ${GLOBAL_CSS_PATH}`);
}

// ---------------------------------------------------------------------
// 8. Built dist/ CSS assertions.
// ---------------------------------------------------------------------

if (!existsSync(DIST_DIR)) {
  fail("dist/ not found — run npm run build first");
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) walk(fullPath, acc);
    else if (stat.isFile() && extname(fullPath) === ".css") acc.push(fullPath);
  }
  return acc;
}

const distCssFiles = walk(DIST_DIR);
const distCss = distCssFiles.map((f) => readFileSync(f, "utf8")).join("\n");

for (const key of colorKeys) {
  if (!distCss.includes(`--color-${key}:`)) {
    mismatches.push(`dist/: --color-${key} did not survive into the built CSS`);
  }
}

// Phase 3 (03-01-PLAN.md Task 2) broadens this matcher: it used to require a
// bare, unprefixed, unmodified compiled rule (name immediately followed by
// `{`), which was only satisfied because Phase 1's token-gallery scaffolding
// happened to use every representative utility in exactly that form. Real
// Phase 3 markup legitimately reaches several of these tokens only through a
// responsive variant (`md:text-display-lg` — the Hero is mobile-first) or an
// opacity modifier (`border-outline-variant/30`, `/50`, `/20` — always
// alpha-composited). A representative utility is now satisfied by its bare
// rule, a variant-prefixed rule (Lightning CSS escapes the variant colon,
// e.g. `.md\:text-display-lg`), or an opacity-modified rule (Lightning CSS
// escapes the modifier slash, e.g. `.border-outline-variant\/30`) — and
// tolerates a trailing `,` as well as `{`, since Lightning CSS groups
// identical-declaration selectors into comma-separated lists. This only
// broadens the selector *shape* accepted; it does not weaken which tokens
// must survive into dist/ (the --color-* loop, DESIGN.md diff and
// CUSTOM_CLASSES checks are unchanged).
for (const selector of REPRESENTATIVE_UTILITIES) {
  const name = selector.slice(1); // strip the leading '.'
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?:\\.|\\\\:)${escapedName}(?:\\\\/\\d+)?\\s*[{,]`);
  if (!re.test(distCss)) {
    mismatches.push(`dist/: no rule found for representative utility "${selector}"`);
  }
}

for (const selector of [".glass-panel", ".bg-grid-pattern"]) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\:]/g, "\\$&");
  const re = new RegExp(`${escaped}\\s*\\{`);
  if (!re.test(distCss)) {
    mismatches.push(`dist/: no rule found for custom primitive "${selector}"`);
  }
}

// ---------------------------------------------------------------------
// 9. Report.
// ---------------------------------------------------------------------

if (mismatches.length > 0) {
  for (const m of mismatches) console.error(m);
}

console.log(
  `TOKENS SUMMARY colors=${colorsMatched}/${colorKeys.length} typography=${typographyMatched}/${typographyRoles.length} radius=${radiusMatched}/${roundedKeys.length} spacing=${spacingMatched}/${spacingKeys.length} custom_classes=${customClassesMatched}/6 mismatches=${mismatches.length}`
);

process.exit(mismatches.length === 0 ? 0 : 1);
