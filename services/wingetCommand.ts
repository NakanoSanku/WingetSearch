import type { SelectedWingetPackage, WingetCommandOptions } from '../types';

export const DEFAULT_WINGET_COMMAND_OPTIONS: WingetCommandOptions = {
  installMode: 'default',
  scope: '',
  architecture: '',
  installerType: '',
  locale: '',
  location: '',
  log: '',
  acceptPackageAgreements: true,
  acceptSourceAgreements: true,
  noUpgrade: false,
  force: false,
  disableInteractivity: false,
  allowReboot: false,
  skipDependencies: false,
  ignoreSecurityHash: false,
};

interface WingetArgument {
  flag: string;
  value?: string;
}

const escapePowerShellDoubleQuotedValue = (value: string) =>
  value.replace(/`/g, '``').replace(/\$/g, '`$').replace(/"/g, '`"');

const quotePowerShellValue = (value: string) =>
  `"${escapePowerShellDoubleQuotedValue(value)}"`;

const quotePowerShellLiteral = (value: string) =>
  `'${value.replace(/'/g, "''")}'`;

const buildOptionArguments = (
  options: WingetCommandOptions,
  version?: string,
): WingetArgument[] => {
  const argumentsList: WingetArgument[] = [];
  const normalizedVersion = version?.trim();

  if (normalizedVersion) argumentsList.push({ flag: '--version', value: normalizedVersion });
  if (options.scope) argumentsList.push({ flag: '--scope', value: options.scope });
  if (options.architecture) argumentsList.push({ flag: '--architecture', value: options.architecture });
  if (options.installerType.trim()) argumentsList.push({ flag: '--installer-type', value: options.installerType.trim() });
  if (options.locale.trim()) argumentsList.push({ flag: '--locale', value: options.locale.trim() });
  if (options.location.trim()) argumentsList.push({ flag: '--location', value: options.location.trim() });
  if (options.log.trim()) argumentsList.push({ flag: '--log', value: options.log.trim() });

  if (options.installMode === 'silent') argumentsList.push({ flag: '--silent' });
  if (options.installMode === 'interactive') argumentsList.push({ flag: '--interactive' });
  if (options.acceptPackageAgreements) argumentsList.push({ flag: '--accept-package-agreements' });
  if (options.acceptSourceAgreements) argumentsList.push({ flag: '--accept-source-agreements' });
  if (options.noUpgrade) argumentsList.push({ flag: '--no-upgrade' });
  if (options.force) argumentsList.push({ flag: '--force' });
  if (options.disableInteractivity && options.installMode !== 'interactive') {
    argumentsList.push({ flag: '--disable-interactivity' });
  }
  if (options.allowReboot) argumentsList.push({ flag: '--allow-reboot' });
  if (options.skipDependencies) argumentsList.push({ flag: '--skip-dependencies' });
  if (options.ignoreSecurityHash) argumentsList.push({ flag: '--ignore-security-hash' });

  return argumentsList;
};

const renderSingleArgument = ({ flag, value }: WingetArgument) =>
  value === undefined ? flag : `${flag} ${quotePowerShellValue(value)}`;

const renderBatchArgumentLines = (argumentsList: WingetArgument[]) =>
  argumentsList.map(({ flag, value }) => value === undefined
    ? `  $wingetArgs += ${quotePowerShellLiteral(flag)}`
    : `  $wingetArgs += @(${quotePowerShellLiteral(flag)}, ${quotePowerShellLiteral(value)})`);

export const buildSingleInstallCommand = (
  packageId: string,
  selectedVersion: string,
  options: WingetCommandOptions,
) => {
  const baseCommand = `winget install --id ${quotePowerShellValue(packageId)} --exact --source winget`;
  const optionArguments = buildOptionArguments(options, selectedVersion)
    .map(renderSingleArgument)
    .join(' ');

  return optionArguments ? `${baseCommand} ${optionArguments}` : baseCommand;
};

export const buildBatchInstallCommand = (
  packages: SelectedWingetPackage[],
  options: WingetCommandOptions,
) => {
  const packageEntries = packages
    .map(pkg => `  [pscustomobject]@{ Id = ${quotePowerShellLiteral(pkg.id)}; Version = ${pkg.selectedVersion.trim() ? quotePowerShellLiteral(pkg.selectedVersion.trim()) : '$null'} }`)
    .join('\n');

  const staticOptionLines = renderBatchArgumentLines(buildOptionArguments(options));

  return [
    '@(',
    packageEntries,
    ') | ForEach-Object {',
    '  $wingetArgs = @(',
    "    '--id'",
    '    $_.Id',
    "    '--exact'",
    "    '--source'",
    "    'winget'",
    '  )',
    '  if ($_.Version) {',
    "    $wingetArgs += @('--version', $_.Version)",
    '  }',
    ...staticOptionLines,
    '  & winget install @wingetArgs',
    '}',
  ].join('\n');
};
