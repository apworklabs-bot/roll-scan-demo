import React from "react";

export function Alert({ className = "", variant = "default", ...props }) {
  const base =
    "w-full rounded-lg border px-4 py-3 text-sm flex items-start gap-2";
  const variants = {
    default: "border-orange-200 bg-orange-50 text-orange-900",
    info: "border-blue-200 bg-blue-50 text-blue-900",
    error: "border-red-200 bg-red-50 text-red-900",
    success: "border-green-200 bg-green-50 text-green-900",
  };

  const v = variants[variant] || variants.default;

  return <div className={`${base} ${v} ${className}`} {...props} />;
}

export function AlertDescription({ className = "", ...props }) {
  return <div className={`text-sm ${className}`} {...props} />;
}
