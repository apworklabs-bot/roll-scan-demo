import React from "react";

export function Badge({ className = "", variant = "default", ...props }) {
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold";
  const variants = {
    default: "border-transparent bg-orange-500 text-white",
    outline: "border-gray-300 text-gray-700 bg-white",
  };
  const v = variants[variant] || variants.default;

  return <span className={`${base} ${v} ${className}`} {...props} />;
}
