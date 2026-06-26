const fs = require('fs');
const { readdirSync, writeFileSync, copyFileSync, mkdirSync, existsSync, rmSync } = require('fs');
const { join } = require('path');

const CONTENT_DIR = join(process.cwd(), 'content');
const PUBLIC_CONTENT_DIR = join(process.cwd(), 'public', 'content');
const MANIFEST_PATH = join(process.cwd(), 'src', 'utils', 'content-manifest.json');

const ABBREVIATIONS = new Set(['ann', 'ml', 'ai', 'dl', 'nlp', 'cnn', 'rnn', 'lstm', 'gpu', 'cpu', 'api', 'db', 'ui', 'ux', 'csv', 'sql', 'pca', 'svm', 'rf', 'xgb', 'gbm', 'knn', 'nn', 'dt', 'ols', 'ar', 'ma', 'arma', 'arima', 'sarima', 'garch', 'var', 'vecm']);

// Real one-line descriptions per topic (folder name -> description).
// Topics not listed here fall back to "<n> lessons".
const TOPIC_DESCRIPTIONS = {
  ann: 'From a single neuron to deep networks — intuition, math, and runnable code.',
  clustering: 'Find natural groups in unlabeled data, from k-means to embeddings.',
  forecasting: 'Predict future demand from past patterns — baselines to real methods.',
  boosting_and_bagging: 'Combine many weak models into one strong one — bagging, forests, and boosting.',
  linear_and_logistic: 'The two workhorse models — predicting numbers and predicting classes.',
  cnn: 'The standard architecture for images — convolutions, pooling, and learned features from pixels to patterns.',
  rnn: 'Process sequences with memory — from time series to text, LSTMs, GRUs, and beyond.',
};

function toTitleCase(str) {
  return str.split(/\s+/).map(word => {
    const lower = word.toLowerCase();
    if (ABBREVIATIONS.has(lower)) return lower.toUpperCase();
    if (word.length <= 3 && word === word.toUpperCase() && /[A-Z]/.test(word)) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

function formatFileName(filename) {
  const cleaned = filename
    .replace('.html', '')
    .replace(/^\d+[\s._-]*/, '')
    .replace(/[-_]/g, ' ')
    .trim();
  return toTitleCase(cleaned);
}

function validateUniqueIds(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const idMatches = html.matchAll(/id="([^"]+)"/g);
  const ids = new Map();

  for (const match of idMatches) {
    const id = match[1];
    if (ids.has(id)) {
      throw new Error(`Duplicate id "${id}" in ${filePath}`);
    }
    ids.set(id, true);
  }
}

function validateContentIds(dir) {
  if (!existsSync(dir)) return;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      validateContentIds(srcPath);
    } else if (entry.name.endsWith('.html')) {
      validateUniqueIds(srcPath);
    }
  }
}

function collectAllHtmlFiles(dir) {
  const files = new Set();
  if (!existsSync(dir)) return files;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      for (const f of collectAllHtmlFiles(full)) files.add(f);
    } else if (entry.name.endsWith('.html')) {
      files.add(entry.name);
    }
  }
  return files;
}

function validateContentStructure(dir, allHtml) {
  if (!existsSync(dir)) return;

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      validateContentStructure(srcPath, allHtml);
      continue;
    }
    if (!entry.name.endsWith('.html')) continue;

    const html = fs.readFileSync(srcPath, 'utf8');

    // Check: at least one <section class="section" id="...">
    const sectionMatches = [...html.matchAll(/<section\b[^>]*class="[^"]*\bsection\b[^"]*"[^>]*>/gi)];
    if (sectionMatches.length === 0) {
      throw new Error(`${srcPath}: lesson has no <section class="section"> elements`);
    }

    // Check: every <section class="section"> must have an id, and id must be valid
    for (const m of sectionMatches) {
      const tag = m[0];
      const idMatch = tag.match(/\bid="([^"]*)"/);
      if (!idMatch) {
        throw new Error(`${srcPath}: <section class="section"> missing id attribute (tag: ${tag.slice(0, 80)})`);
      }
      const id = idMatch[1];
      if (id === '') {
        throw new Error(`${srcPath}: section has an empty id=""`);
      }
      if (/\s/.test(id)) {
        throw new Error(`${srcPath}: section id "${id}" contains whitespace`);
      }
      if (/["']/.test(id)) {
        throw new Error(`${srcPath}: section id "${id}" contains quotes`);
      }
    }

    // Check: broken cross-lesson href="*.html" links (skip external URLs)
    const linkMatches = [...html.matchAll(/href="([^"#]*\.html)(?:#[^"]*)?"/gi)];
    for (const m of linkMatches) {
      const hrefFile = m[1];
      if (hrefFile.includes('://')) continue; // external URL, skip
      const filename = hrefFile.split('/').pop(); // strip directory prefix, e.g. "../ann/foo.html" → "foo.html"
      if (!allHtml.has(filename)) {
        throw new Error(`${srcPath}: broken cross-lesson link href="${hrefFile}" — file not found under content/`);
      }
    }
  }
}

