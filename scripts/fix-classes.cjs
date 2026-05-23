const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '../src/pages');

function mergeDuplicateClasses(content) {
  // Find patterns like className="..." className="..."
  // We need to handle cases where there might be multiple duplicates
  const classNameRegex = /className="([^"]*)"\s+className="([^"]*)"/g;

  let result = content;
  let prev;
  do {
    prev = result;
    result = result.replace(classNameRegex, (match, cls1, cls2) => {
      const merged = [cls1, cls2].filter(Boolean).join(' ');
      return `className="${merged}"`;
    });
  } while (prev !== result);

  return result;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  content = mergeDuplicateClasses(content);

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
console.log('Done fixing duplicate classes.');
