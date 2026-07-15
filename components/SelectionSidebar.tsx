import React, { useMemo, useState } from 'react';
import { Check, ClipboardCopy, ListChecks, PanelRightClose, Terminal, Trash2, X } from 'lucide-react';
import { WingetPackage } from '../types';
import { Button } from './Button';

interface SelectionSidebarProps {
  packages: WingetPackage[];
  isOpen: boolean;
  onClose: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

const buildInstallCommand = (packages: WingetPackage[]) => {
  const packageList = packages
    .map(pkg => `"${pkg.id.replace(/"/g, '`"')}"`)
    .join(', ');

  return `@(${packageList}) | ForEach-Object { winget install --id $_ --exact --source winget --accept-package-agreements --accept-source-agreements }`;
};

export const SelectionSidebar: React.FC<SelectionSidebarProps> = ({ packages, isOpen, onClose, onRemove, onClear }) => {
  const [copied, setCopied] = useState(false);

  const installCommands = useMemo(
    () => buildInstallCommand(packages),
    [packages]
  );

  const handleCopy = async () => {
    if (!installCommands) return;
    await navigator.clipboard.writeText(installCommands);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || packages.length === 0) return null;

  return (
    <aside
      id="install-list"
      className="fixed z-50 top-20 right-4 sm:top-24 sm:right-6 w-[calc(100vw-2rem)] sm:w-[360px] max-h-[calc(100vh-6rem)] rounded-2xl border border-border bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden"
      aria-label="Current installation list"
    >
      <div className="bg-foreground text-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-[0_0_18px_rgba(0,82,255,0.35)]">
              <ListChecks className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display text-xl">Install List</p>
              <p className="text-xs text-white/60" aria-live="polite">
                {packages.length === 0 ? 'No packages selected' : `${packages.length} package${packages.length === 1 ? '' : 's'} selected`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onClear}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Clear installation list"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Minimize installation list"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-h-[34vh] overflow-y-auto divide-y divide-border">
            {packages.map((pkg, index) => (
              <div key={pkg.id} className="group flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors">
                <span className="font-mono text-[10px] text-muted-foreground pt-1 w-5 shrink-0">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground break-all leading-snug">{pkg.id}</p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-1">v{pkg.version}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(pkg.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                  title={`Remove ${pkg.id}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
      </div>

      <div className="p-4 border-t border-border bg-muted/20 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Terminal className="w-3.5 h-3.5 text-accent" />
                PowerShell one-liner
              </div>
              <pre className="overflow-x-auto rounded-xl bg-slate-950 p-3 text-[10px] leading-relaxed text-blue-200 whitespace-pre">
                {installCommands}
              </pre>
            </div>

            <Button
              type="button"
              variant="primary"
              className="w-full"
              onClick={handleCopy}
              icon={copied ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />}
            >
              {copied ? 'Command copied' : 'Copy command'}
            </Button>
      </div>
    </aside>
  );
};
