import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

/**
 * The third enforcement layer for contour boundaries, and the only one that is
 * ours: pnpm refuses an undeclared import, TypeScript's project references refuse
 * it again, and this refuses game vocabulary inside an engine.
 *
 * The test is the one in CLAUDE.md — if the code contains these words, it is
 * Contour 3. Contour 2 knows about "a timed transformation with a cost,
 * prerequisites and effects"; that construction, research and ship production are
 * all instances of it is a fact the product knows and an engine does not.
 *
 * Comments are stripped before matching. A comment recording *why* a mechanic is
 * absent — "fleet size is capped by shipyard berths instead" — is exactly the kind
 * of note that keeps the file readable in six months, and forbidding it would
 * teach people to delete their reasons rather than their coupling.
 */
const FORBIDDEN = ['building', 'unit', 'fleet', 'asteroid', 'clan', 'village'];

const ROOTS = ['engines'];

const pattern = new RegExp(`\\b(${FORBIDDEN.join('|')})s?\\b`);

/**
 * `buildingCost` has no word boundary after "building", so a plain word match
 * misses exactly the identifiers worth catching. Splitting camel case first
 * turns it into "building Cost" and the boundary appears.
 */
function splitIdentifiers(line) {
  return line.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
}

async function* sourceFiles(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return; // A root that does not exist yet is not a failure.
  }

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      yield* sourceFiles(path);
    } else if (extname(entry.name) === '.ts' || extname(entry.name) === '.tsx') {
      yield path;
    }
  }
}

/**
 * Replaces comment bodies with spaces, preserving line and column positions so
 * that a reported location still points at the offending word.
 */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (match) => ' '.repeat(match.length));
}

const violations = [];

for (const root of ROOTS) {
  for await (const file of sourceFiles(root)) {
    const source = stripComments(await readFile(file, 'utf8'));

    source.split('\n').forEach((line, index) => {
      const found = pattern.exec(splitIdentifiers(line));
      if (found !== null) {
        violations.push({
          file: relative(process.cwd(), file),
          line: index + 1,
          word: found[0],
        });
      }
    });
  }
}

if (violations.length > 0) {
  for (const { file, line, word } of violations) {
    process.stderr.write(`${file}:${line}  game vocabulary: ${word}\n`);
  }
  process.stderr.write(
    `\n${violations.length} violation(s). An engine that knows what a building is ` +
      `is a folder with one scenario in it, not an engine — see CLAUDE.md.\n`,
  );
  process.exitCode = 1;
} else {
  process.stdout.write('contour boundaries clean\n');
}
