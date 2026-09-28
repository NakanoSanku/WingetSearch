import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { RecommendationList, WingetPackage } from '../types.ts';
import {
  createRecommendationList, MAX_RECOMMENDATION_BYTES, MAX_RECOMMENDATION_PACKAGES,
  parseRecommendationList, recommendationFileName, resolveRecommendations,
  selectRecommendations, serializeRecommendationList,
} from './recommendationService.ts';
import { buildBatchInstallCommand, buildSingleInstallCommand, DEFAULT_WINGET_COMMAND_OPTIONS } from './wingetCommand.ts';

const catalog: WingetPackage[] = [
  { id: 'Git.Git', name: 'Git', version: '2.50.0', versions: ['2.50.0', '2.49.0'] },
  { id: 'Microsoft.VisualStudioCode', name: 'Visual Studio Code', version: '1.100.0' },
];

const example = (): RecommendationList => ({
  format: 'winget-search-recommendations',
  schemaVersion: 1,
  title: '开发工具推荐',
  author: '社区作者',
  description: '给新电脑的软件清单',
  createdAt: '2026-09-28T00:00:00.000Z',
  packages: [
    { id: 'Git.Git', name: 'Git', version: '2.49.0', reason: '方便管理代码\n团队协作' },
    { id: 'Microsoft.VisualStudioCode' },
  ],
});

test('Unicode metadata, optional reasons and pinned versions survive a file round trip', () => {
  const list = example();
  assert.deepEqual(parseRecommendationList(serializeRecommendationList(list)), { list, warnings: [] });
});

test('new lists recommend latest even when installation selections are pinned', () => {
  const list = createRecommendationList([{ ...catalog[0], selectedVersion: '2.49.0' }]);
  assert.equal(list.packages[0].version, undefined);
  list.packages[0].version = '2.49.0';
  assert.equal(parseRecommendationList(serializeRecommendationList(list)).list.packages[0].version, '2.49.0');
});

test('BOM and blank optional values are accepted and normalized', () => {
  const list = { ...example(), title: '  工具  ', author: ' ', description: '' };
  const parsed = parseRecommendationList(`\uFEFF${JSON.stringify(list)}`).list;
  assert.equal(parsed.title, '工具');
  assert.equal(parsed.author, undefined);
  assert.equal(parsed.description, undefined);
});

test('duplicate IDs are matched without case sensitivity and reported; first version and reason win', () => {
  const list = example();
  list.packages.push({ id: 'git.git', version: '0.0', reason: 'duplicate' });
  const result = parseRecommendationList(JSON.stringify(list));
  assert.equal(result.list.packages.length, 2);
  assert.equal(result.list.packages[0].version, '2.49.0');
  assert.equal(result.warnings.length, 1);
});

test('unknown fields cannot carry commands, sources or machine options into an exported list', () => {
  const source = example();
  const list = parseRecommendationList(JSON.stringify({
    ...source, command: 'arbitrary script', options: { ignoreSecurityHash: true },
    packages: source.packages.map(pkg => ({ ...pkg, source: 'custom', script: 'arbitrary script', iconUrl: 'https://untrusted.example/tracker' })),
  })).list;
  assert.deepEqual(list, source);
  const script = buildBatchInstallCommand(selectRecommendations(resolveRecommendations(list, catalog), new Set(['Git.Git']), new Set()), DEFAULT_WINGET_COMMAND_OPTIONS);
  assert.doesNotMatch(script, /arbitrary|'custom'|untrusted|ignore-security-hash/);
});

test('invalid files fail with actionable errors', () => {
  const cases: Array<[unknown, RegExp]> = [
    [null, /Unsupported file format/],
    [[], /Unsupported file format/],
    [{ ...example(), format: 'winget' }, /Unsupported file format/],
    [{ ...example(), schemaVersion: 2 }, /format version/],
    [{ ...example(), title: ' ' }, /title cannot be empty/],
    [{ ...example(), title: 'x'.repeat(121) }, /120 characters/],
    [{ ...example(), author: 123 }, /Author must be text/],
    [{ ...example(), createdAt: 'invalid' }, /UTC timestamp/],
    [{ ...example(), packages: [] }, /at least one/],
    [{ ...example(), packages: [null] }, /must be an object/],
    [{ ...example(), packages: [{ id: 'https://example.com/file.exe' }] }, /invalid WinGet package ID/],
    [{ ...example(), packages: [{ id: 'Git.Git', reason: '<script>\u0000</script>' }] }, /control characters/],
    [{ ...example(), packages: [{ id: 'Git.Git', version: '1\n2' }] }, /single line/],
    [{ ...example(), packages: [{ id: 'Git.Git', reason: 'x'.repeat(1001) }] }, /1000 characters/],
  ];
  cases.forEach(([value, error]) => assert.throws(() => parseRecommendationList(JSON.stringify(value)), error));
  assert.throws(() => parseRecommendationList('{'), /not valid JSON/);
});

