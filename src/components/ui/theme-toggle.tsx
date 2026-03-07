
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ThemeToggle({ className, iconOnly = false, size = "md" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    if (storedTheme) {
      setTheme(storedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const root = window.document.documentElement;
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.toggle("dark", systemTheme === "dark");
    } else {
      root.classList.toggle("dark", theme === "dark");
    }
    
    localStorage.setItem("theme", theme);
  }, [theme, isMounted]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!isMounted) {
    return <div className="w-9 h-9" />; // Placeholder para evitar layout shift
  }

  const sizeClasses = {
    sm: { button: "h-8 w-8", icon: "h-4 w-4" },
    md: { button: "h-9 w-9", icon: "h-5 w-5" },
    lg: { button: "h-10 w-10", icon: "h-6 w-6" }
  };

  if (iconOnly) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className={cn(sizeClasses[size].button, className)}
        aria-label={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
      >
        {theme === "dark" ? (
          <Sun className={cn("animate-in fade-in duration-300", sizeClasses[size].icon)} />
        ) : (
          <Moon className={cn("animate-in fade-in duration-300", sizeClasses[size].icon)} />
        )}
      </Button>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Button 
        variant="outline" 
        size="sm" 
        onClick={toggleTheme}
        className={className}
      >
        {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
      </Button>
      <Moon className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </div>
  );
}

export default ThemeToggle;
