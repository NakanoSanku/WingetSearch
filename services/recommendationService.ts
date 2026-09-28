import type { RecommendationList, RecommendationPackage, SelectedWingetPackage, WingetPackage } from '../types';

export const RECOMMENDATION_FORMAT = 'winget-search-recommendations';
export const MAX_RECOMMENDATION_BYTES = 1024 * 1024;
export const MAX_RECOMMENDATION_PACKAGES = 200;
export const RECOMMENDATION_LIMITS = { title: 120, author: 100, description: 2000, reason: 1000 };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readText = (value: unknown, field: string, maxLength: number, required = false): string | undefined => {
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'string') throw new Error(`${field} must be text.`);
  const text = value.trim();
  if (!text && required) throw new Error(`${field} cannot be empty.`);
  if (text.length > maxLength) throw new Error(`${field} must be ${maxLength} characters or fewer.`);
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(text)) {
    throw new Error(`${field} contains unsupported control characters.`);
  }
  return text || undefined;
};

export const parseRecommendationList = (json: string): { list: RecommendationList; warnings: string[] } => {
  if (new TextEncoder().encode(json).byteLength > MAX_RECOMMENDATION_BYTES) {
    throw new Error('This file is too large. Choose a recommendation JSON file up to 1 MB.');
  }

  let data: unknown;
  try {
    data = JSON.parse(json.replace(/^\uFEFF/, ''));
  } catch {
    throw new Error('This file is not valid JSON. Choose a file exported by Winget Search.');
  }
  if (!isRecord(data) || data.format !== RECOMMENDATION_FORMAT) {
    throw new Error('Unsupported file format. Choose a recommendation JSON file exported by Winget Search.');
  }
  if (data.schemaVersion !== 1) {
    throw new Error('This recommendation format version is not supported. Try a newer version of Winget Search.');
  }
  if (!Array.isArray(data.packages) || data.packages.length === 0) {
    throw new Error('The recommendation list must contain at least one package.');
  }
  if (data.packages.length > MAX_RECOMMENDATION_PACKAGES) {
    throw new Error(`A recommendation list can contain up to ${MAX_RECOMMENDATION_PACKAGES} packages.`);
  }

  const title = readText(data.title, 'List title', RECOMMENDATION_LIMITS.title, true)!;
  const author = readText(data.author, 'Author', RECOMMENDATION_LIMITS.author);
  const description = readText(data.description, 'Description', RECOMMENDATION_LIMITS.description);
  const createdAt = readText(data.createdAt, 'Creation date', 40, true)!;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(createdAt) || !Number.isFinite(Date.parse(createdAt))) {
    throw new Error('The creation date must be a valid UTC timestamp.');
  }

  const seen = new Set<string>();
  const warnings: string[] = [];
  const packages: RecommendationPackage[] = [];
  data.packages.forEach((entry: unknown, index: number) => {
    const label = `Package ${index + 1}`;
    if (!isRecord(entry)) throw new Error(`${label} must be an object.`);
    const id = readText(entry.id, `${label} ID`, 128, true)!;
    // Package IDs are opaque identifiers, never commands or URLs.
    if (!/^[^\s\\/:*?"<>|\u0000-\u001F]+\.[^\s\\/:*?"<>|\u0000-\u001F]+$/u.test(id)) {
      throw new Error(`${label} has an invalid WinGet package ID.`);
    }
    const name = readText(entry.name, `${label} name`, 256);
    const version = readText(entry.version, `${label} version`, 128);
    if (version && /[\r\n\t]/.test(version)) throw new Error(`${label} version must be a single line.`);
    const reason = readText(entry.reason, `${label} recommendation reason`, RECOMMENDATION_LIMITS.reason);
    const key = id.toLowerCase();
    if (seen.has(key)) {
      warnings.push(`Duplicate package ${id} was skipped; its first entry was kept.`);
      return;
    }
    seen.add(key);
    packages.push({ id, ...(name && { name }), ...(version && { version }), ...(reason && { reason }) });
  });

  return {
    list: {
      format: RECOMMENDATION_FORMAT,
      schemaVersion: 1,
      title,
      ...(author && { author }),
      ...(description && { description }),
      createdAt,
      packages,
    },
    warnings,
  };
};

export const createRecommendationList = (packages: SelectedWingetPackage[]): RecommendationList => ({
  format: RECOMMENDATION_FORMAT,
  schemaVersion: 1,
  title: 'My software recommendations',
  createdAt: new Date().toISOString(),
  packages: packages.map(pkg => ({ id: pkg.id, ...(pkg.name && { name: pkg.name }) })),
});

export const serializeRecommendationList = (list: RecommendationList): string => {
  // Run authored lists through the same contract as imported files.
  const validated = parseRecommendationList(JSON.stringify(list)).list;
  return `${JSON.stringify(validated, null, 2)}\n`;
};

export const recommendationFileName = (title: string): string => {
  const stem = title.normalize('NFKC').replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-').replace(/[.\s]+$/g, '').trim().slice(0, 80);
  return `winget-${stem || 'recommendations'}.json`;
};

export const getPackageVersions = (pkg: WingetPackage): string[] =>
  [...new Set([pkg.version, ...(pkg.versions ?? [])].filter(Boolean))];

export interface ResolvedRecommendation {
  entry: RecommendationPackage;
  pkg?: WingetPackage;
  selectedVersion: string;
  status: 'available' | 'missing-package' | 'missing-version';
}

export const resolveRecommendations = (
  list: RecommendationList,
  packages: WingetPackage[],
  versionOverrides: Record<string, string> = {},
): ResolvedRecommendation[] => {
  const byId = new Map(packages.map(pkg => [pkg.id.toLowerCase(), pkg]));
  return list.packages.map(entry => {
    const pkg = byId.get(entry.id.toLowerCase());
    const selectedVersion = Object.hasOwn(versionOverrides, entry.id) ? versionOverrides[entry.id] : entry.version ?? '';
    const status = !pkg ? 'missing-package'
      : selectedVersion && !getPackageVersions(pkg).includes(selectedVersion) ? 'missing-version'
        : 'available';
    return { entry, pkg, selectedVersion, status };
  });
};

export const selectRecommendations = (
  entries: ResolvedRecommendation[],
  selectedIds: ReadonlySet<string>,
  existingIds: ReadonlySet<string>,
): SelectedWingetPackage[] => {
  const existing = new Set(Array.from(existingIds, id => id.toLowerCase()));
  return entries.flatMap(({ entry, pkg, selectedVersion, status }) => {
    if (!selectedIds.has(entry.id) || !pkg || status !== 'available' || existing.has(pkg.id.toLowerCase())) return [];
    existing.add(pkg.id.toLowerCase());
    return [{ ...pkg, selectedVersion }];
  });
};
