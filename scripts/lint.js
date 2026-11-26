const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');

const walk = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : walk(fullPath);
    return entry.name.endsWith('.js') ? [fullPath] : [];
  });

const files = [...walk(path.join(root, 'src')), ...walk(path.join(root, 'scripts'))];
let failures = 0;

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failures += 1;
    console.error(result.stderr.trim());
  }
}

if (failures) {
  console.error(`Syntax check failed for ${failures} file(s)`);
  process.exit(1);
}

console.log(`Syntax check passed for ${files.length} JavaScript files`);