test('file size is limited by UTF-8 bytes and package count is bounded', () => {
  assert.throws(() => parseRecommendationList('中'.repeat(Math.ceil(MAX_RECOMMENDATION_BYTES / 3))), /too large/);
  const list = example();
  list.packages = Array.from({ length: MAX_RECOMMENDATION_PACKAGES + 1 }, (_, i) => ({ id: `Test.App${i}` }));
  assert.throws(() => parseRecommendationList(JSON.stringify(list)), /up to 200/);
  list.packages.pop();
  assert.equal(parseRecommendationList(JSON.stringify(list)).list.packages.length, MAX_RECOMMENDATION_PACKAGES);
});

test('missing packages stay visible but cannot enter an installation command', () => {
  const list = example();
  list.packages.push({ id: 'Missing.App', reason: 'Retired package' });
  const resolved = resolveRecommendations(list, catalog);
  assert.equal(resolved[2].status, 'missing-package');
  const selected = selectRecommendations(resolved, new Set(['Missing.App', 'Git.Git']), new Set());
  assert.deepEqual(selected.map(pkg => pkg.id), ['Git.Git']);
});

test('unavailable pinned versions require an explicit override before selection', () => {
  const list = example();
  list.packages[0].version = '0.0';
  const requested = new Set(['Git.Git']);
  const unavailable = resolveRecommendations(list, catalog);
  assert.equal(unavailable[0].status, 'missing-version');
  assert.deepEqual(selectRecommendations(unavailable, requested, new Set()), []);
  const latest = resolveRecommendations(list, catalog, { 'Git.Git': '' });
  assert.equal(selectRecommendations(latest, requested, new Set())[0].selectedVersion, '');
  const pinned = resolveRecommendations(list, catalog, { 'Git.Git': '2.49.0' });
  assert.equal(selectRecommendations(pinned, requested, new Set())[0].selectedVersion, '2.49.0');
  assert.equal(list.packages[0].version, '0.0', 'recipient choices must not rewrite the original shared file');
});

test('only checked, available, new packages are added with canonical index identity', () => {
  const list = example();
  list.packages[0].id = 'git.git';
  const resolved = resolveRecommendations(list, catalog);
  assert.deepEqual(selectRecommendations(resolved, new Set(), new Set()), []);
  assert.deepEqual(selectRecommendations(resolved, new Set(['git.git', 'Microsoft.VisualStudioCode']), new Set(['GIT.GIT'])).map(pkg => pkg.id), ['Microsoft.VisualStudioCode']);
  const selected = selectRecommendations(resolved, new Set(['git.git']), new Set());
  assert.equal(selected[0].id, 'Git.Git');
  const command = buildBatchInstallCommand(selected, DEFAULT_WINGET_COMMAND_OPTIONS);
  assert.match(command, /Id = 'Git.Git'; Version = '2.49.0'/);
  assert.doesNotMatch(command, /VisualStudioCode|方便|社区/);
});

test('PowerShell single and batch commands preserve metacharacters as literal argument values', () => {
  const maliciousVersion = '1.$(Write-Output "injected")`test';
  const single = buildSingleInstallCommand('Test.App', maliciousVersion, DEFAULT_WINGET_COMMAND_OPTIONS);
  assert.ok(single.includes('1.`$(Write-Output `"injected`")``test'));
  const batch = buildBatchInstallCommand([{ id: 'Test.App', version: 'latest', selectedVersion: "1.'; Write-Output 'injected" }], DEFAULT_WINGET_COMMAND_OPTIONS);
  assert.ok(batch.includes("Version = '1.''; Write-Output ''injected'"));
});

test('download names retain Unicode but remove path and Windows filename characters', () => {
  assert.equal(recommendationFileName('社区:开发/工具'), 'winget-社区-开发-工具.json');
  assert.equal(recommendationFileName('... '), 'winget-recommendations.json');
  assert.equal(recommendationFileName('CON'), 'winget-CON.json');
});
