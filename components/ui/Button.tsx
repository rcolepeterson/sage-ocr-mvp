// components/ui/Button.tsx
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "text" | "disabled" | "inverted";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = "font-body font-medium transition-all duration-200";

  const variants = {
    primary:
      "bg-[var(--color-swansons-navy)] text-white hover:bg-[color-mix(in_srgb,var(--color-swansons-navy)_90%,black)] shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer",
    secondary:
      "bg-transparent text-[var(--color-swansons-navy)] border-2 border-[var(--color-swansons-navy)] hover:bg-[var(--color-swansons-navy)] hover:text-white active:scale-[0.98] cursor-pointer",
    text: "text-[var(--color-swansons-navy)] underline underline-offset-4 hover:opacity-80 cursor-pointer",
    disabled:
      "bg-swansons-navy/30 text-white/50 border-2 border-transparent cursor-not-allowed",
    inverted:
      "bg-transparent text-white border-2 border-white hover:bg-white/10 active:scale-[0.98] cursor-pointer",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm rounded-full w-[260px]",
    md: "px-6 py-3 text-base rounded-full w-[260px]",
    lg: "px-8 py-4 text-lg rounded-full w-[260px]",
  };

  // Auto-apply disabled variant if disabled prop is true
  const appliedVariant = disabled ? "disabled" : variant;

  const classes =
    `${baseStyles} ${variants[appliedVariant]} ${sizes[size]} ${className}`.trim();

  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
