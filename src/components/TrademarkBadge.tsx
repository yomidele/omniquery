import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
import { useEffect, useState } from "react";

interface TrademarkBadgeProps {
  size?: "sm" | "md";
}

export function TrademarkBadge({ size = "sm" }: TrademarkBadgeProps) {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute("data-theme") || "light");

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute("data-theme") || "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const imgSize = size === "sm" ? "h-5 w-5" : "h-7 w-7";

  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="text-[10px] tracking-wide">Built by</span>
      <img
        src={theme === "dark" ? logoDark : logoLight}
        alt="Trademark"
        className={`${imgSize} object-contain`}
      />
    </span>
  );
}
