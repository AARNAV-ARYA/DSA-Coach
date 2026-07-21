import { execFileSync } from 'node:child_process';
import { mkdir, readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const buildDirectory = path.resolve(process.argv[2] ?? 'dist');
const platform = process.argv[3] ?? 'chrome';
const manifest = JSON.parse(await readFile(path.join(buildDirectory, 'manifest.json'), 'utf8'));
const releaseDirectory = path.join(root, 'release');
const archive = path.join(releaseDirectory, `dsa-coach-${manifest.version}-${platform}.zip`);

await mkdir(releaseDirectory, { recursive: true });
await rm(archive, { force: true });
execFileSync('zip', ['-qr', archive, '.'], { cwd: buildDirectory, stdio: 'inherit' });

const details = await stat(archive);
console.log(`${archive} (${(details.size / 1024 / 1024).toFixed(2)} MB)`);
