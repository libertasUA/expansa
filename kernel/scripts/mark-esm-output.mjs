import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The package itself is CommonJS, because that is what the server consumes and
// what Node assumes for a bare `.js` file. The ESM build sits inside it and
// would be parsed as CommonJS without this marker, failing on the first
// `import` statement. One nested package.json is the standard way to say "the
// files in this directory are modules".
//
// Written by the build rather than committed, since dist/ is generated.

const esmDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'esm');

await mkdir(esmDir, { recursive: true });
await writeFile(
  join(esmDir, 'package.json'),
  `${JSON.stringify({ type: 'module' }, null, 2)}\n`,
);
