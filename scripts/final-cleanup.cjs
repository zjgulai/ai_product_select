const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '../src/pages');

// Additional color replacements
const REPLACEMENTS = [
  // Exact string matches in style objects
  { from: "'#14B8A6'", to: 'LC.teal' },
  { from: "'#fff'", to: 'LC.textInverse' },
  { from: "'#E2E2DE'", to: 'LC.borderStrong' },
  { from: "'rgba(0,0,0,0.7)'", to: "'rgba(0,0,0,0.7)'" }, // keep
  { from: "'transparent'", to: "'transparent'" }, // keep
  { from: "fill=\"'#14B8A6'\"", to: "fill={LC.teal}" },
  { from: "fill-[#D49450]", to: "fill-lc-gold" },
  { from: "color={'#14B8A6'}", to: "color={LC.teal}" },
  { from: "`${'#14B8A6'}10`", to: "`${LC.teal}10`" },
  { from: "background: '#fff'", to: "background: LC.textInverse" },
  { from: "color: '#fff'", to: "color: LC.textInverse" },
  { from: "background: '#fff'", to: "background: LC.textInverse" },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  for (const { from, to } of REPLACEMENTS) {
    if (from === to) continue;
    content = content.split(from).join(to);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${path.relative(PAGES_DIR, filePath)}`);
  }
}

function walkDir(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

walkDir(PAGES_DIR);
console.log('Done final cleanup.');
