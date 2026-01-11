import React, { useState, useRef } from 'react';
import { X, Copy, Check, Terminal, Download, FileJson, List, Code, Trash2, Upload } from 'lucide-react';
import { Button } from './Button';

interface BatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  ids: string[];
  onRemove: (id: string) => void;
  onImport: (ids: string[]) => void;
}

export const BatchModal: React.FC<BatchModalProps> = ({ isOpen, onClose, ids, onRemove, onImport }) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const jsonStructure = {
    "$schema": "https://aka.ms/winget-packages.schema.2.0.json",
    "CreationDate": new Date().toISOString(),
    "Sources": [
      {
        "Packages": ids.map(id => ({ "PackageIdentifier": id })),
        "SourceDetails": {
          "Argument": "https://cdn.winget.microsoft.com/cache",
          "Identifier": "Microsoft.Winget.Source_8wekyb3d8bbwe",
          "Name": "winget",
          "Type": "Microsoft.PreIndexed.Package"
        }
      }
    ],
    "WinGetVersion": "1.12.350"
  };

  const jsonString = JSON.stringify(jsonStructure, null, 2);
  const importCommand = "winget import -i winget-packages.json --accept-package-agreements --accept-source-agreements";

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(importCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'winget-packages.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const json = JSON.parse(content);
        
        const packages: string[] = [];
        if (json.Sources && Array.isArray(json.Sources)) {
          json.Sources.forEach((source: any) => {
            if (source.Packages && Array.isArray(source.Packages)) {
              source.Packages.forEach((pkg: any) => {
                if (pkg.PackageIdentifier) {
                  packages.push(pkg.PackageIdentifier);
                }
              });
            }
          });
        }
        
        if (packages.length > 0) {
            onImport(packages);
            alert(`Successfully imported ${packages.length} packages.`);
        } else {
            alert("No valid packages found in the JSON file.");
        }
      } catch (err) {
        alert("Invalid JSON file.");
        console.error(err);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-2xl p-6 md:p-8 animate-[zoomIn_0.2s_ease-out] flex flex-col max-h-[90vh] overflow-hidden border border-white/20">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h2 className="font-display text-3xl text-foreground">Configuration</h2>
                <p className="text-muted-foreground">Manage and export your selection</p>
            </div>
            <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
            <X className="w-6 h-6" />
            </button>
        </div>
        
        <div className="space-y-8 overflow-y-auto pr-2 custom-scrollbar">
            {/* Import Section */}
            <div className="bg-muted/40 rounded-xl p-5 border border-border border-dashed">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-sm uppercase tracking-wide text-foreground flex items-center gap-2 mb-1">
                            <Upload className="w-4 h-4"/> Restore
                        </h3>
                        <p className="text-sm text-muted-foreground">Import existing configuration</p>
                    </div>
                    <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        icon={<FileJson className="w-4 h-4"/>}
                    >
                        Select JSON
                    </Button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".json" 
                        onChange={handleFileImport} 
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Step 1 */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <span className="bg-accent text-white font-bold w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span>
                        <h3 className="font-bold text-foreground">Get Config File</h3>
                    </div>
                    <Button 
                        variant="primary" 
                        className="w-full" 
                        onClick={handleDownload}
                        icon={<Download className="w-4 h-4" />}
                        disabled={ids.length === 0}
                    >
                        Download JSON
                    </Button>
                </div>

                {/* Step 2 */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <span className="bg-accent text-white font-bold w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span>
                        <h3 className="font-bold text-foreground">Import Command</h3>
                    </div>
                    <div className="relative">
                        <Button 
                            variant="outline" 
                            className="w-full justify-start font-mono text-xs text-muted-foreground truncate" 
                            onClick={handleCopyCommand}
                            icon={copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        >
                            {copied ? "Copied!" : "Copy Command"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-foreground">
                        <FileJson className="w-5 h-5 text-accent" />
                        <h3 className="font-bold">Manifest Preview</h3>
                    </div>
                    
                    <div className="flex bg-muted p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'table' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            List
                        </button>
                        <button
                            onClick={() => setViewMode('json')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'json' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Raw
                        </button>
                    </div>
                </div>

                <div className="border border-border rounded-xl overflow-hidden bg-white shadow-sm h-64">
                    {viewMode === 'table' ? (
                         <div className="h-full overflow-y-auto">
                            {ids.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                    <List className="w-8 h-8 mb-2 opacity-20" />
                                    <p className="text-sm">No packages selected</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-muted/50 sticky top-0 z-10 text-xs uppercase text-muted-foreground font-medium">
                                        <tr>
                                            <th className="p-3 pl-4">#</th>
                                            <th className="p-3">Identifier</th>
                                            <th className="p-3 text-right pr-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {ids.map((id, index) => (
                                            <tr key={id} className="border-b border-border last:border-0 hover:bg-muted/20">
                                                <td className="p-3 pl-4 font-mono text-xs text-muted-foreground">{index + 1}</td>
                                                <td className="p-3 font-medium text-foreground">{id}</td>
                                                <td className="p-3 text-right pr-4">
                                                    <button 
                                                        onClick={() => onRemove(id)}
                                                        className="text-muted-foreground hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                         </div>
                    ) : (
                        <div className="h-full bg-slate-900 p-4 overflow-y-auto">
                            <pre className="text-xs font-mono text-blue-200">{jsonString}</pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};