import React from 'react';
import { Trash2, Download, Layers } from 'lucide-react';
import { Button } from './Button';

interface BatchDrawerProps {
  count: number;
  onClear: () => void;
  onGenerate: () => void;
}

export const BatchDrawer: React.FC<BatchDrawerProps> = ({ count, onClear, onGenerate }) => {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 px-4 animate-[slideUp_0.4s_ease-out]">
      <div className="container mx-auto max-w-3xl">
        <div className="bg-foreground/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-4 pl-2">
            <div className="relative">
                <div className="bg-accent w-10 h-10 flex items-center justify-center rounded-xl font-bold shadow-[0_0_15px_rgba(0,82,255,0.5)]">
                    {count}
                </div>
                <div className="absolute -top-1 -right-1 bg-white text-foreground rounded-full p-1 shadow-sm">
                    <Layers className="w-3 h-3"/>
                </div>
            </div>
            <div>
                <span className="block font-bold text-sm">Selection Active</span>
                <span className="block text-xs text-white/60">{count} packages ready to export</span>
            </div>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={onClear}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
            <Button 
              variant="primary" 
              onClick={onGenerate}
              className="flex-1 sm:flex-none h-10"
              icon={<Download className="w-4 h-4" />}
            >
              Export
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};