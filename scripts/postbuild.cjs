const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');

// Copy index.html → 404.html for SPA fallback on GitHub Pages
fs.copyFileSync(path.join(dist, 'index.html'), path.join(dist, '404.html'));
console.log('Created 404.html');

// Create .nojekyll to prevent Jekyll processing
fs.writeFileSync(path.join(dist, '.nojekyll'), '');
console.log('Created .nojekyll');
