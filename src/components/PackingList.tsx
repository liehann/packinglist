'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { 
  Plus, LoaderCircle, Check, BaggageClaim 
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

import { Item, UndoItem } from '@/types/packing';
import { getCategoryColor } from '@/utils/packing-utils';
import { ItemRow } from './packing/ItemRow';
import { UndoToast } from './packing/UndoToast';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PackingList() {
  const { data, error, mutate } = useSWR<{ items: Item[] }>('/api/packing-list', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 5000,
  });

  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());
  const [customSections, setCustomSections] = useState<string[]>([]);
  const [showPacked, setShowPacked] = useState<boolean>(false);
  const [undoItem, setUndoItem] = useState<UndoItem | null>(null);
  
  // Auto-clear undo toast after 5 seconds
  useEffect(() => {
    if (undoItem) {
      const timer = setTimeout(() => setUndoItem(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [undoItem]);

  const items = data?.items || [];
  
  const categories = useMemo(() => {
    const baseCategories = items.reduce((acc, currentItem) => {
      const cat = currentItem.category || 'Uncategorized';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(currentItem);
      return acc;
    }, {} as Record<string, Item[]>);

    customSections.forEach(cat => {
      if (!baseCategories[cat]) baseCategories[cat] = [];
    });

    return baseCategories;
  }, [items, customSections]);

  const totalItems = items.length;
  const packedItems = items.filter(i => i.packed).length;
  const progressPercentage = totalItems === 0 ? 0 : Math.round((packedItems / totalItems) * 100);

  const updateItemField = useCallback(async (id: number, field: string, value: any) => {
    mutate((currentData: any) => {
      if (!currentData?.items) return currentData;
      const updatedItems = currentData.items.map((item: any) => {
        if (item.id === id) {
          if (field === 'packed' && value === true) {
            setUndoItem({ id, name: item.item });
          } else if (field === 'packed' && value === false) {
            setUndoItem(curr => curr?.id === id ? null : curr);
          }
          return { ...item, [field]: value };
        }
        return item;
      });
      return { ...currentData, items: updatedItems };
    }, false);

    try {
      await fetch('/api/packing-list', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId: id, [field]: value }),
      });
      mutate();
    } catch (e) {
      console.error(e);
      mutate();
    }
  }, [mutate]);

  const deleteItem = useCallback(async (id: number) => {
    mutate((currentData: any) => {
      if (!currentData?.items) return currentData;
      const updatedItems = currentData.items.filter((item: any) => item.id !== id);
      return { ...currentData, items: updatedItems };
    }, false);

    try {
      await fetch(`/api/packing-list?rowId=${id}`, {
        method: 'DELETE',
      });
      mutate();
    } catch (e) {
      console.error('Failed to delete item', e);
      mutate();
    }
  }, [mutate]);

  const handleInlineAdd = useCallback(async (category: string, item: string, quantity: string) => {
    if (!item.trim()) return;
    try {
      await fetch('/api/packing-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, item, quantity, notes: '' }),
      });
      mutate();
    } catch (e) {
      console.error('Failed to inline add item', e);
    }
  }, [mutate]);

  const handleUndo = useCallback(() => {
    if (undoItem) {
      updateItemField(undoItem.id, 'packed', false);
      setUndoItem(null);
    }
  }, [undoItem, updateItemField]);

  if (error) return <div className="p-8 text-center text-red-500">Failed to load packing list.</div>;
  if (!data) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 text-emerald-800">
      <LoaderCircle className="animate-spin" size={48} />
      <p>Loading your trip details...</p>
    </div>
  );

  const handleAddSection = () => {
    const name = window.prompt("New section name:");
    if (name && name.trim()) {
      setCustomSections(prev => [...prev, name.trim()]);
    }
  };

  return (
    <div className="h-screen flex flex-col font-sans overflow-hidden">
      {/* STICKY HEADER */}
      <div className="flex-none pt-4 pb-4 px-4 sm:px-8 bg-white/95 backdrop-blur-md z-50 shadow-sm border-b border-black/5">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-3 bg-gray-50/80 rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm">
            <div className="flex-1 flex justify-between sm:justify-start items-center gap-3">
              <div className="text-sm font-medium text-gray-700 whitespace-nowrap shrink-0">
                {packedItems} of {totalItems}
              </div>
              <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden min-w-[40px] max-w-full sm:max-w-none">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500 ease-out" 
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
            <div className="flex shrink-0 border-l border-gray-200 pl-3 sm:pl-4 justify-end items-center">
              <button 
                onClick={() => setShowPacked(!showPacked)}
                className={`flex items-center justify-center w-[34px] h-[34px] rounded-full transition-all border ${showPacked ? 'bg-[#bbf7d0] text-emerald-800 border-[#99f6b4] shadow-sm ring-1 ring-black/5' : 'bg-gray-100 text-gray-400 border-gray-200 shadow-inner'}`}
                title={showPacked ? "Hide packed items" : "Show packed items"}
              >
                <BaggageClaim size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SCROLLABLE BODY */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
        <div className="max-w-3xl mx-auto pb-32">
          {/* SECTION SELECTORS */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            {(() => {
              const noFiltersEnabled = selectedFilters.size === 0;
              const isGreen = noFiltersEnabled;
              const toggleAll = () => setSelectedFilters(new Set());
              return (
                <button
                  onClick={toggleAll}
                  className={`flex items-center justify-center w-[30px] h-[30px] rounded-full transition-all border shrink-0 ${isGreen ? 'bg-[#bbf7d0] text-emerald-800 border-[#99f6b4] shadow-sm ring-1 ring-black/5' : 'bg-gray-100 text-gray-400 border-gray-200 shadow-inner'}`}
                  title="Clear filters"
                >
                  <Check size={16} strokeWidth={isGreen ? 3 : 2} />
                </button>
              );
            })()}
            {Object.keys(categories).map((filterCat) => {
              const color = getCategoryColor(filterCat);
              const isActive = selectedFilters.has(filterCat);
              return (
                <button 
                  key={filterCat} 
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${isActive ? 'text-gray-900 shadow-md border-black/10 ring-1 ring-black/5 opacity-100 font-semibold' : 'text-gray-500 border-transparent bg-gray-100 shadow-sm opacity-60 hover:opacity-80'}`}
                  style={isActive ? { backgroundColor: color } : {}}
                  onClick={() => {
                    const next = new Set(selectedFilters);
                    if (isActive) next.delete(filterCat);
                    else next.add(filterCat);
                    setSelectedFilters(next);
                  }}
                >
                  {filterCat}
                </button>
              );
            })}
            <button 
              onClick={handleAddSection}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-all text-emerald-700 border border-emerald-200 hover:bg-emerald-50 bg-white shadow-sm flex items-center gap-1"
            >
              <Plus size={14} /> Section
            </button>
          </div>

          {Object.entries(categories)
            .filter(([category]) => selectedFilters.size === 0 || selectedFilters.has(category))
            .map(([category, catItems]) => {
              const color = getCategoryColor(category);
              return (
                <div key={category} className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 
                    className="text-xl font-medium text-stone-800 mb-3 pb-2 flex items-center gap-2 border-b-2"
                    style={{ borderBottomColor: color }}
                  >
                    {category} 
                    <span 
                      className="text-xs px-2.5 py-0.5 rounded-full border border-black/5"
                      style={{ backgroundColor: color }}
                    >
                      {catItems.filter(i => i.packed).length}/{catItems.length}
                    </span>
                  </h2>
                  
                  <div className="flex flex-col">
                    <AnimatePresence initial={false}>
                      {catItems
                        .filter(item => showPacked || !item.packed)
                        .map((item) => (
                          <ItemRow 
                            key={item.id} 
                            item={item} 
                            color={color} 
                            showPacked={showPacked}
                            updateItemField={updateItemField} 
                            deleteItem={deleteItem} 
                          />
                        ))}
                    </AnimatePresence>
                  </div>

                  <form 
                    className="mt-1 flex items-center bg-gray-50/50 rounded-xl p-2 border border-dashed border-gray-300 transition-all focus-within:bg-white focus-within:border-solid focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 focus-within:shadow-sm"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const nameInput = form.elements.namedItem('itemName') as HTMLInputElement;
                      const qtyInput = form.elements.namedItem('itemQty') as HTMLInputElement;
                      handleInlineAdd(category, nameInput.value, qtyInput.value || '1');
                      nameInput.value = '';
                      qtyInput.value = '';
                      nameInput.focus();
                    }}
                  >
                    <Plus size={16} className="text-gray-400 mx-2 shrink-0" />
                    <input 
                      type="text" 
                      name="itemName"
                      className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder:text-gray-400 text-base font-medium pr-2 min-w-0" 
                      placeholder={`Add an item to ${category}...`}
                      required
                    />
                    <input 
                      type="text" 
                      name="itemQty"
                      className="qty-field bg-white ring-1 ring-gray-900/5 outline-none text-center text-sm font-semibold rounded-md p-1 placeholder:text-gray-400 mr-1 shrink-0" 
                      style={{ width: '3ch' }}
                      placeholder="#"
                    />
                    <button type="submit" className="hidden">Submit</button>
                  </form>
                </div>
              );
            })}
        </div>
      </div>

      <UndoToast undoItem={undoItem} handleUndo={handleUndo} />
    </div>
  );
}
