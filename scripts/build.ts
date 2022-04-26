import { execaCommandSync as exec } from 'execa';
import { chProjectDir, copyPackageFiles, rmDist } from 'lion-system';
import fs from 'node:fs';

chProjectDir(import.meta.url);
rmDist();
exec('tsc');
exec('tsc-alias');
await copyPackageFiles({ commonjs: { external: /vue-tsc\// } });

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const pkgJson = JSON.parse(fs.readFileSync('dist/package.json', 'utf8'));
pkgJson.dependencies.vite = 'npm:ignoredep@^2.5.1';
fs.writeFileSync('dist/package.json', JSON.stringify(pkgJson, null, '\t'));
