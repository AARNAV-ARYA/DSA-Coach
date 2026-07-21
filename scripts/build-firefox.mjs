import { cp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const chromeBuild = path.join(root, 'dist');
const firefoxBuild = path.join(root, 'dist-firefox');
const firefoxManifest = path.join(root, 'config', 'manifest.firefox.json');

await rm(firefoxBuild, { recursive: true, force: true });
await cp(chromeBuild, firefoxBuild, { recursive: true });
await writeFile(
  path.join(firefoxBuild, 'manifest.json'),
  await readFile(firefoxManifest, 'utf8'),
  'utf8',
);

console.log(`Firefox package prepared at ${firefoxBuild}`);
