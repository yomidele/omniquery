import { useEffect, useState } from "react";
import { Moon, SunMedium } from "lucide-react";

const STORAGE_KEY = "omniquery-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const initial = stored === "dark" ? "dark" : "light";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-[rgba(var(--border),.8)] bg-[rgba(var(--surface),.9)] text-[rgba(var(--foreground),.9)] transition-colors duration-200 hover:bg-[rgba(var(--surface),1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent),.65)]"
    >
      {theme === "dark" ? (
        <SunMedium className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
