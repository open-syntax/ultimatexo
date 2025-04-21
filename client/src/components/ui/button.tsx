import { ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "../../libs/tailwind";

type ButtonVariant = "default" | "ghost" | "outline";
type ButtonColor = "primary" | "secondary" | "accent" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  color?: ButtonColor;
}

const variantStyles: Record<ButtonVariant, string> = {
  default: "",
  ghost: `!bg-transparent !border-none`,
  outline: `!bg-transparent border`,
};

const colorStyles: Record<ButtonColor, string> = {
  primary: "bg-primary border-primary hover:bg-primary/80",
  secondary: "bg-secondary border-secondary hover:bg-secondary/80",
  accent: "bg-accent border-accent hover:bg-accent/80",
  danger: "bg-danger border-danger hover:bg-danger/80",
};

const defaultClassName = "cursor-pointer rounded-md px-4 py-2 transition text-white"; // Default text color for filled buttons

const ghostTextColor: Record<ButtonColor, string> = {
  primary: "text-primary hover:!bg-primary/40",
  secondary: "text-secondary hover:!bg-secondary/40",
  accent: "text-accent hover:!bg-accent/40",
  danger: "text-danger hover:!bg-danger/40",
};

const outlineTextColor: Record<ButtonColor, string> = {
  primary: "text-primary hover:!bg-primary hover:text-white",
  secondary: "text-secondary hover:!bg-secondary hover:text-white",
  accent: "text-accent hover:!bg-accent hover:text-white",
  danger: "text-danger hover:!bg-danger hover:text-white",
};

export default function Button({
  children,
  className,
  variant = "default",
  color = "primary",
  ...props
}: ButtonProps) {
  const variantClassName = variantStyles[variant];
  const colorClassName = colorStyles[color];
  let textColorClassName = "";

  switch (variant) {
    case "ghost":
      textColorClassName = ghostTextColor[color];
      break;
    case "outline":
      textColorClassName = outlineTextColor[color];
      break;
    default:
      textColorClassName = defaultClassName;
      break;
  }

  return (
    <button
      className={cn(defaultClassName.split(' ').filter(c => c !== 'text-white').join(' '), variantClassName, colorClassName, textColorClassName, className)}
      {...props}
    >
      {children}
    </button>
  );
}