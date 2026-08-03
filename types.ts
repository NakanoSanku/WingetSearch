export interface WingetPackage {
  id: string;
  version: string;
  versions?: string[];
  name?: string;
  moniker?: string;
  iconUrl?: string;
  iconSource?: string;
  packageUrl?: string;
  publisherUrl?: string;
  tags?: string[];
  lastUpdate?: string;
}

export type WingetInstallMode = 'default' | 'silent' | 'interactive';

export interface WingetCommandOptions {
  installMode: WingetInstallMode;
  scope: '' | 'user' | 'machine';
  architecture: '' | 'x86' | 'x64' | 'arm' | 'arm64' | 'neutral';
  installerType: string;
  locale: string;
  location: string;
  log: string;
  acceptPackageAgreements: boolean;
  acceptSourceAgreements: boolean;
  noUpgrade: boolean;
  force: boolean;
  disableInteractivity: boolean;
  allowReboot: boolean;
  skipDependencies: boolean;
  ignoreSecurityHash: boolean;
}

export interface SelectedWingetPackage extends WingetPackage {
  selectedVersion: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
