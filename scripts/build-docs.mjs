import { mkdir, readdir, copyFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const docsDistDir = path.join(root, 'docs', 'dist');

await mkdir(docsDistDir, { recursive: true });

const entries = await readdir(distDir, { withFileTypes: true });

await Promise.all(
  entries
    .filter((entry) => entry.isFile())
    .map(async (entry) => {
      const src = path.join(distDir, entry.name);
      const dest = path.join(docsDistDir, entry.name);
      const info = await stat(src);
      if (!info.isFile()) return null;
      await copyFile(src, dest);
      return dest;
    })
);

// eslint-disable-next-line no-console
console.log(`Copied ${entries.length} files to docs/dist`);