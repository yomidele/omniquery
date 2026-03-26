import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer className="border-t border-border py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">O</span>
              </div>
              <span className="text-sm font-bold text-foreground">OmniQuery</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              AI-powered research assistant for academics and professionals.
            </p>
          </div>
          <div>
            <h6 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Product</h6>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link to="/research" className="hover:text-foreground transition-colors">Research</Link></li>
              <li><Link to="/api-docs" className="hover:text-foreground transition-colors">API Docs</Link></li>
            </ul>
          </div>
          <div>
            <h6 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Account</h6>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link to="/login" className="hover:text-foreground transition-colors">Log In</Link></li>
              <li><Link to="/signup" className="hover:text-foreground transition-colors">Sign Up</Link></li>
            </ul>
          </div>
          <div>
            <h6 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Legal</h6>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-6 text-center">
          <p className="text-xs text-muted-foreground">© 2026 OmniQuery. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
