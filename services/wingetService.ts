import { WingetPackage } from "../types";

const CSV_URL = 'https://cdn.jsdelivr.net/gh/svrooij/winget-pkgs-index@main/index.csv';

export const fetchPackages = async (): Promise<WingetPackage[]> => {
  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error("Error fetching packages:", error);
    throw error;
  }
};

const parseCSV = (csvText: string): WingetPackage[] => {
  const lines = csvText.split('\n');
  const packages: WingetPackage[] = [];

  // Start from 1 to skip header "PackageId","Version"
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Basic CSV regex for "Val1","Val2" format
    // This is performant enough for simple structured data like this specific file
    const match = line.match(/^"(.+)","(.+)"$/);
    
    if (match && match.length === 3) {
      packages.push({
        id: match[1],
        version: match[2]
      });
    }
  }

  return packages;
};
