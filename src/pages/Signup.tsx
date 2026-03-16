import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !displayName.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: displayName.trim() },
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account created!", description: "You can now sign in." });
      navigate("/research");
    }
  };

  const handleGoogle = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast({ title: "Google sign-in failed", description: String(error), variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center mb-8">
        <BookOpen className="h-10 w-10 text-accent mb-3" />
        <h1 className="text-4xl md:text-5xl font-bold text-accent tracking-wider" style={{ fontFamily: "'Merriweather', serif" }}>
          OMNIQUERY
        </h1>
        <p className="text-primary-foreground/50 text-sm italic font-display mt-1">
          Your AI Research Assistant
        </p>
      </div>

      <div className="w-full max-w-md bg-card/5 border border-border/20 rounded-xl p-8 backdrop-blur-sm">
        <h2 className="text-xl font-semibold text-accent text-center font-display tracking-wide mb-6" style={{ fontFamily: "'Merriweather', serif", fontVariant: "small-caps" }}>
          Create Account
        </h2>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="text-sm text-primary-foreground/80 font-display mb-1.5 block">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full h-12 rounded-lg border border-border/30 bg-primary/50 px-4 text-primary-foreground font-display text-sm outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
              required
            />
          </div>
          <div>
            <label className="text-sm text-primary-foreground/80 font-display mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 rounded-lg border border-border/30 bg-primary/50 px-4 text-primary-foreground font-display text-sm outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
              required
            />
          </div>
          <div>
            <label className="text-sm text-primary-foreground/80 font-display mb-1.5 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 rounded-lg border border-border/30 bg-primary/50 px-4 pr-12 text-primary-foreground font-display text-sm outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
                required
                minLength={6}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-foreground/40 hover:text-primary-foreground/70">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-base font-display font-semibold tracking-wide bg-gradient-to-r from-accent to-accent/80 text-accent-foreground hover:from-accent/90 hover:to-accent/70"
            style={{ fontVariant: "small-caps" }}
          >
            {loading ? "Creating Account…" : "Sign Up"}
          </Button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border/20" />
          <span className="text-xs text-primary-foreground/30 font-display">OR</span>
          <div className="flex-1 h-px bg-border/20" />
        </div>

        <Button
          variant="outline"
          onClick={handleGoogle}
          className="w-full h-12 border-border/30 bg-primary-foreground/5 text-primary-foreground hover:bg-primary-foreground/10 font-display"
        >
          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign Up with Google
        </Button>

        <p className="text-center text-sm text-primary-foreground/40 mt-6 font-display">
          Already have an account?{" "}
          <Link to="/login" className="text-accent hover:underline font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
