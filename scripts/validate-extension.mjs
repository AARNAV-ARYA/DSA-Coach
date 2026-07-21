import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const buildDirectory = path.resolve(process.argv[2] ?? 'dist');
const maximumPackageBytes = 5 * 1024 * 1024;
const maximumJavaScriptBytes = 350 * 1024;
const requiredIconSizes = [16, 32, 48, 128];

const manifest = JSON.parse(await readFile(path.join(buildDirectory, 'manifest.json'), 'utf8'));
const files = await listFiles(buildDirectory);

assert(manifest.manifest_version === 3, 'Manifest V3 is required.');
assert(typeof manifest.name === 'string' && manifest.name.length > 0, 'Manifest name is required.');
assert(
  typeof manifest.description === 'string' && manifest.description.length <= 132,
  'Manifest description must be present and at most 132 characters.',
);
assert(/^\d+(?:\.\d+){0,3}$/.test(manifest.version), 'Manifest version is invalid.');
assert(manifest.incognito === 'not_allowed', 'Incognito must remain disabled for private notes.');

for (const size of requiredIconSizes) {
  const relative = manifest.icons?.[String(size)];
  assert(typeof relative === 'string', `Missing ${String(size)}px manifest icon.`);
  const dimensions = await readPngDimensions(path.join(buildDirectory, relative));
  assert(
    dimensions.width === size && dimensions.height === size,
    `${relative} must be ${String(size)}x${String(size)}.`,
  );
}

const referencedFiles = [
  manifest.action?.default_popup,
  manifest.background?.service_worker,
  ...(manifest.background?.scripts ?? []),
  manifest.side_panel?.default_path,
  manifest.sidebar_action?.default_panel,
  ...manifest.content_scripts.flatMap((entry) => entry.js ?? []),
].filter((value) => typeof value === 'string');

for (const relative of referencedFiles) {
  assert(files.includes(relative), `Manifest target does not exist: ${relative}`);
}

let totalBytes = 0;
for (const relative of files) {
  const absolute = path.join(buildDirectory, relative);
  const details = await stat(absolute);
  totalBytes += details.size;
  assert(!relative.endsWith('.map'), `Source map must not ship: ${relative}`);
  assert(!relative.startsWith('.env'), `Secret file must not ship: ${relative}`);

  if (relative.endsWith('.js')) {
    assert(details.size <= maximumJavaScriptBytes, `JavaScript budget exceeded: ${relative}`);
    const source = await readFile(absolute, 'utf8');
    assert(!/\beval\s*\(/.test(source), `eval is forbidden in ${relative}`);
    assert(!/\bnew\s+Function\s*\(/.test(source), `new Function is forbidden in ${relative}`);
  }
}

for (const contentScript of manifest.content_scripts) {
  for (const relative of contentScript.js ?? []) {
    const source = await readFile(path.join(buildDirectory, relative), 'utf8');
    assert(!/^\s*import\s/m.test(source), `Classic content script has an import: ${relative}`);
    assert(!/\bimport\s*\(/.test(source), `Classic content script has dynamic import: ${relative}`);
  }
}

assert(totalBytes <= maximumPackageBytes, 'Unpacked extension exceeds the 5 MB package budget.');
console.log(
  `Extension validation passed: ${files.length.toString()} files, ${(totalBytes / 1024 / 1024).toFixed(2)} MB unpacked.`,
);

async function listFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const relative = path.posix.join(prefix, entry.name);
      return entry.isDirectory()
        ? listFiles(path.join(directory, entry.name), relative)
        : [relative];
    }),
  );
  return nested.flat().sort();
}

async function readPngDimensions(file) {
  const bytes = await readFile(file);
  assert(bytes.subarray(1, 4).toString('ascii') === 'PNG', `${file} must be a PNG.`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
