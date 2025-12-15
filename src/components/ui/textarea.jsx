// src/components/ui/textarea.jsx
import * as React from "react";

export const Textarea = React.forwardRef(
  ({ className = "", ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={
          "flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black " +
          "disabled:cursor-not-allowed disabled:opacity-50 " +
          className
        }
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
