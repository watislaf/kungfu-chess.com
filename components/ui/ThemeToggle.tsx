"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700/50"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <>
          <Sun className="h-4 w-4 mr-2" />
          Light
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 mr-2" />
          Dark
        </>
      )}
    </Button>
  );
}
