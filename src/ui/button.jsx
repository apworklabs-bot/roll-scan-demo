import React from "react";

const baseClasses =
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2";

const variants = {
  default:
    "bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500",
  outline:
    "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 focus:ring-gray-300",
  ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-200",
};

export function Button({
  className = "",
  variant = "default",
  type = "button",
  ...props
}) {
  const variantClasses = variants[variant] || variants.default;

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    />
  );
}
