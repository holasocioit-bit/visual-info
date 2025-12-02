import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, LayoutGrid, List, BarChart2, Trash2, 
  Download, Search, BookOpen, Layers, Save, Cloud, RefreshCw, WifiOff, HardDrive
} from 'lucide-react';
import { Sheet, Paper, ViewMode } from './types';
import { Importer } from './components/Importer';
import { PaperCard } from './components/PaperCard';
import { Analytics } from './components/Analytics';
import { generateId, downloadJson } from './utils';

const LOCAL_STORAGE_KEY = 'research_vault_db';

const App: React.FC = () => {
  // State
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [showImporter, setShowImporter] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // --- DATA MANAGEMENT ---

  const sanitizeData = (rawSheets: any[]): Sheet[] => {
      const seenIds = new Set<string>();
      return rawSheets.map((s: any) => ({
        ...s,
        papers: Array.isArray(s.papers) ? s.papers.map((p: any) => {
          let currentId = p.id ? String(p.id).trim() : undefined;
          if (!currentId || seenIds.has(currentId)) {
            currentId = generateId(); 
          }
          seenIds.add(currentId);
          return { ...p, id: currentId };
        }) : []
      }));
  };

  const fetchData = async () => {
    try {
      // 1. Try fetching from Server
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error("Network response was not ok");
      
      const parsedSheets = await response.json();
      
      if (Array.isArray(parsedSheets)) {
        const validatedSheets = sanitizeData(parsedSheets);
        setSheets(validatedSheets);
        if (validatedSheets.length > 0 && !activeSheetId) {
           setActiveSheetId(validatedSheets[0].id);
        }
      }
      setIsOfflineMode(false);
    } catch (e) {
      console.warn("Server unreachable, falling back to Local Storage.", e);
      // 2. Fallback to Local Storage
      setIsOfflineMode(true);
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localData) {
          try {
              const parsed = JSON.parse(localData);
              if (Array.isArray(parsed)) {
                  setSheets(sanitizeData(parsed));
                  if (parsed.length > 0 && !activeSheetId) setActiveSheetId(parsed[0].id);
              }
          } catch (err) {
              console.error("Local storage corrupted", err);
          }
      }
    } finally {
      setIsInitialized(true);
    }
  };

  const saveData = useCallback(async (dataToSave: Sheet[]) => {
    setIsSaving(true);
    
    // Always save to local storage as backup/cache
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));

    if (!isOfflineMode) {
        try {
            await fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave)
            });
        } catch (e) {
            console.error("Failed to sync to server", e);
            // Don't alert user too aggressively, just log it.
            // We might want to switch to offline mode here if it persists.
        }
    }
    
    setIsSaving(false);
  }, [isOfflineMode]);

  // Initial Load
  useEffect(() => {
    fetchData();
  }, []);

  // Debounced Auto-Save
  useEffect(() => {
    if (!isInitialized) return;

    const timeoutId = setTimeout(() => {
      saveData(sheets);
    }, 1000); 

    return () => clearTimeout(timeoutId);
  }, [sheets, isInitialized, saveData]);


  const activeSheet = sheets.find(s => s.id === activeSheetId);

  // --- ACTIONS ---

  const handleImport = (title: string, papers: Paper[]) => {
    const newSheet: Sheet = {
      id: generateId(),
      title,
      createdAt: Date.now(),
      papers
    };
    const newSheets = [...sheets, newSheet];
    setSheets(newSheets);
    setActiveSheetId(newSheet.id);
    setShowImporter(false);
    saveData(newSheets); // Immediate save
  };

  const handleUpdatePaper = (updatedPaper: Paper) => {
    setSheets(prevSheets => prevSheets.map(sheet => {
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
    const targetId = String(paperId);

    setSheets(currentSheets => {
      const updatedSheets = currentSheets.map(sheet => ({
        ...sheet,
        papers: sheet.papers.filter(p => String(p.id) !== targetId)
      }));
      return updatedSheets;
    });
  };

  const deleteSheet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // eslint-disable-next-line no-restricted-globals
    if (confirm("Are you sure you want to delete this ENTIRE collection?")) {
      const newSheets = sheets.filter(s => s.id !== id);
      setSheets(newSheets);
      saveData(newSheets);

      if (activeSheetId === id) {
        setActiveSheetId(null);
      }
    }
  };

  const handleBackup = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    downloadJson(sheets, `researchvault-backup-${timestamp}`);
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
    return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <div className="animate-spin text-indigo-600">
                <RefreshCw className="w-8 h-8" />
            </div>
            <div className="text-slate-500 font-medium animate-pulse">Loading ResearchVault...</div>
        </div>
    );
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
          <div className="flex items-center gap-2 mt-2">
            <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isOfflineMode ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {isOfflineMode ? <HardDrive className="w-3 h-3" /> : <Cloud className="w-3 h-3" />}
                {isOfflineMode ? 'Local Mode' : 'Cloud Synced'}
            </span>
            {isSaving && (
                 <span className="text-[10px] text-slate-400 animate-pulse flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
                 </span>
            )}
          </div>
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
            <Save className="w-3 h-3" /> Backup JSON
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
              A shared workspace for organizing academic papers.
              {isOfflineMode ? (
                  <span className="block mt-2 text-amber-600 text-sm font-medium bg-amber-50 py-1 px-3 rounded-full mx-auto w-fit">
                      Running in Local Mode (Offline)
                  </span>
              ) : (
                  <span className="block mt-2 text-emerald-600 text-sm font-medium bg-emerald-50 py-1 px-3 rounded-full mx-auto w-fit">
                      Connected to Cloud Server
                  </span>
              )}
            </p>
            <div className="flex flex-col gap-4 w-full max-w-xs">
              <button 
                onClick={() => setShowImporter(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl shadow-lg shadow-indigo-200 font-medium transition-all flex items-center justify-center gap-3 transform hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" /> Import Data
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