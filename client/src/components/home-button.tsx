import { ElementType, ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const button = tv({
  base: "flex flex-1 transform items-center justify-center gap-3 rounded-2xl px-6 py-4 text-lg font-bold transition-all duration-300 hover:-translate-y-1 sm:px-8 sm:py-5 sm:text-xl",
  variants: {
    variant: {
      primary:
        "group dark:shadow-neon dark:hover:shadow-neon-hover bg-blue-600 text-white shadow-lg hover:bg-blue-500 hover:shadow-xl",
      secondary:
        "border-2 border-slate-300 bg-white text-slate-600 hover:border-blue-500/50 hover:bg-blue-50 dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:bg-blue-900/10",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

type HomeButtonVariants = VariantProps<typeof button>;

type HomeButtonProps<T extends ElementType> = {
  as?: T;
  children?: React.ReactNode;
} & HomeButtonVariants &
  Omit<ComponentProps<T>, "as">;

export const HomeButton = <T extends ElementType = "button">({
  as,
  className,
  variant,
  children,
  ...props
}: HomeButtonProps<T>) => {
  const Component = as || "button";
  return (
    <Component className={button({ variant, className })} {...props}>
      {children}
    </Component>
  );
};
