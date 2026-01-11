import React, { useState } from 'react';
import { Terminal, Copy, Check, X } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(true);
  const command = "Install-Script winget-install -Force;winget-install";

  if (!visible) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-12 rounded-2xl border border-border bg-white shadow-lg overflow-hidden animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row">
        
        {/* Visual Sidebar */}
        <div className="bg-foreground text-white p-6 md:w-16 flex items-start justify-center shrink-0">
          <Terminal className="w-6 h-6 text-accent" />
        </div>

        <div className="flex-1 p-6 md:p-8 relative">
          <button 
            onClick={() => setVisible(false)}
            className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mb-6">
            <h3 className="font-display text-2xl text-foreground mb-2">New to Winget?</h3>
            <p className="text-muted-foreground text-lg">Use this PowerShell command to get started immediately.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full bg-muted/50 border border-border rounded-xl p-4 font-mono text-sm text-foreground overflow-x-auto">
              {command}
            </div>
            <button 
              onClick={handleCopy}
              className="w-full sm:w-auto h-12 px-6 rounded-xl bg-foreground text-white font-medium hover:bg-foreground/90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-foreground/20"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};