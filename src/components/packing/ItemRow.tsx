import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { Check, BaggageClaim, Trash2, LoaderCircle, Pencil, X, ChevronDown } from 'lucide-react';
import { Item } from '@/types/packing';
import { matchIcon, getCategoryColor } from '@/utils/packing-utils';

interface ItemRowProps {
  item: Item;
  color: string;
  showPacked: boolean;
  allCategories: string[];
  updateItemField: (id: number, field: string, value: any) => void;
  deleteItem: (id: number) => void;
}

export const ItemRow = memo(({ item, color, showPacked, allCategories, updateItemField, deleteItem }: ItemRowProps) => {
  const controls = useAnimation();
  const x = useMotionValue(0);
  const packOpacity = useTransform(x, [0, 30], [0, 1]);
  const deleteOpacity = useTransform(x, [0, -30], [0, 1]);
  const [isEditing, setIsEditing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Local state for editing to allow "Cancel"
  const [editValues, setEditValues] = useState({
    item: item.item,
    notes: item.notes,
    quantity: item.quantity,
    category: item.category
  });

  // Sync local state if item changes from outside while not editing
  useEffect(() => {
    if (!isEditing) {
      setEditValues({
        item: item.item,
        notes: item.notes,
        quantity: item.quantity,
        category: item.category
      });
    }
  }, [item, isEditing]);

  const handleSave = () => {
    // Only update fields that actually changed
    if (editValues.item !== item.item) updateItemField(item.id, 'item', editValues.item);
    if (editValues.notes !== item.notes) updateItemField(item.id, 'notes', editValues.notes);
    if (editValues.quantity !== item.quantity) updateItemField(item.id, 'quantity', editValues.quantity);
    if (editValues.category !== item.category) updateItemField(item.id, 'category', editValues.category);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValues({
      item: item.item,
      notes: item.notes,
      quantity: item.quantity,
      category: item.category
    });
    setIsEditing(false);
    setIsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDragEnd = useCallback(async (e: any, info: any) => {
    if (item.loading || isEditing) return;
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
  }, [item.id, item.packed, showPacked, updateItemField, deleteItem, controls, isEditing]);

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
      className={`relative group mb-3 rounded-xl ${isEditing || isDropdownOpen ? 'z-50' : 'z-0'}`}
    >
      {/* BACKGROUND ACTION LAYER */}
      <div className="absolute inset-0 flex items-center justify-between px-6 rounded-xl">
        <motion.div 
          className="flex items-center gap-2 text-emerald-600 font-medium"
          style={{ opacity: packOpacity }}
        >
           <BaggageClaim size={20} strokeWidth={2.5} />
           <span className="text-sm hidden sm:inline-block">Pack</span>
        </motion.div>
        <motion.div 
          className="flex items-center gap-2 text-red-500 font-medium tracking-wide"
          style={{ opacity: deleteOpacity }}
        >
           <span className="text-sm hidden sm:inline-block">Delete</span>
           <Trash2 size={20} strokeWidth={2.5} />
        </motion.div>
      </div>

      {/* FOREGROUND SWIPEABLE LAYER */}
      <motion.div 
        drag={(!item.loading && !isEditing) ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        dragTransition={{ bounceStiffness: 600, bounceDamping: 30 }}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x, touchAction: 'pan-y', willChange: 'transform' }}
        className={`relative z-10 flex items-center bg-white rounded-xl p-4 transition-[opacity,box-shadow,background-color,border-color] duration-200 ${item.packed ? 'bg-gray-100' : ''} ${isEditing ? 'ring-2 ring-emerald-500 shadow-lg scale-[1.01]' : 'shadow-sm'}`}
      >
          {/* Checkbox (Hidden in Edit Mode) */}
          {!isEditing && (
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
          )}
          
          {/* Icon Block / Category Dropdown Trigger */}
          <div className="relative" ref={dropdownRef}>
            <div 
              className={`mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-gray-900/10 transition-transform ${isEditing ? 'cursor-pointer hover:scale-105 active:scale-95 shadow-md' : ''}`}
              style={{ backgroundColor: item.loading ? '#f9fafb' : (isEditing ? getCategoryColor(editValues.category) : color) }}
              onClick={() => isEditing && setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="text-gray-800/70">
                {item.loading ? <LoaderCircle size={20} className="animate-spin text-gray-400" /> : matchIcon(isEditing ? editValues.category : item.item, 20)}
              </span>
              {isEditing && (
                <div className="absolute bottom-0 right-0 bg-white rounded-full shadow-sm ring-1 ring-black/10 p-0.5 pointer-events-none translate-x-1/4 translate-y-1/4">
                  <ChevronDown size={10} className="text-gray-500" />
                </div>
              )}
            </div>

            {/* CUSTOM CATEGORY DROPDOWN */}
            {isDropdownOpen && (
              <div className="absolute top-12 left-0 z-50 min-w-[200px] bg-white rounded-xl shadow-xl ring-1 ring-black/10 p-1.5 animate-in fade-in zoom-in-95 duration-100 origin-top-left">
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {allCategories.map((cat) => (
                    <button
                      key={cat}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-50 group ${editValues.category === cat ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'}`}
                      onClick={() => {
                        setEditValues({ ...editValues, category: cat });
                        setIsDropdownOpen(false);
                      }}
                    >
                      <div 
                        className="h-6 w-6 rounded flex items-center justify-center shrink-0 ring-1 ring-inset ring-black/5"
                        style={{ backgroundColor: getCategoryColor(cat) }}
                      >
                        {matchIcon(cat, 14)}
                      </div>
                      <span className="truncate">{cat}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0 pr-4">
            {isEditing ? (
              <div className="flex flex-col gap-1.5">
                <input 
                  autoFocus
                  className="w-full text-base font-semibold leading-6 bg-gray-50 rounded px-2 py-0.5 outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all"
                  value={editValues.item}
                  onChange={(e) => setEditValues({ ...editValues, item: e.target.value })}
                  placeholder="Item name"
                />
                <input 
                  className="w-full text-sm leading-5 text-gray-500 bg-gray-50 rounded px-2 py-0.5 outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                  value={editValues.notes}
                  onChange={(e) => setEditValues({ ...editValues, notes: e.target.value })}
                  placeholder="Add notes..."
                />
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Quantity & Actions */}
          <div className="shrink-0 flex items-center gap-3">
            {/* Quantity */}
            <div className={`inline-flex items-center justify-center rounded-md ring-1 ring-inset transition-all ${isEditing ? 'bg-white ring-emerald-500 shadow-sm' : 'bg-gray-100 ring-gray-500/10'}`}>
              {isEditing ? (
                <input 
                  type="text"
                  className="w-10 text-center bg-transparent outline-none m-0 py-1 text-sm font-semibold text-gray-900"
                  value={editValues.quantity}
                  onChange={(e) => setEditValues({ ...editValues, quantity: e.target.value })}
                  placeholder="1"
                />
              ) : (
                <span className="px-2 py-0.5 text-sm font-medium text-gray-900">
                  {item.quantity || '1'}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleSave}
                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors active:scale-95"
                    title="Save"
                  >
                    <Check size={20} strokeWidth={2.5} />
                  </button>
                  <button 
                    onClick={handleCancel}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors active:scale-95"
                    title="Cancel"
                  >
                    <X size={20} strokeWidth={2.5} />
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors md:opacity-0 group-hover:opacity-100 active:scale-95"
                  title="Edit item"
                >
                  <Pencil size={16} />
                </button>
              )}
            </div>
          </div>
      </motion.div>
    </motion.div>
  );
});

ItemRow.displayName = 'ItemRow';
