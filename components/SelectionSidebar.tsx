import React, { useMemo, useState } from 'react';
import { Check, ClipboardCopy, ListChecks, PackageCheck, Terminal, Trash2, X } from 'lucide-react';
import { WingetPackage } from '../types';
import { Button } from './Button';

interface SelectionSidebarProps {
  packages: WingetPackage[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

const buildInstallCommand = (id: string) =>
  `winget install --id "${id}" --exact --source winget --accept-package-agreements --accept-source-agreements`;

export const SelectionSidebar: React.FC<SelectionSidebarProps> = ({ packages, onRemove, onClear }) => {
  const [copied, setCopied] = useState(false);

  const installCommands = useMemo(
    () => packages.map(pkg => buildInstallCommand(pkg.id)).join('\r\n'),
    [packages]
  );

  const handleCopy = async () => {
    if (!installCommands) return;
    await navigator.clipboard.writeText(installCommands);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside
      id="install-list"
      className="lg:sticky lg:top-6 rounded-2xl border border-border bg-white shadow-lg overflow-hidden scroll-mt-6"
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

          {packages.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Clear installation list"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {packages.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto mb-4">
            <PackageCheck className="w-7 h-7" strokeWidth={1.5} />
          </div>
          <p className="font-semibold text-foreground mb-1">Your list is empty</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Add packages with the + button. They will appear here immediately.
          </p>
        </div>
      ) : (
        <>
          <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
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
                PowerShell command
              </div>
              <pre className="max-h-32 overflow-auto rounded-xl bg-slate-950 p-3 text-[10px] leading-relaxed text-blue-200 whitespace-pre-wrap break-all">
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
              {copied ? 'Commands copied' : 'Copy install commands'}
            </Button>
          </div>
        </>
      )}
    </aside>
  );
};
