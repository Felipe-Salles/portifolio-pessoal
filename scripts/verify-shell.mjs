#!/usr/bin/env node
// Phase 2 shell gate — deterministic dist/ scan proving the site shell
// contract: lang (SEO-06), landmarks + skip link + focus CSS (A11Y-01), and
// the nav contract (LAY-03 desktop surface, D-02, D-03). Plain Node ESM,
// zero dependencies (node:fs/node:path only), structured after
// scripts/verify-no-external-origins.mjs (02-01-PLAN.md Task 1).
//
// Contract:
// - Exit 1 immediately with a fixed message if dist/ is absent.
// - Read dist/index.html as the HTML under test; concatenate every .css file
//   under dist/ (recursive walk) as the CSS under test, plus a
//   whitespace-stripped copy of that CSS for all CSS assertions (Lightning
//   CSS minifies the build output).
// - Accumulate failures into a violations array rather than exiting on the
//   first one; print each as "verify-shell: <check> — <detail>" on stderr.
// - Always print exactly one summary line:
//     SHELL SUMMARY lang=<ok|fail> landmarks=<ok|fail> skiplink=<ok|fail> nav=<ok|fail> brand=<ok|fail> focuscss=<ok|fail> violations=<n>
// - Exit 0 only when violations=0.
//
// Structured so plans 02-02 and 02-03 can append further check groups and
// further key=value pairs to the summary line without rewriting this file.

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

const indexPath = join(DIST_DIR, "index.html");
if (!existsSync(indexPath)) {
  fail("dist/index.html not found — run npm run build first");
}
const html = readFileSync(indexPath, "utf8");

// Concatenate every .css file under dist/ (recursive walk, SEC-01 gate technique).
const allFiles = walk(DIST_DIR);
const cssFiles = allFiles.filter((f) => extname(f).toLowerCase() === ".css");
let css = "";
for (const f of cssFiles) {
  css += readFileSync(f, "utf8") + "\n";
}
// Whitespace-stripped copy for all CSS assertions — Lightning CSS minifies output.
const cssStripped = css.replace(/\s+/g, "");
// Whitespace-collapsed copy (02-02) — collapses every whitespace run to a
// single space and trims spaces immediately around { } ; , . Unlike
// cssStripped, this copy preserves the single space of a descendant
// combinator (e.g. `nav[data-menu-open="true"] [data-nav-icon="menu"]`),
// which cssStripped would otherwise collapse into what looks like a single
// compound selector. Use cssStripped for declaration values and any
// compound (no-descendant-combinator) selector; use cssLoose only for
// selectors containing a descendant combinator.
const cssLoose = css
  .replace(/\s+/g, " ")
  .replace(/\s*([{};,])\s*/g, "$1")
  .trim();

/** Attribute-selector fragment tolerating both quoted and unquoted forms —
 * Lightning CSS drops quotes around attribute values that are valid CSS
 * identifiers (e.g. `true`/`false`). */
function attrEq(attr, value) {
  return `\\[${attr}=(?:"${value}"|${value})\\]`;
}

/** Find `<selectorRegexStr>{<declarations>}` in `source` and return the
 * declaration block's captured text, or null if no match. */
function findCssBlock(source, selectorRegexStr) {
  const re = new RegExp(`${selectorRegexStr}\\{([^}]*)\\}`);
  const m = re.exec(source);
  return m ? m[1] : null;
}

/** Balance-match an HTML element's inner content starting just after its
 * opening tag closes, given the element's tag name. Handles nested elements
 * of the same tag name (e.g. nested <div>s) so a naive lastIndexOf of the
 * closing tag doesn't grab an unrelated closing tag elsewhere on the page. */
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
// Check group: lang (SEO-06)
// -----------------------------------------------------------------------
let langOk = true;
if (!/lang="pt-BR"/.test(html)) {
  langOk = false;
  addViolation("lang", 'missing lang="pt-BR" in dist/index.html');
}
if (/lang="en"/.test(html)) {
  langOk = false;
  addViolation("lang", 'found lang="en" in dist/index.html');
}

