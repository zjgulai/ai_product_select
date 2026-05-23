const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '../src/pages');

// Color mapping
const COLOR_MAP = {
  '#E8785A': { tw: 'lc-primary', lute: 'LC.primary' },
  '#EDEAE5': { tw: 'lc-border', lute: 'LC.border' },
  '#F5F2EE': { tw: 'lc-border-light', lute: 'LC.border' },
  '#E0DCD6': { tw: 'lc-border-strong', lute: 'LC.borderStrong' },
  '#1C1917': { tw: 'lc-text-primary', lute: 'LC.text' },
  '#78716C': { tw: 'lc-text-secondary', lute: 'LC.textSecondary' },
  '#A8A29E': { tw: 'lc-text-muted', lute: 'LC.textMuted' },
  '#16A34A': { tw: 'lc-success', lute: 'LC.success' },
  '#DCFCE7': { tw: 'lc-success/10', lute: 'LC.successLight' },
  '#DC2626': { tw: 'lc-danger', lute: 'LC.danger' },
  '#FEE2E2': { tw: 'lc-danger/10', lute: 'LC.dangerLight' },
  '#E8810A': { tw: 'lc-warning', lute: 'LC.warning' },
  '#FEF3C7': { tw: 'lc-warning/10', lute: 'LC.warning' },
  '#FEF2EE': { tw: 'lc-primary-light', lute: 'LC.primaryLight' },
  '#D46040': { tw: 'lc-primary-dark', lute: 'LC.primaryDark' },
  '#D49450': { tw: 'lc-gold', lute: 'LC.gold' },
  '#FAFAF8': { tw: 'lc-bg-warm', lute: 'LC.bgWarm' },
};

// Process arbitrary Tailwind values like ring-[#EDEAE5]/60
function replaceArbitraryValues(content) {
  let result = content;

  // Replace patterns like ring-[#EDEAE5]/60, border-[#EDEAE5], text-[#E8785A], bg-[#E8785A]
  for (const [hex, { tw }] of Object.entries(COLOR_MAP)) {
    // ring-[#hex]/opacity
    result = result.replace(new RegExp(`ring-\\[${hex.replace('#', '\\#')}\\]/([0-9]+)`, 'g'), `ring-${tw}/$1`);
    // border-[#hex]
    result = result.replace(new RegExp(`border-\\[${hex.replace('#', '\\#')}\\]`, 'g'), `border-${tw}`);
    // text-[#hex]
    result = result.replace(new RegExp(`text-\\[${hex.replace('#', '\\#')}\\]`, 'g'), `text-${tw}`);
    // bg-[#hex]
    result = result.replace(new RegExp(`bg-\\[${hex.replace('#', '\\#')}\\]`, 'g'), `bg-${tw}`);
    // ring-[#hex]
    result = result.replace(new RegExp(`ring-\\[${hex.replace('#', '\\#')}\\]`, 'g'), `ring-${tw}`);
  }

  return result;
}

// Process inline styles - only safe replacements
function replaceInlineStyles(content) {
  let result = content;

  // For each color, replace in style={{ ... }} contexts
  for (const [hex, { tw }] of Object.entries(COLOR_MAP)) {
    // style={{ borderColor: '#EDEAE5' }} -> add className border-lc-border, remove borderColor from style
    // This is complex, so we only handle simple cases where style ONLY contains this property
    const simpleStylePattern = new RegExp(
      `style=\\{\\{\\s*borderColor:\\s*['"]${hex.replace('#', '\\#')}['"]\\s*\\}\\}`,
      'g'
    );
    result = result.replace(simpleStylePattern, `className="border-${tw}"`);

    // style={{ color: '#E8785A' }} -> className="text-lc-primary"
    const simpleColorPattern = new RegExp(
      `style=\\{\\{\\s*color:\\s*['"]${hex.replace('#', '\\#')}['"]\\s*\\}\\}`,
      'g'
    );
    result = result.replace(simpleColorPattern, `className="text-${tw}"`);

    // style={{ background: '#E8785A' }} -> className="bg-lc-primary"
    const simpleBgPattern = new RegExp(
      `style=\\{\\{\\s*background:\\s*['"]${hex.replace('#', '\\#')}['"]\\s*\\}\\}`,
      'g'
    );
    result = result.replace(simpleBgPattern, `className="bg-${tw}"`);
  }

  return result;
}

// Process event handlers like onMouseEnter={e => e.currentTarget.style.color = '#E8785A'}
function replaceEventHandlers(content) {
  let result = content;

  for (const [hex, { tw }] of Object.entries(COLOR_MAP)) {
    // e.currentTarget.style.color = '#E8785A'
    result = result.replace(
      new RegExp(`e\\.currentTarget\\.style\\.color\\s*=\\s*['"]${hex.replace('#', '\\#')}['"]`, 'g'),
      `e.currentTarget.classList.add('text-${tw}')`
    );
    // e.currentTarget.style.background = '#E8785A'
    result = result.replace(
      new RegExp(`e\\.currentTarget\\.style\\.background\\s*=\\s*['"]${hex.replace('#', '\\#')}['"]`, 'g'),
      `e.currentTarget.classList.add('bg-${tw}')`
    );
  }

  return result;
}

// Process MiniTrend color prop
function replaceMiniTrendColors(content) {
  let result = content;
  result = result.replace(/color="#E8785A"/g, `color={LC.primary}`);
  result = result.replace(/color="#FF9500"/g, `color="#FF9500"`); // keep orange
  return result;
}

// Process object literals in JSX like style={tab === i ? { color: '#E8785A', borderColor: '#E8785A' } : { color: '#A8A29E', borderColor: 'transparent' }}
// For these, we keep the style but use LC constants
function replaceObjectLiterals(content) {
  let result = content;

  for (const [hex, { lute }] of Object.entries(COLOR_MAP)) {
    // Replace in object literals: color: '#E8785A'
    result = result.replace(
      new RegExp(`color:\\s*['"]${hex.replace('#', '\\#')}['"]`, 'g'),
      `color: ${lute}`
    );
    // Replace in object literals: background: '#E8785A'
    result = result.replace(
      new RegExp(`background:\\s*['"]${hex.replace('#', '\\#')}['"]`, 'g'),
      `background: ${lute}`
    );
    // Replace in object literals: borderColor: '#EDEAE5'
    result = result.replace(
      new RegExp(`borderColor:\\s*['"]${hex.replace('#', '\\#')}['"]`, 'g'),
      `borderColor: ${lute}`
    );
  }

  return result;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  content = replaceArbitraryValues(content);
  content = replaceInlineStyles(content);
  content = replaceEventHandlers(content);
  content = replaceMiniTrendColors(content);
  content = replaceObjectLiterals(content);

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
console.log('Done processing all files.');
