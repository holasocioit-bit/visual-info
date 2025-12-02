import React, { useState, useEffect } from 'react';
import { 
  Plus, LayoutGrid, List, BarChart2, Trash2, 
  Download, Search, BookOpen, Layers, Save, CheckCircle2, RotateCcw, Database
} from 'lucide-react';
import { Sheet, Paper, ViewMode } from './types';
import { Importer } from './components/Importer';
import { PaperCard } from './components/PaperCard';
import { Analytics } from './components/Analytics';
import { generateId, downloadJson } from './utils';

const App: React.FC = () => {
  // State
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [showImporter, setShowImporter] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initial Load with Data Migration/Sanitization
  useEffect(() => {
    const saved = localStorage.getItem('researchVaultData');
    if (saved) {
      try {
        const parsedSheets = JSON.parse(saved);
        if (Array.isArray(parsedSheets)) {
          // SANITIZATION: Check for duplicate IDs which break React keys and deletion
          const seenIds = new Set<string>();
          
          const validatedSheets = parsedSheets.map((s: any) => ({
            ...s,
            papers: Array.isArray(s.papers) ? s.papers.map((p: any) => {
              // FORCE STRING: Handle legacy data where ID might be a number
              let currentId = p.id ? String(p.id).trim() : undefined;
              
              // If ID is missing OR we have seen this ID before, generate a NEW one
              if (!currentId || seenIds.has(currentId)) {
                currentId = generateId(); 
              }
              seenIds.add(currentId);
              return { ...p, id: currentId };
            }) : []
          }));

          setSheets(validatedSheets);
          if (validatedSheets.length > 0 && !activeSheetId) {
             setActiveSheetId(validatedSheets[0].id);
          }
        }
      } catch (e) {
        console.error("Failed to load saved data", e);
      }
    }
    // Mark as initialized so auto-save can start working safely
    setIsInitialized(true);
  }, []);

  // Auto-Save Effect
  useEffect(() => {
    // Only save if we have initialized (loaded previous data)
    // This prevents overwriting localStorage with [] on initial render
    if (!isInitialized) return;

    try {
      localStorage.setItem('researchVaultData', JSON.stringify(sheets));
      setLastSaved(new Date());
    } catch (e) {
      console.error("Storage full or error", e);
    }
  }, [sheets, isInitialized]);

  const activeSheet = sheets.find(s => s.id === activeSheetId);

  // --- ACTIONS ---

  const handleImport = (title: string, papers: Paper[]) => {
    const newSheet: Sheet = {
      id: generateId(),
      title,
      createdAt: Date.now(),
      papers
    };
    setSheets(prev => [...prev, newSheet]);
    setActiveSheetId(newSheet.id);
    setShowImporter(false);
  };

  const handleUpdatePaper = (updatedPaper: Paper) => {
    setSheets(prevSheets => prevSheets.map(sheet => {
      // Small optimization: only update the sheet that contains the paper
      if (sheet.papers.some(p => p.id === updatedPaper.id)) {
        return {
          ...sheet,
          papers: sheet.papers.map(p => p.id === updatedPaper.id ? updatedPaper : p)
        };
      }
      return sheet;
    }));
  };

  const deletePaper = (paperId: string) => {
    if (!paperId) return;
    
    // NOTE: Confirmation is now handled inside PaperCard component for better UX
    // and to avoid browser blocking 'confirm()' dialogs.
    
    const targetId = String(paperId); // Ensure strict string type for comparison

    setSheets(currentSheets => {
      // Map through all sheets and remove the paper with the matching ID
      const updatedSheets = currentSheets.map(sheet => ({
        ...sheet,
        papers: sheet.papers.filter(p => String(p.id) !== targetId)
      }));
      
      // Force sync save to prevent race conditions or UI lag
      try {
        localStorage.setItem('researchVaultData', JSON.stringify(updatedSheets));
      } catch(e) { console.error("Save error", e); }
      
      return updatedSheets;
    });
  };

  const deleteSheet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // eslint-disable-next-line no-restricted-globals
    if (confirm("Are you sure you want to delete this ENTIRE collection?")) {
      setSheets(currentSheets => {
        const newSheets = currentSheets.filter(s => s.id !== id);
        localStorage.setItem('researchVaultData', JSON.stringify(newSheets));
        return newSheets;
      });

      if (activeSheetId === id) {
        setActiveSheetId(null);
      }
    }
  };

  const handleBackup = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    downloadJson(sheets, `researchvault-backup-${timestamp}`);
  };

  const handleResetApp = () => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm("NUCLEAR RESET: This will wipe all data from this browser. Are you sure?")) {
      localStorage.removeItem('researchVaultData');
      setSheets([]);
      setActiveSheetId(null);
      window.location.reload();
    }
  };

  const filteredPapers = activeSheet?.papers.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }) || [];

  if (!isInitialized) {
    return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-medium animate-pulse">Checking database integrity...</div>;
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 z-10 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
            <BookOpen className="w-6 h-6" />
            <span>ResearchVault</span>
          </div>
          {lastSaved && (
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 mt-2 font-medium animate-pulse">
              <CheckCircle2 className="w-3 h-3" />
              Synced to Storage
            </div>
          )}
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">
            Collections
          </div>
          
          <div className="space-y-1">
            {sheets.map(sheet => (
              <div 
                key={sheet.id}
                onClick={() => setActiveSheetId(sheet.id)}
                className={`
                  group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all
                  ${activeSheetId === sheet.id 
                    ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Layers className={`w-4 h-4 flex-shrink-0 ${activeSheetId === sheet.id ? 'text-indigo-500' : 'text-slate-400'}`} />
                  <span className="truncate">{sheet.title}</span>
                </div>
                <button 
                  onClick={(e) => deleteSheet(sheet.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 hover:text-red-600 rounded text-slate-400 transition-all"
                  title="Delete Collection"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {sheets.length === 0 && (
              <div className="text-sm text-slate-400 px-3 py-4 text-center italic border-2 border-dashed border-slate-100 rounded-lg">
                No collections yet.
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/50">
          <button 
            onClick={() => setShowImporter(true)}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg transition-colors font-medium shadow-md shadow-indigo-100"
          >
            <Plus className="w-4 h-4" /> New Sheet
          </button>
          
          <button 
            onClick={handleBackup}
            className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors text-xs font-medium mt-3"
          >
            <Save className="w-3 h-3" /> Backup Data
          </button>

           <button 
              onClick={handleResetApp}
              className="w-full flex items-center justify-center gap-2 mt-1 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 py-2 rounded transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset App
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-50">
        
        {activeSheet ? (
          <>
            {/* Top Bar */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 shadow-sm z-20">
              <div className="flex items-center gap-4 flex-1">
                <h1 className="text-xl font-bold text-slate-800 truncate max-w-md" title={activeSheet.title}>
                  {activeSheet.title}
                </h1>
                <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
                <div className="relative max-w-md w-full hidden sm:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search titles, summaries, tags..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-slate-100 p-1 rounded-lg mr-2">
                  <button 
                    onClick={() => setViewMode(ViewMode.GRID)}
                    className={`p-1.5 rounded-md transition-all ${viewMode === ViewMode.GRID ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode(ViewMode.LIST)}
                    className={`p-1.5 rounded-md transition-all ${viewMode === ViewMode.LIST ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode(ViewMode.ANALYTICS)}
                    className={`p-1.5 rounded-md transition-all ${viewMode === ViewMode.ANALYTICS ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Analytics"
                  >
                    <BarChart2 className="w-4 h-4" />
                  </button>
                </div>

                <button 
                  onClick={() => downloadJson(activeSheet, activeSheet.title.replace(/\s+/g, '_'))}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 font-medium"
                >
                  <Download className="w-4 h-4" /> Export
                </button>
              </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
              
              {viewMode === ViewMode.ANALYTICS ? (
                <Analytics papers={activeSheet.papers} />
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4 px-1">
                    <p className="text-sm font-medium text-slate-500">
                      Showing {filteredPapers.length} of {activeSheet.papers.length} papers
                    </p>
                  </div>

                  <div className={`
                    ${viewMode === ViewMode.GRID 
                      ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
                      : 'flex flex-col gap-4 max-w-4xl mx-auto'}
                  `}>
                    {filteredPapers.map(paper => (
                      <PaperCard 
                        key={paper.id} 
                        paper={paper} 
                        onUpdate={handleUpdatePaper}
                        onDelete={deletePaper}
                      />
                    ))}
                  </div>

                  {filteredPapers.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="font-medium">No papers match your search.</p>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="mt-2 text-indigo-600 hover:underline text-sm"
                      >
                        Clear search
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6 border border-slate-100">
              <BookOpen className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">ResearchVault</h2>
            <p className="text-slate-500 max-w-md text-center mb-10 text-lg">
              Your personal workspace for organizing and analyzing academic papers from raw JSON data.
            </p>
            <div className="flex flex-col gap-4 w-full max-w-xs">
              <button 
                onClick={() => setShowImporter(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl shadow-lg shadow-indigo-200 font-medium transition-all flex items-center justify-center gap-3 transform hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" /> Import Data
              </button>
              <button 
                onClick={handleBackup}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Database className="w-5 h-5 text-slate-400" /> Save DB Backup
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Modals */}
      {showImporter && (
        <Importer 
          onImport={handleImport} 
          onCancel={() => setShowImporter(false)} 
        />
      )}
    </div>
  );
};

export default App;