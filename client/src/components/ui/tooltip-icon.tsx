import React from "react";

export const TooltipIcon = ({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) => {
  const tooltipId = React.useId();

  const childWithAriaDescribedBy = React.isValidElement(children)
    ? React.cloneElement<{
        "aria-describedby"?: string;
      }>(children as React.ReactElement<{ "aria-describedby"?: string }>, {
        "aria-describedby": tooltipId,
      })
    : children;

  return (
    <div className="group relative">
      {childWithAriaDescribedBy}
      <span
        className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 dark:bg-slate-700"
        id={tooltipId}
        role="tooltip"
      >
        {label}
        <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-800 dark:bg-slate-700" />
      </span>
    </div>
  );
};