// -----------------------------------------------------------------------
// Check group: landmarks (A11Y-01)
// -----------------------------------------------------------------------
let landmarksOk = true;
const mainOpenTags = html.match(/<main\b[^>]*>/gi) || [];
if (mainOpenTags.length !== 1) {
  landmarksOk = false;
  addViolation(
    "landmarks",
    `expected exactly one <main opening tag, found ${mainOpenTags.length}`
  );
} else if (!/id="main-content"/.test(mainOpenTags[0])) {
  landmarksOk = false;
  addViolation("landmarks", '<main> tag missing id="main-content"');
}

const navOpenTags = html.match(/<nav\b[^>]*>/gi) || [];
if (navOpenTags.length !== 1) {
  landmarksOk = false;
  addViolation(
    "landmarks",
    `expected exactly one <nav opening tag, found ${navOpenTags.length}`
  );
} else if (!/aria-label="Navegação principal"/.test(navOpenTags[0])) {
  landmarksOk = false;
  addViolation(
    "landmarks",
    '<nav> tag missing aria-label="Navegação principal"'
  );
}

// -----------------------------------------------------------------------
// Check group: skip link (D-04)
// -----------------------------------------------------------------------
let skiplinkOk = true;
const skipLinkRegex =
  /<a\b[^>]*href="#main-content"[^>]*>\s*Pular para o conteúdo\s*<\/a>/i;
const skipLinkMatch = skipLinkRegex.exec(html);
if (!skipLinkMatch) {
  skiplinkOk = false;
  addViolation(
    "skiplink",
    'no anchor with href="#main-content" and text "Pular para o conteúdo" found'
  );
} else {
  const skipLinkOffset = skipLinkMatch.index;
  const firstNavIdx = html.search(/<nav\b/i);
  const firstButtonIdx = html.search(/<button\b/i);

  // First *other* <a tag — i.e. the first <a whose offset is not this skip
  // link's own offset.
  const anchorRegex = /<a\b/gi;
  let otherAnchorIdx = -1;
  let m;
  while ((m = anchorRegex.exec(html)) !== null) {
    if (m.index !== skipLinkOffset) {
      otherAnchorIdx = m.index;
      break;
    }
  }

  if (firstNavIdx !== -1 && skipLinkOffset >= firstNavIdx) {
    skiplinkOk = false;
    addViolation("skiplink", "skip link is not before the first <nav");
  }
  if (firstButtonIdx !== -1 && skipLinkOffset >= firstButtonIdx) {
    skiplinkOk = false;
    addViolation("skiplink", "skip link is not before the first <button");
  }
  if (otherAnchorIdx !== -1 && skipLinkOffset >= otherAnchorIdx) {
    skiplinkOk = false;
    addViolation("skiplink", "skip link is not before the first other <a");
  }
}

// -----------------------------------------------------------------------
// Check group: nav contract (LAY-03 desktop surface, D-02)
// -----------------------------------------------------------------------
let navOk = true;
const navAnchors = [
  { href: "#dossier", label: "Dossier" },
  { href: "#stack", label: "Stack" },
  { href: "#projects", label: "Projects" },
  { href: "#contact", label: "Contact" },
];
for (const { href, label } of navAnchors) {
  const anchorRegex = new RegExp(
    `<a\\b[^>]*href="${href}"[^>]*>\\s*${label}\\s*<\\/a>`,
    "i"
  );
  if (!anchorRegex.test(html)) {
    navOk = false;
    addViolation("nav", `missing anchor href="${href}" with label "${label}"`);
  }
}
const connectAnchorRegex =
  /<a\b[^>]*href="#contact"[^>]*>\s*Connect\s*<\/a>/i;
