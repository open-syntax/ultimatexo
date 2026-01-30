import React from "react";

export const TooltipIcon = ({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) => (
  <div className="group relative">
    {children}
    <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 rounded bg-slate-800 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-slate-700">
      {label}
      <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-800 dark:bg-slate-700" />
    </span>
  </div>
);
