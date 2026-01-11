import React, { useEffect, useState, useMemo } from 'react';
import { Package, Search, AlertCircle, RefreshCw, Github, Upload, Info } from 'lucide-react';
import { WingetPackage } from './types';
import { fetchPackages } from './services/wingetService';
import { PackageCard } from './components/PackageCard';
import { Pagination } from './components/Pagination';
import { Input } from './components/Input';
import { Button } from './components/Button';
import { InstallPrompt } from './components/InstallPrompt';
import { BatchDrawer } from './components/BatchDrawer';
import { BatchModal } from './components/BatchModal';

// Utility for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

const ITEMS_PER_PAGE = 24;

const App: React.FC = () => {
  const [packages, setPackages] = useState<WingetPackage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Batch selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPackages();
      setPackages(data);
    } catch (err) {
      setError("Failed to load Winget packages. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const filteredPackages = useMemo(() => {
    if (!debouncedSearchTerm) return packages;
    const lowerTerm = debouncedSearchTerm.toLowerCase();
    return packages.filter(pkg => 
      pkg.id.toLowerCase().includes(lowerTerm)
    );
  }, [packages, debouncedSearchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const totalPages = Math.ceil(filteredPackages.length / ITEMS_PER_PAGE);
  const currentPackages = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPackages.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPackages, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleBatch = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBatchImport = (importedIds: string[]) => {
    const newSelected = new Set(selectedIds);
    importedIds.forEach(id => newSelected.add(id));
    setSelectedIds(newSelected);
  };

  const clearBatch = () => {
    setSelectedIds(new Set());
    setIsBatchModalOpen(false);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden text-foreground">
      {/* Ambient Gradient Glows */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-accent/3 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <main className="relative z-10 container mx-auto px-4 sm:px-6 py-12 md:py-20 max-w-7xl">
        
        {/* Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 items-end mb-20">
          <div>
             {/* Section Label */}
             <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Unofficial Index</span>
             </div>

             <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-none mb-6 text-foreground">
               Winget<br />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-secondary">Search</span>
             </h1>
             
             <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-xl leading-relaxed">
               The modern interface for the Windows Package Manager. Browse, collect, and deploy software with precision.
             </p>
          </div>
          
          <div className="flex flex-col items-start lg:items-end gap-6">
             <div className="flex flex-wrap gap-4">
                <Button 
                    variant="outline" 
                    onClick={() => setIsBatchModalOpen(true)}
                    className="backdrop-blur-sm bg-white/50"
                    icon={<Upload className="w-4 h-4" />}
                >
                    Config
                </Button>
                <a href="https://github.com/svrooij/winget-pkgs-index" target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" icon={<Github className="w-4 h-4" />}>
                        Source
                    </Button>
                </a>
            </div>
            
            {/* Stats Card */}
            <div className="bg-foreground text-white p-6 rounded-2xl shadow-xl w-full sm:w-auto min-w-[240px] relative overflow-hidden group">
                {/* Decorative Texture */}
                <div className="absolute inset-0 opacity-10" 
                     style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                
                <div className="relative z-10">
                    <p className="text-sm font-mono text-white/60 mb-1 uppercase tracking-wider">Packages Indexed</p>
                    <p className="text-4xl font-display">
                        {loading ? "..." : packages.length.toLocaleString()}
                    </p>
                </div>
            </div>
          </div>
        </div>
        
        {/* Call to Action / Install Prompt */}
        <InstallPrompt />

        {/* Search Section */}
        <div className="mb-16 relative z-20">
             <Input 
               placeholder="Search packages (e.g. 'Chrome', 'NodeJS')..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               autoFocus
               className="shadow-xl"
             />
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
               <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-muted rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-accent rounded-full border-t-transparent animate-spin"></div>
               </div>
               <p className="font-mono text-sm text-muted-foreground uppercase tracking-widest animate-pulse">Loading Index</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-red-50 border border-red-100 p-8 text-center max-w-2xl mx-auto">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="font-display text-2xl text-red-900 mb-2">Connection Failed</h2>
              <p className="text-red-700 mb-6">{error}</p>
              <Button onClick={loadData} variant="primary" icon={<RefreshCw className="w-4 h-4"/>}>Retry</Button>
            </div>
          ) : filteredPackages.length === 0 ? (
            <div className="text-center py-32">
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground animate-float">
                <Search className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <h2 className="font-display text-3xl text-foreground mb-2">No Results Found</h2>
              <p className="text-muted-foreground">Try refining your search terms.</p>
            </div>
          ) : (
            <>
              {/* Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentPackages.map((pkg) => (
                  <PackageCard 
                    key={pkg.id} 
                    pkg={pkg} 
                    isSelected={selectedIds.has(pkg.id)}
                    onToggleBatch={toggleBatch}
                  />
                ))}
              </div>

              {/* Pagination */}
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
              
              <div className="text-center font-mono text-xs text-muted-foreground uppercase tracking-widest">
                Viewing {currentPage} / {totalPages}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white mt-20 relative z-10">
        <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-tr from-accent to-accent-secondary p-2 rounded-lg text-white">
                        <Package className="w-5 h-5" />
                    </div>
                    <span className="font-display text-xl text-foreground">Winget Search</span>
                </div>
                
                <p className="text-sm text-muted-foreground text-center md:text-right max-w-md">
                   An unofficial interface for the Windows Package Manager community repository.
                   <br/>Designed with focus and clarity.
                </p>
            </div>
            <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} Winget Search</p>
                <div className="flex gap-6">
                    <span className="hover:text-foreground transition-colors cursor-pointer">Privacy</span>
                    <span className="hover:text-foreground transition-colors cursor-pointer">Terms</span>
                </div>
            </div>
        </div>
      </footer>

      {/* Batch Components */}
      <BatchDrawer 
        count={selectedIds.size} 
        onClear={clearBatch} 
        onGenerate={() => setIsBatchModalOpen(true)} 
      />
      
      <BatchModal 
        isOpen={isBatchModalOpen} 
        onClose={() => setIsBatchModalOpen(false)} 
        ids={Array.from(selectedIds)} 
        onRemove={toggleBatch}
        onImport={handleBatchImport}
      />

    </div>
  );
};

export default App;