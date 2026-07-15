import React, { useState } from 'react';
import { Copy, Check, Terminal, Plus, Minus } from 'lucide-react';
import { WingetPackage } from '../types';
import { Button } from './Button';

interface PackageCardProps {
  pkg: WingetPackage;
  isSelected?: boolean;
  onToggleBatch?: (id: string) => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({ pkg, isSelected = false, onToggleBatch }) => {
  const [copied, setCopied] = useState(false);
  const [showIcon, setShowIcon] = useState(Boolean(pkg.iconUrl));
  const installCommand = `winget install --id "${pkg.id}" --exact -s winget`;

  const handleCopy = () => {
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`
      group relative flex flex-col justify-between h-full p-6 rounded-2xl transition-all duration-300 border
      ${isSelected 
        ? 'bg-muted/30 border-accent shadow-md' 
        : 'bg-card border-border hover:border-accent/20 hover:shadow-xl hover:-translate-y-1'}
    `}>
      {/* Selection Ring (Visual indicator when selected) */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-accent rounded-2xl pointer-events-none opacity-50" />
      )}

      <div className="mb-6">
        <div className="flex justify-between items-start gap-4">
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

          {/* Version Badge */}
          <div className="shrink-0 flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border/50">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              {pkg.version}
            </span>
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
                className="flex-1 h-10"
                size="sm"
                icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            >
                {copied ? "Copied" : "Copy"}
            </Button>
            
            {onToggleBatch && (
                <button 
                    onClick={() => onToggleBatch(pkg.id)}
                    className={`
                      w-10 h-10 flex items-center justify-center rounded-xl border transition-all duration-200
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
      </div>
    </div>
  );
};
