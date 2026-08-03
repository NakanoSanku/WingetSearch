import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Check, Terminal, Plus, Minus, Github, Globe2, ChevronDown } from 'lucide-react';
import { WingetCommandOptions, WingetPackage } from '../types';
import { Button } from './Button';
import { buildSingleInstallCommand } from '../services/wingetCommand';

interface PackageCardProps {
  pkg: WingetPackage;
  selectedVersion: string;
  onVersionChange: (id: string, version: string) => void;
  installOptions: WingetCommandOptions;
  isSelected?: boolean;
  onToggleBatch?: (id: string) => void;
}

const isGitHubUrl = (url: string) => {
  const hostname = new URL(url).hostname.toLowerCase();
  return hostname === 'github.com' || hostname.endsWith('.github.com');
};

const formatVersion = (version: string) => (
  version.toLowerCase().startsWith('v') ? version : `v${version}`
);

interface VersionSelectProps {
  id: string;
  packageName: string;
  latestVersion: string;
  availableVersions: string[];
  selectedVersion: string;
  onVersionChange: (version: string) => void;
}

const VersionSelect: React.FC<VersionSelectProps> = ({
  id,
  packageName,
  latestVersion,
  availableVersions,
  selectedVersion,
  onVersionChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [menuPlacement, setMenuPlacement] = useState<'down' | 'up'>('down');

  const options = useMemo(() => [
    {
      value: '',
      label: formatVersion(latestVersion),
    },
    ...availableVersions
      .filter(version => version.toLowerCase() !== latestVersion.toLowerCase())
      .map(version => ({
        value: version,
        label: formatVersion(version),
      })),
  ], [availableVersions, latestVersion]);

  const selectedIndex = Math.max(0, options.findIndex(option => option.value === selectedVersion));
  const triggerLabel = selectedVersion
    ? formatVersion(selectedVersion)
    : formatVersion(latestVersion);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      optionRefs.current[highlightedIndex]?.focus();
    }
  }, [highlightedIndex, isOpen]);

  const openMenu = () => {
    const triggerRect = triggerRef.current?.getBoundingClientRect();
    const estimatedMenuHeight = Math.min(options.length * 36 + 12, 232);
    const shouldOpenUp = Boolean(
      triggerRect
      && triggerRect.bottom + estimatedMenuHeight > window.innerHeight - 12
      && triggerRect.top > estimatedMenuHeight + 12,
    );

    setMenuPlacement(shouldOpenUp ? 'up' : 'down');
    setHighlightedIndex(selectedIndex);
    setIsOpen(true);
  };

  const closeMenu = (restoreFocus = false) => {
    setIsOpen(false);
    if (restoreFocus) {
      requestAnimationFrame(() => triggerRef.current?.focus());
    }
  };

  const chooseVersion = (version: string) => {
    onVersionChange(version);
    closeMenu(true);
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (isOpen) {
        setHighlightedIndex(event.key === 'ArrowUp'
          ? Math.max(0, highlightedIndex - 1)
          : Math.min(options.length - 1, highlightedIndex + 1));
      } else {
        openMenu();
      }
    }
  };

  const handleOptionKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex(Math.min(options.length - 1, index + 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex(Math.max(0, index - 1));
        break;
      case 'Home':
        event.preventDefault();
        setHighlightedIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setHighlightedIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        chooseVersion(options[index].value);
        break;
      case 'Escape':
        event.preventDefault();
        closeMenu(true);
        break;
      case 'Tab':
        closeMenu();
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`version-menu-${id}`}
        aria-label={`Select version for ${packageName}`}
        title={`Latest indexed version: ${latestVersion}`}
        onClick={() => (isOpen ? closeMenu() : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        className={`group/version flex w-fit min-w-[128px] max-w-[min(190px,52vw)] items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2 text-left font-mono text-xs font-medium outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen
            ? 'border-accent text-foreground ring-2 ring-accent/20 shadow-[0_10px_24px_rgba(0,82,255,0.12)]'
            : 'border-border text-muted-foreground hover:border-accent/50 hover:text-foreground'
        }`}
      >
        <span className="min-w-0 truncate">{triggerLabel}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'rotate-180 text-accent' : 'group-hover/version:text-foreground'}`} />
      </button>

      {isOpen && (
        <div
          id={`version-menu-${id}`}
          role="listbox"
          aria-label={`Available versions for ${packageName}`}
          className={`absolute right-0 z-30 w-[min(240px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border/90 bg-white p-1.5 shadow-[0_18px_44px_rgba(15,23,42,0.14)] ${
            menuPlacement === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          <div className="max-h-56 overflow-y-auto">
            {options.map((option, index) => {
              const isSelectedOption = option.value === selectedVersion;
              const isHighlighted = index === highlightedIndex;

              return (
                <button
                  key={option.value || 'latest'}
                  ref={element => { optionRefs.current[index] = element; }}
                  type="button"
                  role="option"
                  aria-selected={isSelectedOption}
                  tabIndex={isHighlighted ? 0 : -1}
                  onClick={() => chooseVersion(option.value)}
                  onKeyDown={event => handleOptionKeyDown(event, index)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left outline-none transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-inset ${
                    isHighlighted ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate font-mono text-xs font-medium">{option.label}</span>
                  <Check className={`h-3.5 w-3.5 shrink-0 text-accent transition-opacity ${isSelectedOption ? 'opacity-100' : 'opacity-0'}`} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const PackageCard: React.FC<PackageCardProps> = ({
  pkg,
  selectedVersion,
  onVersionChange,
  installOptions,
  isSelected = false,
  onToggleBatch,
}) => {
  const [copied, setCopied] = useState(false);
  const [showIcon, setShowIcon] = useState(Boolean(pkg.iconUrl));
  const installCommand = buildSingleInstallCommand(pkg.id, selectedVersion, installOptions);
  const packageLink = pkg.packageUrl ?? pkg.publisherUrl;
  const packageLinkIsGitHub = packageLink ? isGitHubUrl(packageLink) : false;
  const packageLinkLabel = packageLinkIsGitHub ? 'Open GitHub project' : 'Open website';
  const availableVersions = useMemo(() => {
    const seen = new Set<string>();
    return [pkg.version, ...(pkg.versions ?? [])].filter(version => {
      const normalized = version.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }, [pkg.version, pkg.versions]);

  const handleCopy = () => {
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`
      group relative z-0 flex flex-col justify-between h-full p-6 rounded-2xl transition-all duration-300 border hover:z-20 focus-within:z-20
      ${isSelected 
        ? 'bg-muted/30 border-accent shadow-md' 
        : 'bg-card border-border hover:border-accent/20 hover:shadow-xl hover:-translate-y-1'}
    `}>
      {/* Selection Ring (Visual indicator when selected) */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-accent rounded-2xl pointer-events-none opacity-50" />
      )}

      <div className="mb-6">
        <div className="min-w-0 flex items-start gap-3">
          {showIcon && pkg.iconUrl && (
            <div className="w-11 h-11 shrink-0 rounded-xl border border-border/70 bg-white p-1.5 flex items-center justify-center overflow-hidden">
              <img
                src={pkg.iconUrl}
                alt=""
                className="w-full h-full object-contain"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setShowIcon(false)}
              />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-bold text-lg leading-snug break-words text-foreground">
              {pkg.name || pkg.id}
            </h3>
            {pkg.name && pkg.name !== pkg.id && (
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted-foreground break-all">
                {pkg.id}
              </p>
            )}
          </div>
        </div>

      </div>

      <div className="mt-auto space-y-4">
        {/* Code Snippet */}
        <div className="group/code relative rounded-lg bg-muted/50 border border-border p-3 font-mono text-xs text-muted-foreground flex items-center gap-3 overflow-hidden transition-colors hover:bg-muted hover:text-foreground">
          <Terminal className="w-3.5 h-3.5 shrink-0 text-accent" />
          <span className="select-all truncate">{installCommand}</span>
        </div>
        
        <div className="flex gap-3">
            <Button 
                onClick={handleCopy} 
                variant={copied ? "primary" : "secondary"} 
                className="flex-1 !h-10 !rounded-xl hover:!translate-y-0"
                size="sm"
                icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            >
                {copied ? "Copied" : "Copy"}
            </Button>

            {packageLink && (
                <a
                    href={packageLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border bg-white text-muted-foreground border-border transition-all duration-200 hover:border-accent hover:text-accent active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                    title={`${packageLinkLabel} for ${pkg.name || pkg.id}`}
                    aria-label={`${packageLinkLabel} for ${pkg.name || pkg.id}`}
                >
                    {packageLinkIsGitHub
                      ? <Github className="w-5 h-5" />
                      : <Globe2 className="w-5 h-5" />}
                </a>
            )}
            
            {onToggleBatch && (
                <button 
                    onClick={() => onToggleBatch(pkg.id)}
                    className={`
                      w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
                      ${isSelected 
                        ? 'bg-foreground text-white border-foreground hover:bg-foreground/90' 
                        : 'bg-white text-muted-foreground border-border hover:border-accent hover:text-accent'}
                    `}
                    title={isSelected ? "Remove from batch" : "Add to batch"}
                >
                    {isSelected ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
            )}
        </div>

        {/* Version Selector */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
              Version
            </span>
            <span className="block truncate text-[10px] text-muted-foreground/60">
              {availableVersions.length > 1 ? `${availableVersions.length} versions available` : '1 version available'}
            </span>
          </div>
          <VersionSelect
            id={`version-${pkg.id}`}
            packageName={pkg.name || pkg.id}
            latestVersion={pkg.version}
            availableVersions={availableVersions}
            selectedVersion={selectedVersion}
            onVersionChange={version => onVersionChange(pkg.id, version)}
          />
        </div>
      </div>
    </div>
  );
};
