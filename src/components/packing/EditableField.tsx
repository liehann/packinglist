'use client';

import React, { useState, useEffect } from 'react';

interface EditableFieldProps {
  value: string;
  placeholder: string;
  className: string;
  onSave: (v: string) => void;
}

export const EditableField = ({ value, placeholder, className, onSave }: EditableFieldProps) => {
  const [val, setVal] = useState(value);
  
  // Sync state if external value changes
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
      onKeyDown={e => { if(e.key === 'Enter') e.currentTarget.blur() }} 
      className={`bg-transparent outline-none ring-0 focus:bg-black/5 rounded transition-colors ${isQty ? '' : 'w-full px-1 -mx-1'} ${className}`} 
      style={isQty ? { width: `${Math.max(1, val.toString().length) + 0.5}ch` } : {}}
      placeholder={placeholder} 
    />
  );
};