function scanContentDir(dir) {
  const topics = [];
  const manifest = {};

  if (!existsSync(dir)) {
    console.log('  No content/ directory found. Skipping.');
    return { topics, manifest };
  }

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const topicDir = join(dir, entry.name);
    const files = readdirSync(topicDir)
      .filter(f => f.endsWith('.html'))
      .sort((a, b) => {
        const na = parseInt(a.match(/^(\d+)/)?.[1] ?? '', 10);
        const nb = parseInt(b.match(/^(\d+)/)?.[1] ?? '', 10);
        const aHas = !Number.isNaN(na);
        const bHas = !Number.isNaN(nb);
        if (aHas && bHas) return na - nb;
        if (aHas) return -1;
        if (bHas) return 1;
        return a.localeCompare(b);
      });

    if (files.length === 0) continue;

    const label = toTitleCase(entry.name.replace(/[-_]/g, ' '));

    topics.push({
      name: label,
      path: entry.name,
      type: 'folder',
      children: files.map(f => ({
        name: formatFileName(f),
        path: `${entry.name}/${f}`,
        type: 'file'
      }))
    });

    manifest[entry.name] = {
      label,
      description: TOPIC_DESCRIPTIONS[entry.name] || `${files.length} lessons`,
      files
    };
  }

  return { topics, manifest };
}

function copyContentToPublic(srcDir, destDir) {
  if (existsSync(destDir)) {
    rmSync(destDir, { recursive: true });
  }
  mkdirSync(destDir, { recursive: true });

  if (!existsSync(srcDir)) return;

  const entries = readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name);
    const destPath = join(destDir, entry.name);
    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyContentToPublic(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

// Scaffold-drift guard: warn (don't fail) when a lesson introduces navigation/overlay
// "chrome" classes the app viewer (LESSON_INJECT_CSS in ContentViewer.tsx) doesn't yet
// hide or normalize — that's what causes a leaking burger, grey backdrop, or horizontal
// overflow in-app. Keeps new tracks consistent with the scaffold the viewer expects.
const HANDLED_SCAFFOLD = new Set([
  'nav', 'topbar', 'theme-toggle', 'toc-toggle', 'toc-backdrop', 'toc',
  'menu-btn', 'backdrop', 'shell', 'main-layout', 'container', 'content',
]);
const CHROME_CLASS_RE = /^(burger|hamburger|menu-?btn|menu-?toggle|drawer|off-?canvas|side-?bar|side-?nav|backdrop|scrim|overlay|navbar|topbar|app-?bar|shell|layout)/i;

function checkScaffoldDrift(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) { checkScaffoldDrift(p); continue; }
    if (!entry.name.endsWith('.html')) continue;
    const html = fs.readFileSync(p, 'utf8');
    const seen = new Set();
    for (const m of html.matchAll(/class="([^"]+)"/g)) {
      for (const c of m[1].trim().split(/\s+/)) seen.add(c);
    }
    const drift = [...seen].filter(
      (c) => CHROME_CLASS_RE.test(c) && !HANDLED_SCAFFOLD.has(c) && !c.startsWith('toc') && !c.startsWith('vy-')
    );
    if (drift.length) {
      console.warn(`  \u26a0  scaffold drift: ${p}`);
      console.warn(`      chrome class(es) the app viewer may not hide/normalize: ${drift.map((c) => '.' + c).join(', ')}`);
      console.warn(`      -> add them to LESSON_INJECT_CSS in src/content/ContentViewer.tsx`);
    }
  }
}

console.log('Scanning content/ folder...');
validateContentIds(CONTENT_DIR);
const allHtml = collectAllHtmlFiles(CONTENT_DIR);
validateContentStructure(CONTENT_DIR, allHtml);
checkScaffoldDrift(CONTENT_DIR);
const { topics, manifest } = scanContentDir(CONTENT_DIR);

writeFileSync(MANIFEST_PATH, JSON.stringify({ topics, topicMeta: manifest }, null, 2));
console.log(`  Found ${topics.length} topic(s):`);
for (const t of topics) {
  console.log(`    - ${t.name} (${t.children.length} files)`);
}

copyContentToPublic(CONTENT_DIR, PUBLIC_CONTENT_DIR);
console.log('  Copied to public/content/');
console.log('Done!');
