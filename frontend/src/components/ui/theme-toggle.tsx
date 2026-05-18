"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "rounded-full bg-muted border border-border animate-pulse",
          size === "sm" ? "h-8 w-14" : size === "lg" ? "h-11 w-20" : "h-9 w-16",
          className
        )}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative inline-flex items-center rounded-full transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background border",
        isDark
          ? "bg-muted border-border hover:bg-muted/80"
          : "bg-sky-100 border-sky-200 hover:bg-sky-200",
        size === "sm" ? "h-8 w-14 p-1" : size === "lg" ? "h-11 w-20 p-1.5" : "h-9 w-16 p-1",
        className
      )}
    >
      {/* Track icons */}
      <span className={cn(
        "absolute left-2 transition-all duration-300",
        size === "sm" ? "text-[10px]" : "text-xs",
        isDark ? "opacity-0 -translate-x-1" : "opacity-100"
      )}>
        <Sun className={cn("text-amber-500", size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
      </span>
      <span className={cn(
        "absolute right-2 transition-all duration-300",
        size === "sm" ? "text-[10px]" : "text-xs",
        isDark ? "opacity-100" : "opacity-0 translate-x-1"
      )}>
        <Moon className={cn("text-blue-300", size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
      </span>

      {/* Sliding thumb */}
      <span
        className={cn(
          "relative flex items-center justify-center rounded-full shadow-md transition-all duration-500 z-10",
          isDark
            ? "bg-slate-600 translate-x-full"
            : "bg-white translate-x-0",
          size === "sm"
            ? "h-6 w-6"
            : size === "lg"
            ? "h-8 w-8"
            : "h-7 w-7"
        )}
      >
        {isDark ? (
          <Moon
            className={cn(
              "text-blue-300 transition-transform duration-500 rotate-0",
              size === "sm" ? "h-3 w-3" : "h-4 w-4"
            )}
          />
        ) : (
          <Sun
            className={cn(
              "text-amber-500 transition-transform duration-500 rotate-0",
              size === "sm" ? "h-3 w-3" : "h-4 w-4"
            )}
          />
        )}
      </span>
    </button>
  );
}
