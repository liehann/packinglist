'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  Check, Plus, LoaderCircle, Package, Hash, FileText,
  Shirt, Smartphone, Laptop, BatteryCharging, Camera, Headphones,
  Ticket, Wallet, Droplet, Pill, Baby, Book, Apple,
  BaggageClaim, Footprints
} from 'lucide-react';

interface Item {
  id: number;
  category: string;
  item: string;
  quantity: string;
  notes: string;
  packed: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const COLOR_PALETTE = [
  '#fed7aa', // orange
  '#bfdbfe', // blue
  '#bbf7d0', // green
  '#a5f3fc', // cyan
  '#e9d5ff', // purple
  '#fbcfe8', // pink
  '#fecaca', // red
  '#fef08a'  // yellow
];

const getCategoryColor = (categoryName: string) => {
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
};

const matchIcon = (name: string, size = 22) => {
  const n = name.toLowerCase();
  if (n.includes('shirt') || n.includes('pant') || n.includes('sock') || n.includes('jacket') || n.includes('coat') || n.includes('clothes') || n.includes('underwear')) return <Shirt size={size} strokeWidth={1.5} />;
  if (n.includes('phone') || n.includes('ipad') || n.includes('tablet')) return <Smartphone size={size} strokeWidth={1.5} />;
  if (n.includes('laptop') || n.includes('mac') || n.includes('computer')) return <Laptop size={size} strokeWidth={1.5} />;
  if (n.includes('charg') || n.includes('cable') || n.includes('plug') || n.includes('usb') || n.includes('adapt') || n.includes('power')) return <BatteryCharging size={size} strokeWidth={1.5} />;
  if (n.includes('headphone') || n.includes('earpod') || n.includes('airpod') || n.includes('audio')) return <Headphones size={size} strokeWidth={1.5} />;
  if (n.includes('camera') || n.includes('lens')) return <Camera size={size} strokeWidth={1.5} />;
  if (n.includes('passport') || n.includes('id') || n.includes('ticket') || n.includes('document')) return <Ticket size={size} strokeWidth={1.5} />;
  if (n.includes('wallet') || n.includes('cash') || n.includes('money') || n.includes('card')) return <Wallet size={size} strokeWidth={1.5} />;
  if (n.includes('tooth') || n.includes('shampoo') || n.includes('soap') || n.includes('wash') || n.includes('lotion')) return <Droplet size={size} strokeWidth={1.5} />;
  if (n.includes('med') || n.includes('pill') || n.includes('band') || n.includes('aid')) return <Pill size={size} strokeWidth={1.5} />;
  if (n.includes('diaper') || n.includes('wipe') || n.includes('stroller') || n.includes('crib') || n.includes('kid') || n.includes('baby')) return <Baby size={size} strokeWidth={1.5} />;
  if (n.includes('book') || n.includes('read')) return <Book size={size} strokeWidth={1.5} />;
  if (n.includes('snack') || n.includes('food') || n.includes('eat') || n.includes('water')) return <Apple size={size} strokeWidth={1.5} />;
  if (n.includes('shoe') || n.includes('boot') || n.includes('sneaker')) return <Footprints size={size} strokeWidth={1.5} />;
  if (n.includes('bag') || n.includes('pack') || n.includes('suit') || n.includes('luggage')) return <BaggageClaim size={size} strokeWidth={1.5} />;
  return <Package size={size} strokeWidth={1.5} />;
};

const EditableField = ({ value, placeholder, className, onSave }: { value: string, placeholder: string, className: string, onSave: (v: string) => void }) => {
  const [val, setVal] = useState(value);
  // Sync state if external value changes (e.g. from generic reload)
  useEffect(() => setVal(value), [value]);

  const handleBlur = () => { 
    if (val !== value) onSave(val); 
  };
  
  const isQty = className.includes('qty-field');

  return (
    <input 
      value={val} 
      onChange={e => setVal(e.target.value)} 
      onBlur={handleBlur} 
      onKeyDown={e => { if(e.key==='Enter') e.currentTarget.blur() }} 
      className={`bg-transparent outline-none ring-0 focus:bg-black/5 rounded transition-colors ${isQty ? '' : 'w-full px-1 -mx-1'} ${className}`} 
      style={isQty ? { width: `${Math.max(1, val.toString().length) + 0.5}ch` } : {}}
      placeholder={placeholder} 
    />
  );
};

export default function PackingList() {
  const { data, error, mutate } = useSWR<{ items: Item[] }>('/api/packing-list', fetcher);
  const [disabledFilters, setDisabledFilters] = useState<Set<string>>(new Set());
  const [customSections, setCustomSections] = useState<string[]>([]);
  const [showPacked, setShowPacked] = useState<boolean>(true);
  
  if (error) return <div className="p-8 text-center text-red-500">Failed to load packing list.</div>;
  if (!data) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 text-emerald-800">
      <LoaderCircle className="animate-spin" size={48} />
      <p>Loading your trip details...</p>
    </div>
  );

