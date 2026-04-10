'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { UndoItem } from '@/types/packing';

interface UndoToastProps {
  undoItem: UndoItem | null;
  handleUndo: () => void;
}

export const UndoToast = ({ undoItem, handleUndo }: UndoToastProps) => {
  return (
    <AnimatePresence>
      {undoItem && (
        <motion.div
          initial={{ opacity: 0, y: 100, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 100, x: '-50%' }}
          className="fixed bottom-8 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm"
        >
          <div className="bg-gray-900 text-white rounded-2xl shadow-2xl flex items-center justify-between px-4 h-14 ring-1 ring-white/10 backdrop-blur-sm bg-opacity-95">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="bg-emerald-500/20 p-1.5 rounded-lg shrink-0">
                <RotateCcw size={18} className="text-emerald-400" />
              </div>
              <span className="text-sm font-medium truncate">Unpack {undoItem.name}</span>
            </div>
            <button 
              onClick={handleUndo}
              className="ml-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
            >
              Undo
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
