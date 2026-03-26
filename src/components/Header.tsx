import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  userEmail?: string;
  onSignOut?: () => void;
  showAuth?: boolean;
}

export function Header({ userEmail, onSignOut, showAuth = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 h-14 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">O</span>
          </div>
          <span className="text-base font-bold tracking-tight text-foreground font-display">OmniQuery</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {showAuth && !userEmail && (
            <>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                <Link to="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </>
          )}
          {userEmail && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground px-2">
                <User className="h-3.5 w-3.5" />
                <span className="max-w-[120px] truncate">{userEmail}</span>
              </div>
              {onSignOut && (
                <Button variant="ghost" size="icon" onClick={onSignOut} className="h-9 w-9 text-muted-foreground hover:text-foreground">
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
