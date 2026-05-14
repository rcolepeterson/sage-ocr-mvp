// components/ui/Button.tsx
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "text" | "disabled";
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
  const baseStyles = "font-medium transition-all duration-200";

  const variants = {
    primary:
      "bg-[#1a2456] text-white hover:bg-[#141c44] shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer",
    secondary:
      "bg-transparent text-[#1a2456] border-2 border-[#1a2456] hover:bg-[#1a2456] hover:text-white active:scale-[0.98] cursor-pointer",
    text: "text-[#1a2456] underline underline-offset-4 hover:opacity-80 cursor-pointer",
    disabled:
      "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm rounded-full",
    md: "px-6 py-3 text-base rounded-full",
    lg: "px-8 py-4 text-lg rounded-full",
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
