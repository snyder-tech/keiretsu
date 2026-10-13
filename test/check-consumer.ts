#!/usr/bin/env bun
/**
 * @description Qualifies an actual npm tarball in an isolated consumer: every public
 *              declaration, Node ESM imports, strict NodeNext/Bundler types and browser bundling.
 * @usage bun check-consumer.ts --package <artifact> --effect <version> --typescript <version> --esbuild <version> [--dry-run] [--verbose] [--help]
 * @exitCodes 0=qualified, 1=qualification failure, 2=invalid arguments
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const options = new Map<string, string>();
const switches = new Set(['--dry-run', '--verbose', '--help']);
const valued = new Set(['--package', '--effect', '--typescript', '--esbuild']);
const badArgs = (message: string): never => {
  console.error(`${message}; use --help`);
  process.exit(2);
};
for (let index = 0; index < args.length; index += 1) {
  const key = args[index];
  if (key !== undefined && switches.has(key)) options.set(key, 'true');
  else if (key !== undefined && valued.has(key) && args[index + 1] !== undefined && !args[index + 1]?.startsWith('--')) options.set(key, args[++index] ?? '');
  else badArgs(`Invalid argument ${key ?? ''}`);
}
if (options.has('--help')) {
  console.log(
    'Qualify a packed SDK using explicit release toolchain versions. Never publishes.\n--package <artifact> --effect <version> --typescript <version> --esbuild <version>\n--dry-run prints the scope without packing/installing; --verbose prints command output.',
  );
  process.exit(0);
}
const required = (name: string): string => {
  const value = options.get(name);
  if (value === undefined) return badArgs(`Missing ${name}`);
  return value;
};
const packageRoot = resolve(required('--package'));
const effect = required('--effect');
const typescript = required('--typescript');
const esbuild = required('--esbuild');
for (const version of [effect, typescript, esbuild]) {
  if (!/^[\w@./:^~+<>=|-]+$/.test(version)) badArgs('Invalid release toolchain version');
}
if (options.has('--dry-run')) {
  console.log(`Packed consumer: Node ESM, NodeNext, Bundler, browser; effect ${effect}; TypeScript ${typescript}; esbuild ${esbuild}`);
  process.exit(0);
}

const run = (command: string, argv: ReadonlyArray<string>, cwd: string): string => {
  let executable = command;
  let arguments_ = [...argv];
  if (command === 'npm' && process.platform === 'win32') {
    const node = spawnSync('node', ['-p', 'process.execPath'], { encoding: 'utf8' });
    if (node.status !== 0) throw new Error('Node is required for Windows npm qualification');
    const npmCli = join(dirname(node.stdout.trim()), 'node_modules', 'npm', 'bin', 'npm-cli.js');
    if (!existsSync(npmCli)) throw new Error('npm-cli.js must be installed beside Node for Windows qualification');
    executable = 'node';
    arguments_ = [npmCli, ...argv];
  }
  const result = spawnSync(executable, arguments_, { cwd, encoding: 'utf8', timeout: 180_000 });
  if (result.error !== undefined || result.status !== 0) throw new Error(`${command} ${argv.join(' ')}\n${result.error?.message ?? ''}\n${result.stdout ?? ''}${result.stderr ?? ''}`);
  if (options.has('--verbose') && command !== 'npm') console.log(result.stdout.slice(0, 4000));
  return result.stdout;
};

const temporary = mkdtempSync(join(tmpdir(), 'keiretsu-consumer-'));
try {
  const packed: unknown = JSON.parse(run('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', temporary], packageRoot));
  const pack = Array.isArray(packed) ? packed[0] : undefined;
  if (typeof pack !== 'object' || pack === null || !('filename' in pack) || typeof pack.filename !== 'string' || /[/\\]/.test(pack.filename))
    throw new Error('npm pack did not return a tarball filename');
  writeFileSync(join(temporary, 'package.json'), JSON.stringify({ name: 'keiretsu-consumer', private: true, type: 'module' }));
  // The consumer is public npm, including scopes used by compiler/bundler
  // dependencies. Project config takes precedence over developer scope routing.
  writeFileSync(
    join(temporary, '.npmrc'),
    'registry=https://registry.npmjs.org/\n@typescript:registry=https://registry.npmjs.org/\n@esbuild:registry=https://registry.npmjs.org/\n@snyder-tech:registry=https://registry.npmjs.org/\n',
  );
  run(
    'npm',
    [
      'install',
      '--registry=https://registry.npmjs.org/',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--package-lock=false',
      join(temporary, pack.filename),
      `effect@${effect}`,
      `typescript@${typescript}`,
      `esbuild@${esbuild}`,
    ],
    temporary,
  );
  const compilerRoot = join(temporary, 'node_modules', 'typescript');
  const compilerManifest: unknown = JSON.parse(readFileSync(join(compilerRoot, 'package.json'), 'utf8'));
  if (typeof compilerManifest !== 'object' || compilerManifest === null || !('bin' in compilerManifest) || typeof compilerManifest.bin !== 'object' || compilerManifest.bin === null)
    throw new Error('TypeScript compiler has no executable');
  const compilerBin = 'tsc' in compilerManifest.bin ? compilerManifest.bin.tsc : 'tsc6' in compilerManifest.bin ? compilerManifest.bin.tsc6 : undefined;
  if (typeof compilerBin !== 'string' || compilerBin.includes('..') || !existsSync(join(compilerRoot, compilerBin))) throw new Error('TypeScript compiler executable is unavailable');
  const installed = join(temporary, 'node_modules', '@snyder-tech', 'keiretsu');
  const manifest: unknown = JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8'));
  if (typeof manifest !== 'object' || manifest === null || !('exports' in manifest) || typeof manifest.exports !== 'object' || manifest.exports === null)
    throw new Error('Packed SDK has no export map');
  const exports = Object.entries(manifest.exports).filter(([key]) => key !== './package.json');
  const modules = exports.map(([key, entry]) => {
    if (typeof entry !== 'object' || entry === null || !('types' in entry) || !('default' in entry) || typeof entry.types !== 'string' || typeof entry.default !== 'string')
      throw new Error(`Missing types/runtime export for ${key}`);
    if (!entry.types.endsWith('.d.ts') || !entry.default.endsWith('.js') || !existsSync(join(installed, entry.types)) || !existsSync(join(installed, entry.default)))
      throw new Error(`Missing packed output for ${key}`);
    if (key.includes('/internal/') || key.includes('*')) throw new Error(`Unreviewed public export ${key}`);
    return `@snyder-tech/keiretsu/${key.slice(2)}`;
  });
  copyFileSync(join(dirname(fileURLToPath(import.meta.url)), 'consumer.ts'), join(temporary, 'consumer.ts'));
  writeFileSync(
    join(temporary, 'all-modules.ts'),
    `${modules.map((specifier, index) => `import type * as M${index} from ${JSON.stringify(specifier)};\nexport type Module${index} = typeof M${index};`).join('\n')}\n`,
  );
  writeFileSync(
    join(temporary, 'blocked.ts'),
    "// @ts-expect-error the root barrel is deliberately not exported\nimport type * as Root from '@snyder-tech/keiretsu';\n// @ts-expect-error internals are deliberately not exported\nimport type * as Internal from '@snyder-tech/keiretsu/core/internal/StrictJson';\nexport type Blocked = [typeof Root, typeof Internal];\n",
  );
  const common = {
    target: 'ES2022',
    lib: ['ES2022', 'DOM', 'ESNext.Disposable'],
    types: [],
    strict: true,
    exactOptionalPropertyTypes: true,
    noUncheckedIndexedAccess: true,
    noPropertyAccessFromIndexSignature: true,
    verbatimModuleSyntax: true,
    skipLibCheck: false,
  };
  for (const mode of ['NodeNext', 'Bundler']) {
    const config = {
      compilerOptions: { ...common, module: mode === 'NodeNext' ? 'NodeNext' : 'ESNext', moduleResolution: mode, ...(mode === 'NodeNext' ? { outDir: 'compiled' } : { noEmit: true }) },
      include: ['consumer.ts', 'all-modules.ts', 'blocked.ts'],
    };
    const configName = `tsconfig.${mode}.json`;
    writeFileSync(join(temporary, configName), JSON.stringify(config));
    run('node', [join(compilerRoot, compilerBin), '-p', configName], temporary);
  }
  run('node', ['compiled/consumer.js'], temporary);
  writeFileSync(
    join(temporary, 'runtime.mjs'),
    `import assert from 'node:assert/strict';\nfor (const module of ${JSON.stringify(modules)}) await import(module);\nfor (const module of ['@snyder-tech/keiretsu', '@snyder-tech/keiretsu/core/internal/StrictJson']) await assert.rejects(import(module), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });\n`,
  );
  run('node', ['runtime.mjs'], temporary);
  run(
    'node',
    [
      '--input-type=module',
      '-e',
      "import { build } from 'esbuild'; import { writeFileSync } from 'node:fs'; const result = await build({ entryPoints: ['consumer.ts'], bundle: true, platform: 'browser', format: 'esm', target: 'es2022', treeShaking: true, outfile: 'browser.mjs', metafile: true }); writeFileSync('browser-meta.json', JSON.stringify(result.metafile));",
    ],
    temporary,
  );
  // The browser artifact also runs in a web-compatible Node host. A missing
  // import or accidental external dependency fails here rather than being hidden.
  run('node', ['browser.mjs'], temporary);
  const metadata = readFileSync(join(temporary, 'browser-meta.json'), 'utf8');
  if (/node_modules\/@snyder-tech\/keiretsu\/dist\/(finance|tax-incentives|exchange)\//.test(metadata)) throw new Error('Core/entity consumer pulled unrelated SDK areas into its browser bundle');
  console.log(`✓ packed SDK consumer: ${modules.length} modules; Node ESM; strict NodeNext/Bundler; brand/key rejection; browser bundle`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
