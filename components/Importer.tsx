import React, { useState } from 'react';
import { FileJson, ArrowRight, AlertCircle } from 'lucide-react';
import { parseRawJson } from '../utils';
import { Paper } from '../types';

interface ImporterProps {
  onImport: (title: string, papers: Paper[]) => void;
  onCancel: () => void;
}

export const Importer: React.FC<ImporterProps> = ({ onImport, onCancel }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleProcess = () => {
    if (!jsonInput.trim()) {
      setError("Please paste some JSON data first.");
      return;
    }
    if (!title.trim()) {
      setError("Please give this collection a name.");
      return;
    }

    const papers = parseRawJson(jsonInput);
    
    if (papers.length === 0) {
      setError("Could not find any valid paper data in the input. Please check the format.");
      return;
    }

    onImport(title, papers);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileJson className="w-6 h-6 text-indigo-600" />
              Import Data
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Paste your raw JSON containing nested output strings. We'll extract and beautify it.
            </p>
          </div>
          <button 
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Sheet Title
            </label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Causal Inference 2024"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="flex-1 flex flex-col">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              JSON Data
            </label>
            <textarea 
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setError(null);
              }}
              placeholder='Paste your JSON here (e.g. [{"data": [{"output": "..."}]}])...'
              className="w-full flex-1 min-h-[300px] font-mono text-sm p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-y"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleProcess}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 font-medium"
          >
            Process & Create Sheet <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
