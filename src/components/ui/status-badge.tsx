
import React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-background text-foreground ring-border",
        primary:
          "bg-primary/10 text-primary ring-primary/20",
        success:
          "bg-green-500/10 text-green-500 dark:text-green-400 ring-green-500/20",
        warning:
          "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 ring-yellow-500/20",
        error:
          "bg-red-500/10 text-red-500 ring-red-500/20",
        info:
          "bg-blue-500/10 text-blue-500 ring-blue-500/20",
        brand:
          "bg-brand-primary/10 text-brand-primary ring-brand-primary/20",
      },
      size: {
        sm: "px-1.5 py-0.5 text-[10px]",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
      active: {
        true: "",
      },
    },
    compoundVariants: [
      {
        active: true,
        variant: "success",
        className: "animate-pulse",
      },
      {
        active: true,
        variant: "warning",
        className: "animate-pulse",
      },
      {
        active: true,
        variant: "error",
        className: "animate-pulse",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  icon?: React.ReactNode;
}

function StatusBadge({
  className,
  variant,
  active,
  size,
  icon,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <div
      className={cn(statusBadgeVariants({ variant, size, active }), className)}
      {...props}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </div>
  );
}

export { StatusBadge, statusBadgeVariants };
