import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 h-16 bg-[rgb(var(--surface))] border-b border-[rgba(var(--border),.65)] backdrop-blur backdrop-saturate-150">
      <div className="mx-auto flex h-full max-w-[1100px] items-center justify-between px-8">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-[rgb(var(--foreground))]">OmniQuery</h1>
          <p className="text-xs text-[rgb(var(--muted-foreground))]">Premium AI Research Operating System</p>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
