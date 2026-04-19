import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, CheckCircle, Share2 } from 'lucide-react';

export default function ShareModal({ isOpen, onClose, shareUrl }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const modalContent = (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[99999] p-4">
      <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.2)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="m-0 text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Share2 className="text-indigo-500" />
            Share Itinerary
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 text-center font-medium">
            Anyone with this link can view your amazing tourist itinerary!
          </p>
          
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl p-2">
            <input 
              readOnly 
              value={shareUrl} 
              className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-slate-200 text-sm px-2 font-mono truncate"
            />
            <button 
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 active:scale-95'}`}
            >
              {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
