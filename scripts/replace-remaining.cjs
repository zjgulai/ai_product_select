const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '../src/pages');

// Extended color map for remaining colors
const COLOR_MAP = {
  "'#E8785A'": 'LC.primary',
  "'#EDEAE5'": 'LC.border',
  "'#F5F2EE'": 'LC.borderLight',
  "'#E0DCD6'": 'LC.borderStrong',
  "'#1C1917'": 'LC.text',
  "'#78716C'": 'LC.textSecondary',
  "'#A8A29E'": 'LC.textMuted',
  "'#16A34A'": 'LC.success',
  "'#DCFCE7'": 'LC.successLight',
  "'#DC2626'": 'LC.danger',
  "'#FEE2E2'": 'LC.dangerLight',
  "'#E8810A'": 'LC.warning',
  "'#FEF3C7'": 'LC.warningLight',
  "'#FEF2EE'": 'LC.primaryLight',
  "'#D46040'": 'LC.primaryDark',
  "'#D49450'": 'LC.gold',
  "'#14B8A6'": "'#14B8A6'",
  "'#D6D3D0'": "'#D6D3D0'",
  "'#5A5A00'": "'#5A5A00'",
  "'#E8785A30'": "`${LC.primary}30`",
  "'#E8785A18'": "`${LC.primary}18`",
  "'#EDEAE5'40'": "`${LC.border}40`",
  "'#EDEAE5'60'": "`${LC.border}60`",
};

// Skip ECharts color props and chart-related color arrays
function isChartContext(line, idx) {
  const nearby = line.substring(Math.max(0, idx - 50), idx + 50);
  if (nearby.includes('ECharts')) return true;
  if (nearby.includes('color={')) return true;
  if (nearby.includes('colors =')) return true;
  if (nearby.includes('// Chart colors')) return true;
  return false;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  const lines = content.split('\n');
  const newLines = lines.map(line => {
    // Skip ECharts contexts
    if (line.includes('ECharts')) return line;
    if (line.includes('color={\'\'#E8785A\'\'}')) return line;
    if (line.includes('colors = [')) return line;
    if (line.includes('// Chart colors')) return line;
    if (line.includes('color={LC')) return line;

    let newLine = line;

    // Replace color values in style objects and expressions
    for (const [hex, replacement] of Object.entries(COLOR_MAP)) {
      if (replacement.startsWith("'")) continue; // Skip unmapped

      // Replace in ternary expressions like: color: idx < 3 ? '#E8785A' : '#A8A29E'
      const regex = new RegExp(hex.replace(/'/g, "'").replace(/\[/g, '\\[').replace(/\]/g, '\\]'), 'g');
      newLine = newLine.replace(regex, replacement);
    }

    return newLine;
  });

  content = newLines.join('\n');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${path.relative(PAGES_DIR, filePath)}`);
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
console.log('Done processing remaining colors.');