if (!connectAnchorRegex.test(html)) {
  navOk = false;
  addViolation(
    "nav",
    'missing Connect anchor with href="#contact" (D-02 — must be an anchor)'
  );
}
const connectButtonRegex = /<button\b[^>]*>\s*Connect\s*<\/button>/i;
if (connectButtonRegex.test(html)) {
  navOk = false;
  addViolation(
    "nav",
    "found <button>Connect</button> — Connect must never be a button (D-02)"
  );
}

// -----------------------------------------------------------------------
// Check group: brand
// -----------------------------------------------------------------------
let brandOk = true;
let siteBrand = null;
const siteTsPath = join("src", "data", "site.ts");
if (!existsSync(siteTsPath)) {
  brandOk = false;
  addViolation("brand", `${siteTsPath} not found — cannot read site.brand`);
} else {
  const siteTs = readFileSync(siteTsPath, "utf8");
  const brandMatch = /brand:\s*["']([^"']*)["']/.exec(siteTs);
  if (!brandMatch) {
    brandOk = false;
    addViolation("brand", "could not find brand: key in src/data/site.ts");
  } else {
    siteBrand = brandMatch[1];
    if (!html.includes(siteBrand)) {
      brandOk = false;
      addViolation(
        "brand",
        `dist/index.html does not contain site.brand value "${siteBrand}"`
      );
    }
  }
}
const bannedBrandStrings = ["SYSTEM.CORE", "SYSTEM_ARCHITECT", "ARCHITECT"];
for (const banned of bannedBrandStrings) {
  if (html.includes(banned)) {
    brandOk = false;
    addViolation("brand", `dist/index.html contains banned string "${banned}"`);
  }
}

// -----------------------------------------------------------------------
// Check group: SEC-01 non-regression at the markup level
// -----------------------------------------------------------------------
if (html.includes("material-symbols-outlined")) {
  navOk = false;
  addViolation(
    "nav",
    'dist/index.html contains "material-symbols-outlined" (icon-font pattern banned by SEC-01)'
  );
}
if (html.includes("set:html")) {
  navOk = false;
  addViolation("nav", 'dist/index.html contains "set:html"');
}

// -----------------------------------------------------------------------
// Check group: focus CSS (A11Y-01)
// -----------------------------------------------------------------------
let focuscssOk = true;
const focusVisibleBlockRegex = /:focus-visible\{([^}]*)\}/;
const focusVisibleMatch = focusVisibleBlockRegex.exec(cssStripped);
if (!focusVisibleMatch) {
  focuscssOk = false;
  addViolation("focuscss", "no :focus-visible{ rule block found in built CSS");
} else {
  const block = focusVisibleMatch[1];
  if (!block.includes("outline:2pxsolidvar(--color-primary-container)")) {
    focuscssOk = false;
    addViolation(
      "focuscss",
      ":focus-visible block missing outline:2px solid var(--color-primary-container)"
    );
  }
  if (!block.includes("outline-offset:2px")) {
    focuscssOk = false;
    addViolation(
      "focuscss",
      ":focus-visible block missing outline-offset:2px"
    );
  }
  if (!block.includes("box-shadow:")) {
    focuscssOk = false;
    addViolation("focuscss", ":focus-visible block missing box-shadow:");
  }
}

// -----------------------------------------------------------------------
// Check group: skip-link CSS (D-04)
// -----------------------------------------------------------------------
const skipLinkCssBlockRegex = /\.skip-link:not\(:focus\)\{([^}]*)\}/;
const skipLinkCssMatch = skipLinkCssBlockRegex.exec(cssStripped);
if (!skipLinkCssMatch) {
  skiplinkOk = false;
  addViolation(
    "skiplink",
    "no .skip-link:not(:focus){ rule block found in built CSS"
  );
} else if (!skipLinkCssMatch[1].includes("transform:translateY(-200%)")) {
  skiplinkOk = false;
  addViolation(
    "skiplink",
    ".skip-link:not(:focus) block missing transform:translateY(-200%)"
  );
}
// No .skip-link rule block anywhere may contain display:none.
const skipLinkBlockRegex = /\.skip-link[^{]*\{([^}]*)\}/g;
let slBlockMatch;
while ((slBlockMatch = skipLinkBlockRegex.exec(cssStripped)) !== null) {
  if (slBlockMatch[1].includes("display:none")) {
    skiplinkOk = false;
    addViolation("skiplink", "a .skip-link rule block contains display:none");
  }
}

