'use client';

import React, { memo, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Check, BaggageClaim, Trash2, LoaderCircle } from 'lucide-react';
import { Item } from '@/types/packing';
import { matchIcon } from '@/utils/packing-utils';

interface ItemRowProps {
  item: Item;
  color: string;
  showPacked: boolean;
  updateItemField: (id: number, field: string, value: any) => void;
  deleteItem: (id: number) => void;
}

export const ItemRow = memo(({ item, color, showPacked, updateItemField, deleteItem }: ItemRowProps) => {
  const controls = useAnimation();
  
  const handleDragEnd = useCallback(async (e: any, info: any) => {
    if (item.loading) return;
    const offset = info.offset.x;
    if (offset > 80) {
      if (!showPacked) {
        await controls.start({ 
          x: window.innerWidth, 
          opacity: 0, 
          transition: { duration: 0.2, ease: "easeOut" } 
        });
      } else {
        controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
      }
      updateItemField(item.id, 'packed', !item.packed);
    } else if (offset < -80) {
      await controls.start({ 
        x: -window.innerWidth, 
        opacity: 0, 
        transition: { duration: 0.2, ease: "easeOut" } 
      });
      deleteItem(item.id);
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  }, [item.id, item.packed, showPacked, updateItemField, deleteItem, controls]);

  return (
    <motion.div 
      layout
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0, marginBottom: 0 }}
      transition={{ 
        height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
        opacity: { duration: 0.2 }
      }}
      className="relative group mb-3 rounded-xl"
    >
      {/* BACKGROUND ACTION LAYER */}
      <div className="absolute inset-0 flex items-center justify-between px-6 rounded-xl">
        <div className="flex items-center gap-2 text-emerald-600 font-medium">
           <BaggageClaim size={20} strokeWidth={2.5} />
           <span className="text-sm hidden sm:inline-block">Pack</span>
        </div>
        <div className="flex items-center gap-2 text-red-500 font-medium tracking-wide">
           <span className="text-sm hidden sm:inline-block">Delete</span>
           <Trash2 size={20} strokeWidth={2.5} />
        </div>
      </div>

      {/* FOREGROUND SWIPEABLE LAYER */}
      <motion.div 
        drag={item.loading ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        dragTransition={{ bounceStiffness: 600, bounceDamping: 30 }}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ touchAction: 'pan-y', willChange: 'transform' }}
        className={`relative z-10 flex items-center bg-white rounded-xl p-4 transition-opacity duration-200 ${item.packed ? 'bg-gray-100' : ''}`}
      >
          {/* Checkbox */}
          <div className="mr-3 pl-1 shrink-0">
            <button 
              disabled={item.loading}
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${item.loading ? 'border-gray-100 bg-gray-50' : item.packed ? 'text-gray-800 shadow-sm' : 'border-gray-300 bg-white text-transparent hover:border-gray-400'}`}
              style={!item.loading && item.packed ? { backgroundColor: color, borderColor: color } : {}}
              onClick={() => updateItemField(item.id, 'packed', !item.packed)}
            >
              {item.loading ? <LoaderCircle size={14} className="animate-spin text-gray-300" /> : <Check size={18} strokeWidth={3.5} className={item.packed ? 'opacity-80' : 'opacity-0'} />}
            </button>
          </div>
          
          {/* Icon Block */}
          <div 
            className="mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-gray-900/10"
            style={{ backgroundColor: item.loading ? '#f9fafb' : color }}
          >
            <span className="text-gray-800/70">
              {item.loading ? <LoaderCircle size={20} className="animate-spin text-gray-400" /> : matchIcon(item.item, 20)}
            </span>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0 pr-4">
            <div className={`text-base font-semibold leading-6 block truncate ${item.packed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
              {item.item}
            </div>
            {item.notes && (
              <div className="mt-1 flex items-center gap-x-2">
                <div className="text-sm leading-5 text-gray-500 truncate block w-full">
                  {item.notes}
                </div>
              </div>
            )}
          </div>

          {/* Quantity Badge */}
          <div className="shrink-0 flex items-center ml-2">
            <span className="inline-flex items-center justify-center rounded-md bg-gray-100 ring-1 ring-inset ring-gray-500/10 px-2 py-0.5 text-sm font-medium text-gray-900">
              {item.quantity || '1'}
            </span>
          </div>
      </motion.div>
    </motion.div>
  );
});

ItemRow.displayName = 'ItemRow';