  const items = data.items || [];
  
  const baseCategories = items.reduce((acc, currentItem) => {
    const cat = currentItem.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(currentItem);
    return acc;
  }, {} as Record<string, Item[]>);

  // Add empty custom sections locally
  customSections.forEach(cat => {
    if (!baseCategories[cat]) baseCategories[cat] = [];
  });

  const categories = baseCategories;

  const totalItems = items.length;
  const packedItems = items.filter(i => i.packed).length;
  const progressPercentage = totalItems === 0 ? 0 : Math.round((packedItems / totalItems) * 100);

  const updateItemField = async (id: number, field: string, value: any) => {
    // Optimistic UI update
    const updatedItems = items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    mutate({ items: updatedItems }, false);

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
  };

  const handleInlineAdd = async (category: string, item: string, quantity: string) => {
    if (!item.trim()) return;
    // Optimistic UI for new item isn't perfectly safe without knowing ID, so just mutate after
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
  };

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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-gray-50/80 rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex-1 flex justify-between sm:justify-start items-center gap-4">
              <div className="text-sm font-medium text-gray-700 whitespace-nowrap shrink-0">
                {packedItems} of {totalItems}
              </div>
              <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden max-w-[200px] sm:max-w-none">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500 ease-out" 
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
            <div className="flex shrink-0 sm:border-l border-gray-200 sm:pl-4 justify-end items-center">
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
              const allCategories = Object.keys(categories);
              const enabledCount = allCategories.filter(c => !disabledFilters.has(c)).length;
              const isGreen = enabledCount > 0;
              const toggleAll = () => {
                if (isGreen) {
                  setDisabledFilters(new Set(allCategories));
                } else {
                  setDisabledFilters(new Set());
                }
              };
              return (
                <button
                  onClick={toggleAll}
                  className={`flex items-center justify-center w-[30px] h-[30px] rounded-full transition-all border shrink-0 ${isGreen ? 'bg-[#bbf7d0] text-emerald-800 border-[#99f6b4] shadow-sm ring-1 ring-black/5' : 'bg-gray-100 text-gray-400 border-gray-200 shadow-inner'}`}
                  title={isGreen ? "Deselect all" : "Select all"}
                >
                  <Check size={16} strokeWidth={isGreen ? 3 : 2} />
                </button>
              );
            })()}
            {Object.keys(categories).map((filterCat) => {
              const cc = getCategoryColor(filterCat);
              const isActive = !disabledFilters.has(filterCat);
              return (
                <button 
                  key={filterCat} 
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${isActive ? 'text-gray-900 shadow-md border-black/10 ring-1 ring-black/5 opacity-100 font-semibold' : 'text-gray-500 border-transparent bg-gray-100 shadow-sm opacity-60 hover:opacity-80'}`}
                  style={isActive ? { backgroundColor: cc } : {}}
                  onClick={() => {
                    const next = new Set(disabledFilters);
                    if (isActive) next.add(filterCat);
                    else next.delete(filterCat);
                    setDisabledFilters(next);
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
            .filter(([category]) => !disabledFilters.has(category))
            .map(([category, catItems]) => {
              const color = getCategoryColor(category);
              return (
                <div key={category} className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ '--cat-color': color } as React.CSSProperties}>
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
                    {catItems.map((item) => {
                      const hidden = !showPacked && item.packed;
                      return (
                        <div 
                          key={item.id}
                          className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${hidden ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}
                        >
                          <div className="overflow-hidden">
                            <div 
                              className={`mb-3 flex items-center bg-white rounded-xl p-4 ring-1 ring-gray-900/5 shadow-sm transition-all duration-200 ${item.packed ? 'opacity-60 bg-gray-50' : ''}`}
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
                      </div>
                    </div>
                  </div>
              );
            })}
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
                </div>
              );
          })}
        </div>
      </div>
    </div>
  );
}
