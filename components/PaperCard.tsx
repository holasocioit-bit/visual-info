import React, { useState } from 'react';
import { Paper } from '../types';
import { Star, Edit3, Check, ExternalLink, Trash2, AlertCircle } from 'lucide-react';

interface PaperCardProps {
  paper: Paper;
  onUpdate: (updated: Paper) => void;
  onDelete: (id: string) => void;
}

export const PaperCard: React.FC<PaperCardProps> = ({ paper, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(paper.userNotes);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const toggleImportance = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onUpdate({ ...paper, isImportant: !paper.isImportant });
  };

  const saveNotes = () => {
    onUpdate({ ...paper, userNotes: notes });
    setIsEditing(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isConfirmingDelete) {
        // Second click: actually delete
        onDelete(paper.id);
    } else {
        // First click: show confirmation state
        setIsConfirmingDelete(true);
        // Reset if user doesn't click within 3 seconds
        setTimeout(() => setIsConfirmingDelete(false), 3000);
    }
  };

  // Logic to determine the primary link for the title
  const primaryLink = paper.links && paper.links.length > 0 ? paper.links[0] : null;

  // Helper to format google search fallback if needed
  const getHref = (link: string) => {
      return link.startsWith('http') || link.startsWith('arXiv') 
        ? link 
        : `https://google.com/search?q=${link}`;
  };

  return (
    <div className={`
      group flex flex-col bg-white rounded-xl border transition-all duration-300 relative
      ${paper.isImportant 
        ? 'border-amber-200 shadow-amber-100 shadow-lg' 
        : 'border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200'}
    `}>
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1">
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase text-slate-500 bg-slate-100 mb-2">
              {paper.year}
            </span>
            
            <h3 className="text-lg font-bold text-slate-800 leading-tight">
              {primaryLink ? (
                <a 
                  href={getHref(primaryLink)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-indigo-600 hover:underline transition-colors flex items-start gap-1.5 group/link"
                  onClick={(e) => e.stopPropagation()}
                >
                  {paper.title}
                  <ExternalLink className="w-4 h-4 flex-shrink-0 mt-1 opacity-40 group-hover/link:opacity-100 transition-opacity" />
                </a>
              ) : (
                <span>{paper.title}</span>
              )}
            </h3>
          </div>
          
          <button 
            onClick={toggleImportance}
            className={`flex-shrink-0 p-2 rounded-full transition-colors cursor-pointer z-10 ${paper.isImportant ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-amber-400 hover:bg-slate-50'}`}
            title={paper.isImportant ? "Unmark important" : "Mark as important"}
          >
            <Star className={`w-5 h-5 ${paper.isImportant ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-3">
          {paper.tags.map((tag, idx) => (
            <span key={idx} className="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-3 space-y-4 flex-1">
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Summary</h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            {paper.summary}
          </p>
        </div>

        {paper.contribution && (
          <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/50">
            <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Key Contribution</h4>
            <p className="text-sm text-emerald-900 leading-relaxed italic">
              "{paper.contribution}"
            </p>
          </div>
        )}

        {/* Secondary Links (if more than 1, or just list them all small at bottom) */}
        {paper.links.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
             {paper.links.map((link, i) => (
               <a 
                key={i} 
                href={getHref(link)}
                target="_blank" 
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded cursor-pointer z-10"
               >
                 <ExternalLink className="w-3 h-3" />
                 {link.length > 30 ? link.substring(0, 27) + '...' : link}
               </a>
             ))}
          </div>
        )}
      </div>

      {/* Footer / Notes */}
      <div className="mt-auto border-t border-slate-100 bg-slate-50/50 p-4 rounded-b-xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
            <Edit3 className="w-3 h-3" /> Your Notes
          </h4>
          <div className="flex gap-2">
            {isEditing ? (
              <button onClick={saveNotes} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 flex items-center gap-1 z-10 relative cursor-pointer">
                <Check className="w-3 h-3" /> Save
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium z-10 relative cursor-pointer">
                Edit
              </button>
            )}
          </div>
        </div>
        
        {isEditing ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-sm p-2 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none bg-white min-h-[80px]"
            placeholder="Write your thoughts here..."
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className={`text-sm text-slate-700 min-h-[20px] ${!paper.userNotes && 'text-slate-400 italic'}`}>
             {paper.userNotes ? (
               <div className="whitespace-pre-wrap">{paper.userNotes}</div>
             ) : (
               "No notes yet."
             )}
          </div>
        )}

        {/* Delete Button with UI Confirmation */}
        <div className="pt-2 mt-2 border-t border-slate-200/50 flex justify-end">
            <button 
              type="button"
              onClick={handleDeleteClick}
              className={`
                text-xs px-3 py-2 rounded-md flex items-center gap-1.5 transition-all cursor-pointer font-medium border
                ${isConfirmingDelete 
                    ? 'bg-red-600 text-white border-red-700 hover:bg-red-700' 
                    : 'text-red-500 hover:text-red-700 hover:bg-red-50 border-transparent hover:border-red-100'}
              `}
            >
              {isConfirmingDelete ? (
                <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    Confirm Delete?
                </>
              ) : (
                <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Entry
                </>
              )}
            </button>
        </div>
      </div>
    </div>
  );
};