import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery type in URL hash
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      navigate("/login");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) return;
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      navigate("/login");
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
        <h2 className="text-xl font-semibold text-accent text-center font-display tracking-wide mb-6" style={{ fontFamily: "'Merriweather', serif", fontVariant: "small-caps" }}>
          Set New Password
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (min 6 characters)"
            className="w-full h-12 rounded-lg border border-border/30 bg-primary/50 px-4 text-primary-foreground font-display text-sm outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
            required
            minLength={6}
          />
          <Button type="submit" disabled={loading} className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-display">
            {loading ? "Updating…" : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
