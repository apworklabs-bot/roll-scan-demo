// src/components/ui/table.jsx
import * as React from "react";

export function Table({ className = "", ...props }) {
  return (
    <table
      className={
        "min-w-full border-collapse text-sm text-left " + className
      }
      {...props}
    />
  );
}

export function TableHeader({ className = "", ...props }) {
  return (
    <thead
      className={
        "bg-gray-50 border-b " + className
      }
      {...props}
    />
  );
}

export function TableBody({ className = "", ...props }) {
  return <tbody className={className} {...props} />;
}

export function TableRow({ className = "", ...props }) {
  return (
    <tr
      className={
        "border-b last:border-0 hover:bg-gray-50/60 " + className
      }
      {...props}
    />
  );
}

export function TableHead({ className = "", ...props }) {
  return (
    <th
      className={
        "px-3 py-2 text-xs font-semibold text-gray-600 " + className
      }
      {...props}
    />
  );
}

export function TableCell({ className = "", ...props }) {
  return (
    <td
      className={
        "px-3 py-2 align-middle text-gray-800 " + className
      }
      {...props}
    />
  );
}
