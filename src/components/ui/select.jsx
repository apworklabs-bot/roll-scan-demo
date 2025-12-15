import React, { useState } from "react";

// Container για το select – απλά τυλίγει το περιεχόμενο
export function Select({ value, onValueChange, children, className = "" }) {
  const [open, setOpen] = useState(false);

  const context = {
    value,
    onValueChange,
    open,
    setOpen,
  };

  // περνάμε context στα παιδιά
  return (
    <div className={`relative inline-block text-left ${className}`}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? React.cloneElement(child, context) : child
      )}
    </div>
  );
}

export function SelectTrigger({
  value,
  placeholder,
  open,
  setOpen,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={() => setOpen && setOpen(!open)}
      className={`inline-flex w-full justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 ${className}`}
    >
      <span>{value || placeholder}</span>
      <span className="ml-2 text-gray-400">▾</span>
    </button>
  );
}

export function SelectContent({ open, children, className = "" }) {
  if (!open) return null;

  return (
    <div
      className={`absolute z-20 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-auto ${className}`}
    >
      {children}
    </div>
  );
}

export function SelectItem({
  children,
  value: itemValue,
  value,
  onValueChange,
  setOpen,
  className = "",
}) {
  const selected = value === itemValue;

  return (
    <button
      type="button"
      onClick={() => {
        onValueChange && onValueChange(itemValue);
        setOpen && setOpen(false);
      }}
      className={`block w-full text-left px-3 py-2 text-sm hover:bg-orange-50 ${
        selected ? "bg-orange-50 text-orange-700" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}

// Χρησιμοποιείται για να εμφανίζει την τιμή στο Trigger
export function SelectValue({ value, placeholder }) {
  return <span>{value || placeholder}</span>;
}