// -----------------------------------------------------------------------
// Check group: nested landmarks at the source level (A11Y-01)
// -----------------------------------------------------------------------
const indexAstroPath = join("src", "pages", "index.astro");
if (existsSync(indexAstroPath)) {
  const indexAstro = readFileSync(indexAstroPath, "utf8");
  if (/<main\b/.test(indexAstro)) {
    landmarksOk = false;
    addViolation(
      "landmarks",
      "src/pages/index.astro contains <main — would nest a second main landmark inside the layout's <main>"
    );
  }
} else {
  landmarksOk = false;
  addViolation("landmarks", `${indexAstroPath} not found`);
}

// -----------------------------------------------------------------------
// Check group: overlay markup (D-01)
// -----------------------------------------------------------------------
let overlayOk = true;

const overlayIdMatches = html.match(/id="nav-overlay"/g) || [];
if (overlayIdMatches.length !== 1) {
  overlayOk = false;
  addViolation(
    "overlay",
    `expected exactly one id="nav-overlay" element, found ${overlayIdMatches.length}`
  );
}

const overlayTagRegex = /<[a-z0-9]+\b[^>]*id="nav-overlay"[^>]*>/i;
const overlayTagMatch = overlayTagRegex.exec(html);
if (!overlayTagMatch) {
  overlayOk = false;
  addViolation(
    "overlay",
    'could not locate the opening tag carrying id="nav-overlay"'
  );
} else {
  const tag = overlayTagMatch[0];
  const requiredAttrs = [
    "data-nav-overlay",
    'data-menu-open="false"',
    'role="dialog"',
    'aria-modal="true"',
    'aria-label="Menu de navegação"',
  ];
  for (const attr of requiredAttrs) {
    if (!tag.includes(attr)) {
      overlayOk = false;
      addViolation("overlay", `overlay tag missing ${attr}`);
    }
  }
}

// Overlay must be a sibling of <nav>, not nested inside it (backdrop-filter
// containing-block trap) — </nav> must close before id="nav-overlay" appears.
const navCloseIdx = html.indexOf("</nav>");
const overlayIdIdx = html.indexOf('id="nav-overlay"');
if (navCloseIdx === -1 || overlayIdIdx === -1) {
  overlayOk = false;
  addViolation(
    "overlay",
    'could not find both </nav> and id="nav-overlay" in dist/index.html'
  );
} else if (!(navCloseIdx < overlayIdIdx)) {
  overlayOk = false;
  addViolation(
    "overlay",
    "overlay must be a sibling of <nav>, not a descendant — </nav> must close before id=\"nav-overlay\" appears (the nav's backdrop-filter makes it a containing block for position:fixed descendants)"
  );
}

// Toggle button: aria-controls must equal the overlay id, and it must
// contain exactly two inline <svg> icons (menu + close), server-rendered.
const toggleTagRegex = /<button\b[^>]*data-nav-toggle[^>]*>/i;
const toggleTagMatch = toggleTagRegex.exec(html);
if (!toggleTagMatch) {
  overlayOk = false;
  addViolation("overlay", "could not locate the toggle button (data-nav-toggle)");
} else {
  if (!/aria-controls="nav-overlay"/.test(toggleTagMatch[0])) {
    overlayOk = false;
    addViolation(
      "overlay",
      'toggle button aria-controls must equal "nav-overlay"'
    );
  }
  const toggleStart = toggleTagMatch.index;
  const toggleCloseIdx = html.indexOf("</button>", toggleStart);
  if (toggleCloseIdx === -1) {
    overlayOk = false;
    addViolation("overlay", "could not find closing </button> for the mobile toggle");
  } else {
    const toggleInner = html.slice(toggleStart, toggleCloseIdx);
    const svgCount = (toggleInner.match(/<svg\b/g) || []).length;
    if (svgCount !== 2) {
      overlayOk = false;
      addViolation(
        "overlay",
        `toggle button must contain exactly two inline <svg> elements, found ${svgCount}`
      );
    }
    if (!/data-nav-icon="menu"/.test(toggleInner)) {
      overlayOk = false;
      addViolation("overlay", 'toggle button missing icon with data-nav-icon="menu"');
    }
    if (!/data-nav-icon="close"/.test(toggleInner)) {
      overlayOk = false;
      addViolation("overlay", 'toggle button missing icon with data-nav-icon="close"');
    }
  }
}

