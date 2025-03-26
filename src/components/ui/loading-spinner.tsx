
import React from "react";
import { cn } from "@/lib/utils";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
type Variant = "default" | "primary" | "secondary" | "accent" | "brand";

interface LoadingSpinnerProps {
  size?: Size;
  variant?: Variant;
  className?: string;
  text?: string;
  textClassName?: string;
}

const sizeClasses: Record<Size, string> = {
  xs: "h-3 w-3 border-[1.5px]",
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-2",
  xl: "h-12 w-12 border-3",
};

const variantClasses: Record<Variant, string> = {
  default: "border-muted-foreground/30 border-r-muted-foreground/80",
  primary: "border-primary/30 border-r-primary",
  secondary: "border-secondary/30 border-r-secondary-foreground",
  accent: "border-brand-secondary/30 border-r-brand-secondary",
  brand: "border-brand-primary/30 border-r-brand-primary",
};

export const LoadingSpinner = ({
  size = "md",
  variant = "primary",
  className,
  text,
  textClassName,
}: LoadingSpinnerProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full",
          sizeClasses[size],
          variantClasses[variant]
        )}
        aria-label="Loading"
        role="status"
      />
      {text && (
        <p className={cn("mt-2 text-sm text-muted-foreground", textClassName)}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
