import { WingetPackage } from "../types";

const INDEX_URL = 'https://cdn.jsdelivr.net/gh/svrooij/winget-pkgs-index@main/index.v2.json';

interface WingetIndexEntry {
  Name?: unknown;
  PackageId?: unknown;
  Version?: unknown;
  Tags?: unknown;
  LastUpdate?: unknown;
}

export const fetchPackages = async (): Promise<WingetPackage[]> => {
  try {
    const response = await fetch(INDEX_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data: unknown = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Invalid Winget index format: expected an array.');
    }

    return data.flatMap((entry: WingetIndexEntry): WingetPackage[] => {
      if (typeof entry.PackageId !== 'string' || typeof entry.Version !== 'string') {
        return [];
      }

      return [{
        id: entry.PackageId,
        version: entry.Version,
        name: typeof entry.Name === 'string' ? entry.Name : undefined,
        tags: Array.isArray(entry.Tags)
          ? entry.Tags.filter((tag): tag is string => typeof tag === 'string')
          : [],
        lastUpdate: typeof entry.LastUpdate === 'string' ? entry.LastUpdate : undefined,
      }];
    });
  } catch (error) {
    console.error("Error fetching packages:", error);
    throw error;
  }
};
