const { readdirSync, writeFileSync, copyFileSync, mkdirSync, existsSync, rmSync } = require('fs');
const { join } = require('path');

const CONTENT_DIR = join(process.cwd(), 'content');
const PUBLIC_CONTENT_DIR = join(process.cwd(), 'public', 'content');
const MANIFEST_PATH = join(process.cwd(), 'src', 'utils', 'content-manifest.json');

const ABBREVIATIONS = new Set(['ann', 'ml', 'ai', 'dl', 'nlp', 'cnn', 'rnn', 'lstm', 'gpu', 'cpu', 'api', 'db', 'ui', 'ux', 'csv', 'sql', 'pca', 'svm', 'rf', 'xgb', 'gbm', 'knn', 'nn', 'dt', 'ols', 'ar', 'ma', 'arma', 'arima', 'sarima', 'garch', 'var', 'vecm']);

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
    .replace(/^\d+[\.\-\s]*/, '')
    .replace(/[-_]/g, ' ')
    .trim();
  return toTitleCase(cleaned);
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
      .sort();

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
      description: `${files.length} lessons`,
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

console.log('Scanning content/ folder...');
const { topics, manifest } = scanContentDir(CONTENT_DIR);

writeFileSync(MANIFEST_PATH, JSON.stringify({ topics, topicMeta: manifest }, null, 2));
console.log(`  Found ${topics.length} topic(s):`);
for (const t of topics) {
  console.log(`    - ${t.name} (${t.children.length} files)`);
}

copyContentToPublic(CONTENT_DIR, PUBLIC_CONTENT_DIR);
console.log('  Copied to public/content/');
console.log('Done!');
