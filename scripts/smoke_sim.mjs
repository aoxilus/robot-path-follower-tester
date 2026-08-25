import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const requiredFiles = ['package.json', 'index.html', 'main.js', 'nav.js', 'style.css'];
const algorithmIds = ['pure_pursuit', 'bug2', 'vfh'];

let allPassed = true;

function check(label, passed, detail = '') {
  if (!passed) allPassed = false;
  const suffix = detail ? ` - ${detail}` : '';
  console.log(`${passed ? 'OK' : 'FAIL'} ${label}${suffix}`);
}

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

for (const file of requiredFiles) {
  const filePath = path.join(repoRoot, file);
  let passed = false;
  let detail = '';

  try {
    const stats = fs.statSync(filePath);
    passed = stats.isFile() && stats.size > 0;
    if (!stats.isFile()) detail = 'not a file';
    else if (stats.size === 0) detail = 'empty';
  } catch (error) {
    detail = error.code === 'ENOENT' ? 'missing' : error.message;
  }

  check(`${file} exists and is non-empty`, passed, detail);
}

let packageJson = null;
try {
  packageJson = JSON.parse(readText('package.json'));
} catch (error) {
  check('package.json is readable JSON', false, error.message);
}

if (packageJson) {
  check('package.json has name', typeof packageJson.name === 'string' && packageJson.name.trim().length > 0);

  const dependencies = packageJson.dependencies && typeof packageJson.dependencies === 'object'
    ? packageJson.dependencies
    : {};
  check('package.json dependencies include three', Object.prototype.hasOwnProperty.call(dependencies, 'three'));
  check('package.json dependencies include cannon-es', Object.prototype.hasOwnProperty.call(dependencies, 'cannon-es'));
}

let navSource = '';
try {
  navSource = readText('nav.js');
} catch (error) {
  check('nav.js is readable', false, error.message);
}

if (navSource) {
  check('nav.js contains createNavSystem', navSource.includes('createNavSystem'));
  for (const id of algorithmIds) {
    check(`nav.js contains algorithm id ${id}`, navSource.includes(id));
  }
}

let indexHtml = '';
try {
  indexHtml = readText('index.html');
} catch (error) {
  check('index.html is readable', false, error.message);
}

if (indexHtml) {
  for (const id of algorithmIds) {
    const pattern = new RegExp(`data-algo\\s*=\\s*(["'])${id}\\1`);
    check(`index.html has data-algo button for ${id}`, pattern.test(indexHtml));
  }
}

process.exit(allPassed ? 0 : 1);
