import { ReactNode } from "react";
import { cn } from "../../libs/tailwind";

interface params {
  children?: ReactNode;
  className?: string;
  variant?: "default" | "ghost" | "outline";
}

const buttonStyle = {
  default: "bg-gray-900 hover:bg-gray-800",
  ghost: "bg-transparent border-none hover:bg-[rgba(0,0,0,0.2)]",
  outline: "bg-transparent border",
};

export default function Button({
  children,
  className,
  variant = "default",
}: params) {
  return (
    <button className={cn("px-4 py-2 rounded-md transition cursor-pointer", buttonStyle[variant], className)}>
      {children}
    </button>
  );
}
