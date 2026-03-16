import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "We sent a password reset link to your email." });
    }
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center mb-8">
        <BookOpen className="h-10 w-10 text-accent mb-3" />
        <h1 className="text-3xl font-bold text-accent tracking-wider" style={{ fontFamily: "'Merriweather', serif" }}>
          OMNIQUERY
        </h1>
      </div>

      <div className="w-full max-w-md bg-card/5 border border-border/20 rounded-xl p-8 backdrop-blur-sm">
        <h2 className="text-xl font-semibold text-accent text-center font-display tracking-wide mb-4" style={{ fontFamily: "'Merriweather', serif", fontVariant: "small-caps" }}>
          Reset Password
        </h2>
        <p className="text-sm text-primary-foreground/50 text-center mb-6 font-display">
          Enter your email and we'll send a reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full h-12 rounded-lg border border-border/30 bg-primary/50 px-4 text-primary-foreground font-display text-sm outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
            required
          />
          <Button type="submit" disabled={loading} className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-display">
            {loading ? "Sending…" : "Send Reset Link"}
          </Button>
        </form>

        <p className="text-center text-sm text-primary-foreground/40 mt-6 font-display">
          <Link to="/login" className="text-accent hover:underline">Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
