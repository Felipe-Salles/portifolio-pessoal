#!/usr/bin/env node
// Phase 3 sections gate — deterministic dist/ scan proving the page
// container contract (LAY-01) plus the Hero (HERO-01/HERO-02, D-01–D-04) and
// Dossier (DOSS-01, DOSS-02) sections. Plain Node ESM, zero dependencies
// (node:fs/node:path only), structured after scripts/verify-shell.mjs.
//
// Contract:
// - Exit 1 immediately with a fixed message if dist/ or dist/index.html is
//   absent.
// - Accumulate every failure into a violations array rather than exiting on
//   the first one; print each as "verify-sections: <group> — <detail>" on
//   stderr.
// - Always print exactly one summary line:
//     SECTIONS SUMMARY container=<ok|fail> hero=<ok|fail> dossier=<ok|fail> violations=<n>
// - Exit 0 only when violations=0.
//
// Extended by plans 03-02 (stack), 03-03 (projects), 03-04 (contact/fidelity)
// which append keys to this same summary line without rewriting earlier
// check groups.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const DIST_DIR = "dist";

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync(DIST_DIR)) {
  fail("dist/ not found — run npm run build first");
}

const indexHtmlPath = join(DIST_DIR, "index.html");
if (!existsSync(indexHtmlPath)) {
  fail("dist/index.html not found — run npm run build first");
}
const html = readFileSync(indexHtmlPath, "utf8");

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

const allFiles = walk(DIST_DIR);
const cssFiles = allFiles.filter((f) => extname(f).toLowerCase() === ".css");
let css = "";
for (const f of cssFiles) {
  css += readFileSync(f, "utf8") + "\n";
}
// Whitespace-stripped copy for all CSS assertions — Lightning CSS minifies output.
const cssStripped = css.replace(/\s+/g, "");

const violations = [];
function addViolation(group, detail) {
  violations.push({ group, detail });
}

/** Balance-match an HTML element's inner content starting just after its
 * opening tag closes, given the element's tag name. Handles nested elements
 * of the same tag name so a naive lastIndexOf of the closing tag doesn't
 * grab an unrelated closing tag elsewhere on the page. */
function extractElementInner(source, openTagEndIdx, tagName) {
  const openRe = new RegExp(`<${tagName}\\b`, "gi");
  const closeRe = new RegExp(`</${tagName}>`, "gi");
  let depth = 1;
  let idx = openTagEndIdx;
  while (depth > 0) {
    openRe.lastIndex = idx;
    closeRe.lastIndex = idx;
    const nextOpen = openRe.exec(source);
    const nextClose = closeRe.exec(source);
    if (!nextClose) return null;
    if (nextOpen && nextOpen.index < nextClose.index) {
      depth++;
      idx = nextOpen.index + nextOpen[0].length;
    } else {
      depth--;
      idx = nextClose.index + nextClose[0].length;
      if (depth === 0) {
        return source.slice(openTagEndIdx, nextClose.index);
      }
    }
  }
  return null;
}

