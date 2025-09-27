#!/usr/bin/env node
/**
 * Automated upgrade helper: checks for mismatched core Expo peer versions
 * and suggests (or prints) the exact yarn add commands.
 * Non-destructive: does not change files automatically unless --write is passed.
 */

const fs = require('fs');
const path = require('path');

const pkgPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(pkgPath)) {
  console.error('package.json not found');
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const TARGET = {
  expo: '^54.0.0',
  react: '19.1.0',
  'react-dom': '19.1.0',
  'react-native': '0.81.4',
  'react-native-web': '^0.21.0',
  typescript: '~5.9.2',
  '@types/react': '~19.1.10'
};

function collectCurrent(name) {
  return (
    (pkg.dependencies && pkg.dependencies[name]) ||
    (pkg.devDependencies && pkg.devDependencies[name]) ||
    null
  );
}

const deltas = Object.entries(TARGET).map(([name, wanted]) => {
  const current = collectCurrent(name);
  return { name, wanted, current, ok: !current || current === wanted };
});

const toInstall = deltas.filter(d => d.current && d.current !== d.wanted);
if (toInstall.length === 0) {
  console.log('All core versions already aligned with target.');
  process.exit(0);
}

console.log('Version differences:');
for (const d of toInstall) {
  console.log(`  ${d.name}: current=${d.current} -> wanted=${d.wanted}`);
}

const write = process.argv.includes('--write');
if (!write) {
  console.log('\nSuggested command:');
  console.log(
    'yarn add ' +
      toInstall
        .filter(d => !d.name.startsWith('@types/') && d.name !== 'typescript')
        .map(d => `${d.name}@${d.wanted}`)
        .join(' ') +
      ' && yarn add -D ' +
      toInstall
        .filter(d => d.name.startsWith('@types/') || d.name === 'typescript')
        .map(d => `${d.name}@${d.wanted}`)
        .join(' ')
  );
  process.exit(0);
}

// Mutate package.json
for (const d of toInstall) {
  if (pkg.dependencies && pkg.dependencies[d.name]) {
    pkg.dependencies[d.name] = d.wanted;
  } else if (pkg.devDependencies && pkg.devDependencies[d.name]) {
    pkg.devDependencies[d.name] = d.wanted;
  } else {
    // default to dependencies
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies[d.name] = d.wanted;
  }
}
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('package.json updated. Run yarn install next.');