// Overlay contents: five anchors total (4 section links + Connect), scoped
// strictly to the overlay element's own inner markup.
if (overlayTagMatch) {
  const overlayTagNameMatch = /^<([a-z0-9]+)/i.exec(overlayTagMatch[0]);
  const overlayTagName = overlayTagNameMatch ? overlayTagNameMatch[1] : null;
  const overlayTagEndIdx = overlayTagMatch.index + overlayTagMatch[0].length;
  const overlayInner = overlayTagName
    ? extractElementInner(html, overlayTagEndIdx, overlayTagName)
    : null;
  if (!overlayInner) {
    overlayOk = false;
    addViolation("overlay", "could not extract the overlay element's inner markup");
  } else {
    const overlayAnchors = [
      { href: "#dossier", label: "Dossier" },
      { href: "#stack", label: "Stack" },
      { href: "#projects", label: "Projects" },
      { href: "#contact", label: "Contact" },
    ];
    for (const { href, label } of overlayAnchors) {
      const anchorRegex = new RegExp(
        `<a\\b[^>]*href="${href}"[^>]*>\\s*${label}\\s*<\\/a>`,
        "i"
      );
      if (!anchorRegex.test(overlayInner)) {
        overlayOk = false;
        addViolation(
          "overlay",
          `overlay missing anchor href="${href}" with label "${label}"`
        );
      }
    }
    const overlayConnectRegex = /<a\b[^>]*href="#contact"[^>]*>\s*Connect\s*<\/a>/i;
    if (!overlayConnectRegex.test(overlayInner)) {
      overlayOk = false;
      addViolation(
        "overlay",
        'overlay missing Connect anchor with href="#contact"'
      );
    }
  }
}

// -----------------------------------------------------------------------
// Check group: overlay CSS state rules (D-01)
// -----------------------------------------------------------------------
const overlayHiddenBlock = findCssBlock(
  cssStripped,
  `\\[data-nav-overlay\\]${attrEq("data-menu-open", "false")}`
);
if (!overlayHiddenBlock || !overlayHiddenBlock.includes("display:none")) {
  overlayOk = false;
  addViolation(
    "overlay",
    '[data-nav-overlay][data-menu-open="false"] must set display:none'
  );
}

const navOpenZBlock = findCssBlock(cssStripped, `nav${attrEq("data-menu-open", "true")}`);
if (!navOpenZBlock || !navOpenZBlock.includes("z-index:70")) {
  overlayOk = false;
  addViolation("overlay", 'nav[data-menu-open="true"] must set z-index:70');
}

const bodyLockBlock = findCssBlock(cssStripped, `body${attrEq("data-menu-open", "true")}`);
if (!bodyLockBlock || !bodyLockBlock.includes("overflow:hidden")) {
  overlayOk = false;
  addViolation("overlay", 'body[data-menu-open="true"] must set overflow:hidden');
}

// Descendant-combinator selectors — must be matched against the loose copy,
// since the fully-stripped copy would collapse the combinator space and
// make these look like (incorrect) compound selectors.
const iconCloseHiddenBlock = findCssBlock(
  cssLoose,
  `nav${attrEq("data-menu-open", "false")} ${attrEq("data-nav-icon", "close")}`
);
if (
  !iconCloseHiddenBlock ||
  !iconCloseHiddenBlock.replace(/\s+/g, "").includes("display:none")
) {
  overlayOk = false;
  addViolation(
    "overlay",
    'nav[data-menu-open="false"] [data-nav-icon="close"] must set display:none'
  );
}

