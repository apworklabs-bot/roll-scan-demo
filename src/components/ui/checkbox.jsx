// src/components/ui/checkbox.jsx
import * as React from "react";

export function Checkbox({ checked = false, onChange, label, className = "" }) {
  return (
    <label className={"inline-flex items-center space-x-2 cursor-pointer " + className}>
      <input
        type="checkbox"
        className="w-5 h-5 rounded border-gray-400 cursor-pointer"
        checked={checked}
        onChange={(e) => onChange && onChange(e.target.checked)}
      />
      {label && <span className="text-sm text-gray-800">{label}</span>}
    </label>
  );
}
