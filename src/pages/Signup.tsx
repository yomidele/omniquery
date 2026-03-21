import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: displayName.trim() },
      },
    });
    if (error) {
      setLoading(false);
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      return;
    }
    // If auto-confirm is on, session is returned directly — user is logged in
    if (data.session) {
      navigate("/research");
    } else {
      // Fallback: sign in immediately
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setLoading(false);
      if (signInError) {
        toast({ title: "Account created but sign-in failed", description: signInError.message, variant: "destructive" });
      } else {
        navigate("/research");
      }
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
