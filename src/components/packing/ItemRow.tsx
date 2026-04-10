'use client';

import React, { memo, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Check, BaggageClaim, Trash2 } from 'lucide-react';
import { Item } from '@/types/packing';
import { matchIcon } from '@/utils/packing-utils';
import { EditableField } from './EditableField';

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
      className="overflow-hidden relative group mb-3"
    >
      {/* BACKGROUND ACTION LAYER */}
      <div className="absolute inset-0 flex items-center justify-between px-6 rounded-xl bg-gray-100/80">
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
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        dragTransition={{ bounceStiffness: 600, bounceDamping: 30 }}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ touchAction: 'pan-y', willChange: 'transform' }}
        className={`relative z-10 flex items-center bg-white rounded-xl p-4 ring-1 ring-gray-900/5 shadow-sm transition-opacity duration-200 ${item.packed ? 'bg-gray-100' : ''}`}
      >
          {/* Checkbox */}
          <div className="mr-3 pl-1 shrink-0">
            <button 
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${item.packed ? 'text-gray-800 shadow-sm' : 'border-gray-300 bg-white text-transparent hover:border-gray-400'}`}
              style={item.packed ? { backgroundColor: color, borderColor: color } : {}}
              onClick={() => updateItemField(item.id, 'packed', !item.packed)}
            >
              <Check size={18} strokeWidth={3.5} className={item.packed ? 'opacity-80' : 'opacity-0'} />
            </button>
          </div>
          
          {/* Icon Block */}
          <div 
            className="mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-gray-900/10"
            style={{ backgroundColor: color }}
          >
            <span className="text-gray-800/70">
              {matchIcon(item.item, 20)}
            </span>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0 pr-4">
            <EditableField 
              value={item.item} 
              placeholder="Item name"
              className={`text-base font-semibold leading-6 block truncate ${item.packed ? 'line-through text-gray-400' : 'text-gray-900'}`}
              onSave={(val) => updateItemField(item.id, 'item', val)}
            />
            <div className="mt-1 flex items-center gap-x-2">
              <EditableField 
                value={item.notes} 
                placeholder="Add notes..."
                className="text-sm leading-5 text-gray-500 placeholder:text-gray-400 block w-full"
                onSave={(val) => updateItemField(item.id, 'notes', val)}
              />
            </div>
          </div>

          {/* Quantity Badge */}
          <div className="shrink-0 flex items-center ml-2">
            <span className="inline-flex items-center justify-center rounded-md bg-gray-100 ring-1 ring-inset ring-gray-500/10 px-1 py-0.5">
              <EditableField 
                value={item.quantity || '1'} 
                placeholder="1"
                className="qty-field text-center bg-transparent outline-none m-0 p-0 inline-block text-sm font-medium text-gray-900"
                onSave={(val) => updateItemField(item.id, 'quantity', val)}
              />
            </span>
          </div>
      </motion.div>
    </motion.div>
  );
});

ItemRow.displayName = 'ItemRow';
