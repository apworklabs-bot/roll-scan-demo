import * as React from "react";

export function TooltipProvider({ children }) {
  // απλό wrapper – για αρχή δεν κάνει κάτι έξυπνο
  return children;
}

export function Tooltip({ children }) {
  // container για trigger + content
  return <div className="relative inline-block">{children}</div>;
}

export function TooltipTrigger({ children, ...props }) {
  // χρησιμοποιείται σαν κουμπί ή οποιοδήποτε trigger
  return (
    <button type="button" {...props}>
      {children}
    </button>
  );
}

export function TooltipContent({ children }) {
  // απλό box για το περιεχόμενο του tooltip
  return (
    <div className="absolute z-50 mt-2 rounded-md border bg-white px-2 py-1 text-xs shadow">
      {children}
    </div>
  );
}
