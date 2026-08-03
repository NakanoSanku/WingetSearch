import React from 'react';
import { RotateCcw, Settings2, ShieldCheck, Terminal } from 'lucide-react';
import { WingetCommandOptions, WingetInstallMode } from '../types';
import { DEFAULT_WINGET_COMMAND_OPTIONS } from '../services/wingetCommand';
import { Button } from './Button';

interface CommandOptionsPanelProps {
  options: WingetCommandOptions;
  isOpen: boolean;
  onToggle: () => void;
  onChange: (options: WingetCommandOptions) => void;
  onReset: () => void;
}

const installerTypes = [
  'appx',
  'burn',
  'exe',
  'font',
  'inno',
  'msi',
  'msix',
  'msstore',
  'nullsoft',
  'portable',
  'wix',
  'zip',
];

const installModes: Array<{ value: WingetInstallMode; label: string; description: string }> = [
  { value: 'default', label: 'Default', description: 'Normal installer UI' },
  { value: 'silent', label: 'Silent', description: 'No installer UI' },
  { value: 'interactive', label: 'Interactive', description: 'Show installer UI' },
];

const fieldClassName = 'h-11 w-full rounded-lg border border-border bg-white px-3 font-mono text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:border-accent focus:ring-2 focus:ring-accent focus:ring-offset-2';
const selectClassName = `${fieldClassName} cursor-pointer`;

const hasCustomOptions = (options: WingetCommandOptions) =>
  (Object.keys(DEFAULT_WINGET_COMMAND_OPTIONS) as Array<keyof WingetCommandOptions>)
    .some(key => options[key] !== DEFAULT_WINGET_COMMAND_OPTIONS[key]);

interface ToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const OptionToggle: React.FC<ToggleProps> = ({ label, description, checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-white px-4 py-3 text-left transition-colors hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
  >
    <span className="min-w-0">
      <span className="block text-sm font-semibold text-foreground">{label}</span>
      <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{description}</span>
    </span>
    <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-slate-200'}`}>
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </span>
  </button>
);

export const CommandOptionsPanel: React.FC<CommandOptionsPanelProps> = ({
  options,
  isOpen,
  onToggle,
  onChange,
  onReset,
}) => {
  const isCustomized = hasCustomOptions(options);
  const updateOption = <K extends keyof WingetCommandOptions>(key: K, value: WingetCommandOptions[K]) => {
    onChange({ ...options, [key]: value });
  };

  const handleInstallModeChange = (installMode: WingetInstallMode) => {
    onChange({
      ...options,
      installMode,
      disableInteractivity: installMode === 'interactive' ? false : options.disableInteractivity,
    });
  };

  return (
    <section className="mb-10 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Settings2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl text-foreground">Command options</h2>
              {isCustomized && (
                <span className="rounded-full bg-accent/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
                  Customized
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Set the same WinGet options for single and batch commands.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant={isOpen ? 'primary' : 'secondary'}
          size="sm"
          onClick={onToggle}
          icon={<Settings2 className="h-4 w-4" />}
          aria-expanded={isOpen}
          aria-controls="command-options-panel"
        >
          {isOpen ? 'Hide options' : 'Customize'}
        </Button>
      </div>

      {isOpen && (
        <div id="command-options-panel" className="border-t border-border bg-muted/20 p-5 sm:p-6">
          <div className="space-y-6">
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-accent" />
                <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">Install mode</h3>
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                {installModes.map(mode => (
                  <button
                    key={mode.value}
                    type="button"
                    aria-pressed={options.installMode === mode.value}
                    onClick={() => handleInstallModeChange(mode.value)}
                    className={`rounded-xl border px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${options.installMode === mode.value ? 'border-accent bg-accent/5 shadow-sm' : 'border-border bg-white hover:border-accent/40'}`}
                  >
                    <span className="block text-sm font-semibold text-foreground">{mode.label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{mode.description}</span>
                    <span className="mt-2 block font-mono text-[10px] text-accent">
                      {mode.value === 'default' ? 'No mode flag' : `--${mode.value}`}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-accent" />
                <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">Package selection</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-foreground">Scope</span>
                  <select value={options.scope} onChange={event => updateOption('scope', event.target.value as WingetCommandOptions['scope'])} className={selectClassName}>
                    <option value="">Default</option>
                    <option value="user">User</option>
                    <option value="machine">Machine</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-foreground">Architecture</span>
                  <select value={options.architecture} onChange={event => updateOption('architecture', event.target.value as WingetCommandOptions['architecture'])} className={selectClassName}>
                    <option value="">Default</option>
                    <option value="x86">x86</option>
                    <option value="x64">x64</option>
                    <option value="arm">ARM</option>
                    <option value="arm64">ARM64</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-foreground">Installer type</span>
                  <select value={options.installerType} onChange={event => updateOption('installerType', event.target.value)} className={selectClassName}>
                    <option value="">Default</option>
                    {installerTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </label>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-accent" />
                <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">Locale and paths</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-foreground">Locale</span>
                  <input type="text" value={options.locale} onChange={event => updateOption('locale', event.target.value)} placeholder="e.g. en-US" spellCheck={false} className={fieldClassName} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-foreground">Install location</span>
                  <input type="text" value={options.location} onChange={event => updateOption('location', event.target.value)} placeholder="Optional path" spellCheck={false} className={fieldClassName} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-foreground">Log file</span>
                  <input type="text" value={options.log} onChange={event => updateOption('log', event.target.value)} placeholder="Optional path" spellCheck={false} className={fieldClassName} />
                </label>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent" />
                <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">Agreements and safety</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <OptionToggle label="Accept package agreements" description="Adds --accept-package-agreements" checked={options.acceptPackageAgreements} onChange={value => updateOption('acceptPackageAgreements', value)} />
                <OptionToggle label="Accept source agreements" description="Adds --accept-source-agreements" checked={options.acceptSourceAgreements} onChange={value => updateOption('acceptSourceAgreements', value)} />
                <OptionToggle label="No upgrade" description="Skip if an installed version already exists" checked={options.noUpgrade} onChange={value => updateOption('noUpgrade', value)} />
                <OptionToggle label="Force" description="Continue through non-security issues" checked={options.force} onChange={value => updateOption('force', value)} />
                <OptionToggle label="Disable interactivity" description="Suppress additional interactive prompts" checked={options.disableInteractivity} onChange={value => updateOption('disableInteractivity', options.installMode === 'interactive' ? false : value)} />
                <OptionToggle label="Allow reboot" description="Allow a reboot when applicable" checked={options.allowReboot} onChange={value => updateOption('allowReboot', value)} />
                <OptionToggle label="Skip dependencies" description="Skip package dependencies and Windows features" checked={options.skipDependencies} onChange={value => updateOption('skipDependencies', value)} />
                <OptionToggle label="Ignore security hash" description="Ignore installer hash failures" checked={options.ignoreSecurityHash} onChange={value => updateOption('ignoreSecurityHash', value)} />
              </div>
            </section>

            <div className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <Terminal className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p className="min-w-0 text-xs leading-relaxed text-muted-foreground">
                  Every generated command uses the long <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">--option</code> form. Review the command before running it in PowerShell.
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={onReset} icon={<RotateCcw className="h-3.5 w-3.5" />} className="shrink-0 self-end sm:self-start">
                Reset
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
