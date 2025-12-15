import React from "react";

export function Alert({ className = "", children, ...props }) {
  return (
    <div
      role="alert"
      className={`border-l-4 border-yellow-500 bg-yellow-50 text-yellow-900 px-4 py-3 rounded-md text-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertTitle({ className = "", children, ...props }) {
  return (
    <div className={`font-semibold mb-1 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function AlertDescription({ className = "", children, ...props }) {
  return (
    <div className={`text-sm leading-relaxed ${className}`} {...props}>
      {children}
    </div>
  );
}
