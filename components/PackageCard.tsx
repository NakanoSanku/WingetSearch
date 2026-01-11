import React, { useState } from 'react';
import { Copy, Check, Terminal, Box, Plus, Minus } from 'lucide-react';
import { WingetPackage } from '../types';
import { Button } from './Button';

interface PackageCardProps {
  pkg: WingetPackage;
  isSelected?: boolean;
  onToggleBatch?: (id: string) => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({ pkg, isSelected = false, onToggleBatch }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const command = `winget install ${pkg.id}`;
    navigator.clipboard.writeText(command);
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
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className={`
            p-3 rounded-xl transition-colors duration-300
            ${isSelected ? 'bg-accent text-white' : 'bg-muted text-foreground group-hover:bg-gradient-to-br group-hover:from-accent group-hover:to-accent-secondary group-hover:text-white'}
          `}>
             <Box className="w-6 h-6" strokeWidth={2} />
          </div>
          
          {/* Version Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border/50">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              {pkg.version}
            </span>
          </div>
        </div>

        <h3 className="font-bold text-lg leading-snug break-all text-foreground mb-1">
          {pkg.id}
        </h3>
      </div>

      <div className="mt-auto space-y-4">
        {/* Code Snippet */}
        <div className="group/code relative rounded-lg bg-muted/50 border border-border p-3 font-mono text-xs text-muted-foreground flex items-center gap-3 overflow-hidden transition-colors hover:bg-muted hover:text-foreground">
          <Terminal className="w-3.5 h-3.5 shrink-0 text-accent" />
          <span className="select-all truncate">winget install {pkg.id}</span>
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