const iconMenuHiddenBlock = findCssBlock(
  cssLoose,
  `nav${attrEq("data-menu-open", "true")} ${attrEq("data-nav-icon", "menu")}`
);
if (
  !iconMenuHiddenBlock ||
  !iconMenuHiddenBlock.replace(/\s+/g, "").includes("display:none")
) {
  overlayOk = false;
  addViolation(
    "overlay",
    'nav[data-menu-open="true"] [data-nav-icon="menu"] must set display:none'
  );
}

// -----------------------------------------------------------------------
// Check group: overlay behaviour script (D-01) — vanilla JS only
// -----------------------------------------------------------------------
let overlayjsOk = true;

const inlineScriptBodies = [
  ...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi),
].map((m) => m[1]);
const jsFiles = allFiles.filter((f) => extname(f).toLowerCase() === ".js");
let scriptText = inlineScriptBodies.join("\n");
for (const f of jsFiles) {
  scriptText += "\n" + readFileSync(f, "utf8");
}

const requiredLiterals = [
  "data-nav-toggle",
  "nav-overlay",
  "data-menu-open",
  "aria-expanded",
  "Escape",
  "Tab",
  "matchMedia",
  "Fechar menu de navegação",
  "Abrir menu de navegação",
];
for (const literal of requiredLiterals) {
  if (!scriptText.includes(literal)) {
    overlayjsOk = false;
    addViolation("overlayjs", `built script text missing literal "${literal}"`);
  }
}

// Source-level checks on Nav.astro — the machine-checkable form of "vanilla
// JS only, no framework island, no unprocessed inline script".
const navAstroPath = join("src", "components", "Nav.astro");
if (!existsSync(navAstroPath)) {
  overlayjsOk = false;
  addViolation("overlayjs", `${navAstroPath} not found`);
} else {
  const navAstroSrc = readFileSync(navAstroPath, "utf8");
  if (!/<script\b/.test(navAstroSrc)) {
    overlayjsOk = false;
    addViolation("overlayjs", "src/components/Nav.astro must contain a <script tag");
  }
  if (/<script\b[^>]*\bis:inline\b/.test(navAstroSrc)) {
    overlayjsOk = false;
    addViolation(
      "overlayjs",
      "src/components/Nav.astro <script> must not use is:inline (bypasses Astro's CSP processing)"
    );
  }
  if (/\bclient:/.test(navAstroSrc)) {
    overlayjsOk = false;
    addViolation(
      "overlayjs",
      "src/components/Nav.astro must not contain a client: directive (no framework island)"
    );
  }
  if (
    /from\s+["'](react|vue|svelte|preact|solid-js|alpinejs)/.test(navAstroSrc)
  ) {
    overlayjsOk = false;
    addViolation(
      "overlayjs",
      "src/components/Nav.astro must not import a UI framework"
    );
  }
}

// -----------------------------------------------------------------------
// Print violations + summary line.
// -----------------------------------------------------------------------
for (const v of violations) {
  console.error(`verify-shell: ${v.check} — ${v.detail}`);
}

console.log(
  `SHELL SUMMARY lang=${langOk ? "ok" : "fail"} landmarks=${
    landmarksOk ? "ok" : "fail"
  } skiplink=${skiplinkOk ? "ok" : "fail"} nav=${navOk ? "ok" : "fail"} brand=${
    brandOk ? "ok" : "fail"
  } focuscss=${focuscssOk ? "ok" : "fail"} overlay=${
    overlayOk ? "ok" : "fail"
  } overlayjs=${overlayjsOk ? "ok" : "fail"} violations=${violations.length}`
);

process.exit(violations.length === 0 ? 0 : 1);
