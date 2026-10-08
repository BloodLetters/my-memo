"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  const applyTheme = (t: Theme) => {
    if (typeof document === "undefined") return;
    if (t === "dark") {
      document.documentElement.classList.add("dark");
      document.body?.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body?.classList.remove("dark");
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("memo-theme") as Theme | null;
    let initial: Theme = "light";
    if (savedTheme === "dark" || savedTheme === "light") {
      initial = savedTheme;
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      initial = prefersDark ? "dark" : "light";
    }
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("memo-theme", newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