// -----------------------------------------------------------------------
// site.ts value parser — derives every expected string at gate runtime
// rather than hardcoding placeholder literals, so the gate keeps working
// once v2's REAL-01 replaces these values.
// -----------------------------------------------------------------------
function parseSiteTs() {
  const siteTsPath = join("src", "data", "site.ts");
  if (!existsSync(siteTsPath)) return null;
  const text = readFileSync(siteTsPath, "utf8");

  function scalar(field) {
    const re = new RegExp(`\\b${field}:\\s*["']([^"']*)["']`);
    const m = re.exec(text);
    return m ? m[1] : null;
  }

  function arrayLiteral(key) {
    const keyIdx = text.indexOf(`${key}:`);
    if (keyIdx === -1) return null;
    const arrayStartIdx = text.indexOf("[", keyIdx);
    if (arrayStartIdx === -1) return null;
    let depth = 0;
    let endIdx = -1;
    for (let i = arrayStartIdx; i < text.length; i++) {
      const ch = text[i];
      if (ch === "[") depth++;
      else if (ch === "]") {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }
    if (endIdx === -1) return null;
    return text.slice(arrayStartIdx, endIdx + 1);
  }

  const heroHeading = scalar("heroHeading");
  const title = scalar("title");
  const heroSubtitle = scalar("heroSubtitle");
  const availabilityStatus = scalar("availabilityStatus");
  const name = scalar("name");

  const bioSlice = arrayLiteral("bio");
  const bio = bioSlice
    ? [...bioSlice.matchAll(/["']([^"']*)["']/g)].map((m) => m[1])
    : null;

  const specsSlice = arrayLiteral("systemSpecs");
  let systemSpecs = null;
  if (specsSlice) {
    const labels = [...specsSlice.matchAll(/label:\s*["']([^"']*)["']/g)].map(
      (m) => m[1]
    );
    const values = [...specsSlice.matchAll(/value:\s*["']([^"']*)["']/g)].map(
      (m) => m[1]
    );
    systemSpecs = labels.map((label, i) => ({ label, value: values[i] }));
  }

  return { heroHeading, title, heroSubtitle, availabilityStatus, name, bio, systemSpecs };
}

const parsed = parseSiteTs();
if (!parsed) {
  addViolation("container", "could not parse src/data/site.ts");
}

const baseAstroPath = join("src", "layouts", "Base.astro");
const baseAstroSrc = existsSync(baseAstroPath)
  ? readFileSync(baseAstroPath, "utf8")
  : null;

const indexAstroPath = join("src", "pages", "index.astro");
const indexAstroSrc = existsSync(indexAstroPath)
  ? readFileSync(indexAstroPath, "utf8")
  : null;

// -----------------------------------------------------------------------
// Check group: container (LAY-01)
// -----------------------------------------------------------------------
let containerOk = true;

const REQUIRED_MAIN_CLASSES = [
  'id="main-content"',
  "relative",
  "z-10",
  "pt-32",
  "pb-section-gap",
  "px-margin-mobile",
  "md:px-gutter",
  "max-w-container-max",
  "mx-auto",
  "space-y-section-gap",
];

if (!baseAstroSrc) {
  containerOk = false;
  addViolation("container", `${baseAstroPath} not found`);
} else {
  const mainTagMatches = baseAstroSrc.match(/<main\b[^>]*>/gi) || [];
  if (mainTagMatches.length !== 1) {
    containerOk = false;
    addViolation(
      "container",
      `expected exactly one <main opening tag in ${baseAstroPath}, found ${mainTagMatches.length}`
    );
  } else {
    for (const cls of REQUIRED_MAIN_CLASSES) {
      if (!mainTagMatches[0].includes(cls)) {
        containerOk = false;
        addViolation("container", `${baseAstroPath}'s <main> tag missing ${cls}`);
      }
    }
  }
}

const distMainTagMatches = html.match(/<main\b[^>]*>/gi) || [];
if (distMainTagMatches.length !== 1) {
  containerOk = false;
  addViolation(
    "container",
    `expected exactly one <main opening tag in dist/index.html, found ${distMainTagMatches.length}`
  );
} else {
  for (const cls of [
    "px-margin-mobile",
    "md:px-gutter",
    "max-w-container-max",
    "space-y-section-gap",
  ]) {
    if (!distMainTagMatches[0].includes(cls)) {
      containerOk = false;
      addViolation("container", `dist/index.html's <main> tag missing ${cls}`);
    }
  }
}

if (!indexAstroSrc) {
  containerOk = false;
  addViolation("container", `${indexAstroPath} not found`);
} else {
  if (/<main\b/.test(indexAstroSrc)) {
    containerOk = false;
    addViolation(
      "container",
      "src/pages/index.astro contains <main — would nest a second main landmark inside the layout's <main>"
    );
  }

  if (!/<Base\b[^>]*>\s*<section\b/.test(indexAstroSrc)) {
    containerOk = false;
    addViolation(
      "container",
      "first child of <Base> is not a <section — sections must be direct children, no wrapper <div>"
    );
  }
  if (!/<\/section>\s*<\/Base>/.test(indexAstroSrc)) {
    containerOk = false;
    addViolation(
      "container",
      "last child of <Base> is not </section> — sections must be direct children, no wrapper <div>"
    );
  }
}

// Lightning CSS compiles the source's `@media (max-width: 768px)` into its
// modern range-syntax equivalent `@media (width<=768px)` in the built
// output, so both forms are accepted here.
const mobileGridRe =
  /@media\((?:max-width:768px|width<=768px)\)\{[^}]*\.bg-grid-pattern\{[^}]*background-size:32px32px/;
if (!mobileGridRe.test(cssStripped)) {
  containerOk = false;
  addViolation(
    "container",
    "no @media (max-width: 768px) .bg-grid-pattern { background-size: 32px 32px } rule found in built CSS"
  );
}

// -----------------------------------------------------------------------
// Check group: hero (HERO-01, HERO-02, D-01 through D-04)
// -----------------------------------------------------------------------
let heroOk = true;

if (indexAstroSrc) {
  if (/<script\b/.test(indexAstroSrc)) {
    heroOk = false;
    addViolation("hero", "src/pages/index.astro contains <script (D-04 zero-JS)");
  }
  if (/\bclient:/.test(indexAstroSrc)) {
    heroOk = false;
    addViolation("hero", "src/pages/index.astro contains a client: directive (D-04 zero-JS)");
  }
}

const h1TagMatches = html.match(/<h1\b[^>]*>/gi) || [];
let h1Text = null;
if (h1TagMatches.length !== 1) {
  heroOk = false;
  addViolation("hero", `expected exactly one <h1 opening tag, found ${h1TagMatches.length}`);
} else {
  const h1Tag = h1TagMatches[0];
  if (!h1Tag.includes("font-semibold")) {
    heroOk = false;
    addViolation("hero", "<h1> class missing font-semibold");
  }
  if (h1Tag.includes("font-bold")) {
    heroOk = false;
    addViolation("hero", "<h1> class must not contain font-bold (UI-SPEC weight consolidation)");
  }
  for (const cls of [
    "font-display-lg-mobile",
    "text-display-lg-mobile",
    "md:font-display-lg",
    "md:text-display-lg",
  ]) {
    if (!h1Tag.includes(cls)) {
      heroOk = false;
      addViolation("hero", `<h1> class missing ${cls}`);
    }
  }

  const h1OpenIdx = html.indexOf(h1Tag);
  const h1EndIdx = h1OpenIdx + h1Tag.length;
  const h1CloseIdx = html.indexOf("</h1>", h1EndIdx);
  if (h1CloseIdx === -1) {
    heroOk = false;
    addViolation("hero", "could not find closing </h1>");
  } else {
    h1Text = html.slice(h1EndIdx, h1CloseIdx).trim();
    if (parsed && parsed.heroHeading !== null && h1Text !== parsed.heroHeading) {
      heroOk = false;
      addViolation(
        "hero",
        `<h1> text "${h1Text}" does not equal parsed site.heroHeading "${parsed.heroHeading}"`
      );
    }
  }
}

if (parsed) {
  for (const [field, value] of [
    ["title", parsed.title],
    ["heroSubtitle", parsed.heroSubtitle],
    ["availabilityStatus", parsed.availabilityStatus],
  ]) {
    if (value === null) {
      heroOk = false;
      addViolation("hero", `could not parse site.${field} from src/data/site.ts`);
    } else if (!html.includes(value)) {
      heroOk = false;
      addViolation("hero", `dist/index.html does not contain parsed site.${field} value`);
    }
  }

  if (parsed.name !== null && parsed.heroHeading !== null) {
    if (parsed.name === parsed.heroHeading) {
      heroOk = false;
      addViolation(
        "hero",
        "D-03 check is untestable: parsed site.name equals parsed site.heroHeading"
      );
    } else if (html.includes(parsed.name)) {
      heroOk = false;
      addViolation("hero", `dist/index.html contains parsed site.name value (D-03 violation)`);
    }
  }

  if (
    parsed.availabilityStatus !== null &&
    parsed.title !== null &&
    parsed.heroSubtitle !== null
  ) {
    const badgeIdx = html.indexOf(parsed.availabilityStatus);
    const h1Idx = html.indexOf("<h1");
    const titleIdx = html.indexOf(parsed.title);
    const subtitleIdx = html.indexOf(parsed.heroSubtitle);
    if (
      badgeIdx === -1 ||
      h1Idx === -1 ||
      titleIdx === -1 ||
      subtitleIdx === -1 ||
      !(badgeIdx < h1Idx && h1Idx < titleIdx && titleIdx < subtitleIdx)
    ) {
      heroOk = false;
      addViolation(
        "hero",
        "reading order violated: expected availabilityStatus < <h1> < title < heroSubtitle in document order"
      );
    }
  }
}

let foundPulseDot = false;
const classAttrRegexGlobal = /class="([^"]*)"/g;
let classAttrMatch;
while ((classAttrMatch = classAttrRegexGlobal.exec(html)) !== null) {
  if (classAttrMatch[1].includes("animate-pulse") && classAttrMatch[1].includes("rounded-full")) {
    foundPulseDot = true;
    break;
  }
}
if (!foundPulseDot) {
  heroOk = false;
  addViolation("hero", "no element found with class containing both animate-pulse and rounded-full");
}
if (!/\.animate-pulse\{/.test(cssStripped)) {
  heroOk = false;
  addViolation("hero", "no .animate-pulse rule found in built CSS");
}
if (!/@keyframespulse\{/.test(cssStripped)) {
  heroOk = false;
  addViolation("hero", "no @keyframes pulse block found in built CSS");
}

// The nav bar (Phase 2) also links to #projects with plain text ("Projects"),
// so every href="#projects" anchor must be inspected — the Hero CTA is
// identified by carrying btn-primary, not merely by being the first match.
const ctaTagRegexGlobal = /<a\b[^>]*href="#projects"[^>]*>/gi;
let ctaCandidateMatch;
let ctaBtnPrimaryMatch = null;
while ((ctaCandidateMatch = ctaTagRegexGlobal.exec(html)) !== null) {
  if (ctaCandidateMatch[0].includes("btn-primary")) {
    ctaBtnPrimaryMatch = ctaCandidateMatch;
    break;
  }
}
if (!ctaBtnPrimaryMatch) {
  heroOk = false;
  addViolation("hero", 'no <a href="#projects"> anchor with class btn-primary found');
} else {
  const ctaStart = ctaBtnPrimaryMatch.index;
  const ctaOpenEndIdx = ctaStart + ctaBtnPrimaryMatch[0].length;
  const ctaCloseIdx = html.indexOf("</a>", ctaOpenEndIdx);
  if (ctaCloseIdx === -1) {
    heroOk = false;
    addViolation("hero", "could not find closing </a> for the CTA anchor");
  } else {
    const ctaInner = html.slice(ctaOpenEndIdx, ctaCloseIdx);
    const ctaText = ctaInner.replace(/<[^>]*>/g, "").trim();
    if (!ctaText.includes("VER PROJETOS")) {
      heroOk = false;
      addViolation("hero", 'CTA anchor text does not contain "VER PROJETOS"');
    }
  }
}

for (const banned of ["VIEW PROJECTS", "AVAILABLE FOR NEW PROJECTS"]) {
  if (html.includes(banned)) {
    heroOk = false;
    addViolation("hero", `dist/index.html contains banned prototype string "${banned}"`);
  }
}

// -----------------------------------------------------------------------
// Check group: dossier (DOSS-01, DOSS-02)
// -----------------------------------------------------------------------
let dossierOk = true;

const dossierIdMatches = html.match(/id="dossier"/g) || [];
if (dossierIdMatches.length !== 1) {
  dossierOk = false;
  addViolation("dossier", `expected exactly one id="dossier" element, found ${dossierIdMatches.length}`);
} else {
  const dossierTagRegex = /<([a-z0-9]+)\b[^>]*\bid="dossier"[^>]*>/i;
  const dossierTagMatch = dossierTagRegex.exec(html);
  if (!dossierTagMatch) {
    dossierOk = false;
    addViolation("dossier", 'could not locate the opening tag carrying id="dossier"');
  } else {
    const dossierTagName = dossierTagMatch[1];
    if (dossierTagName.toLowerCase() !== "section") {
      dossierOk = false;
      addViolation("dossier", `id="dossier" element must be a <section>, found <${dossierTagName}>`);
    }
    if (!dossierTagMatch[0].includes("scroll-mt-32")) {
      dossierOk = false;
      addViolation("dossier", 'id="dossier" element missing scroll-mt-32 class');
    }

    const dossierOpenEndIdx = dossierTagMatch.index + dossierTagMatch[0].length;
    const dossierInner = extractElementInner(html, dossierOpenEndIdx, dossierTagName);
    if (dossierInner === null) {
      dossierOk = false;
      addViolation("dossier", "could not extract the dossier section's inner markup");
    } else {
      const h2Match = /<h2\b[^>]*>([\s\S]*?)<\/h2>/i.exec(dossierInner);
      if (!h2Match || h2Match[1].trim() !== "DOSSIER") {
        dossierOk = false;
        addViolation("dossier", '<h2> with trimmed text "DOSSIER" not found');
      }

      if (!/grid-cols-1/.test(dossierInner) || !/md:grid-cols-12/.test(dossierInner)) {
        dossierOk = false;
        addViolation("dossier", "grid wrapper missing grid-cols-1 and/or md:grid-cols-12");
      }

      const col8TagRegex = /<div\b[^>]*class="([^"]*md:col-span-8[^"]*)"[^>]*>/i;
      const col8Match = col8TagRegex.exec(dossierInner);
      if (!col8Match) {
        dossierOk = false;
        addViolation("dossier", "no descendant with class containing md:col-span-8");
      } else if (!col8Match[1].includes("glass-panel")) {
        dossierOk = false;
        addViolation("dossier", "md:col-span-8 panel missing glass-panel class");
      }

      const col4TagRegex = /<div\b[^>]*class="([^"]*md:col-span-4[^"]*)"[^>]*>/i;
      const col4Match = col4TagRegex.exec(dossierInner);
      if (!col4Match) {
        dossierOk = false;
        addViolation("dossier", "no descendant with class containing md:col-span-4");
      } else {
        if (!col4Match[1].includes("glass-panel")) {
          dossierOk = false;
          addViolation("dossier", "md:col-span-4 panel missing glass-panel class");
        }
        if (!col4Match[1].includes("border-glow-cyan")) {
          dossierOk = false;
          addViolation("dossier", "md:col-span-4 panel missing border-glow-cyan class");
        }
      }

      const bioPCount = (dossierInner.match(/<p\b/gi) || []).length;
      if (parsed && parsed.bio) {
        if (bioPCount !== parsed.bio.length) {
          dossierOk = false;
          addViolation(
            "dossier",
            `dossier <p> count (${bioPCount}) does not match parsed site.bio entry count (${parsed.bio.length})`
          );
        }
        for (const paragraph of parsed.bio) {
          if (!dossierInner.includes(paragraph)) {
            dossierOk = false;
            addViolation("dossier", "a parsed site.bio paragraph is missing from the dossier slice");
          }
        }
      } else {
        dossierOk = false;
        addViolation("dossier", "could not parse site.bio from src/data/site.ts");
      }

      const h3Match = /<h3\b[^>]*>([\s\S]*?)<\/h3>/i.exec(dossierInner);
      if (!h3Match || h3Match[1].trim() !== "SYSTEM SPECS") {
        dossierOk = false;
        addViolation("dossier", '<h3> with trimmed text "SYSTEM SPECS" not found');
      }

      if (parsed && parsed.systemSpecs) {
        for (const spec of parsed.systemSpecs) {
          if (!dossierInner.includes(spec.label)) {
            dossierOk = false;
            addViolation("dossier", `parsed systemSpecs label "${spec.label}" missing from the dossier slice`);
          }
          if (!dossierInner.includes(spec.value)) {
            dossierOk = false;
            addViolation("dossier", `parsed systemSpecs value "${spec.value}" missing from the dossier slice`);
          }
        }
      } else {
        dossierOk = false;
        addViolation("dossier", "could not parse site.systemSpecs from src/data/site.ts");
      }

      if (dossierInner.includes("font-mono-code") || dossierInner.includes("text-mono-code")) {
        dossierOk = false;
        addViolation("dossier", "dossier slice must not use font-mono-code/text-mono-code");
      }
      if (!dossierInner.includes("font-mono-label") || !dossierInner.includes("text-mono-label")) {
        dossierOk = false;
        addViolation("dossier", "dossier slice must use font-mono-label and text-mono-label");
      }

      const dossierClassAttrs = [...dossierInner.matchAll(/class="([^"]*)"/g)].map((m) => m[1]);
      for (const cls of dossierClassAttrs) {
        if (cls.includes("font-body-md") && !cls.includes("font-medium")) {
          dossierOk = false;
          addViolation("dossier", "an element with font-body-md is missing font-medium");
        }
      }
    }
  }
}

// -----------------------------------------------------------------------
// Print violations + summary line.
// -----------------------------------------------------------------------
for (const v of violations) {
  console.error(`verify-sections: ${v.group} — ${v.detail}`);
}

console.log(
  `SECTIONS SUMMARY container=${containerOk ? "ok" : "fail"} hero=${
    heroOk ? "ok" : "fail"
  } dossier=${dossierOk ? "ok" : "fail"} violations=${violations.length}`
);

process.exit(violations.length === 0 ? 0 : 1);
