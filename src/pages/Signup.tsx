import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Student");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !name.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim(), role },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0">
            {/* Left side - Illustration */}
            <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-48 w-48 bg-white rounded-full shadow-lg mb-6">
                  <div className="text-6xl">🚀</div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">OmniQuery</h3>
                <p className="text-slate-600">Your AI Research Assistant</p>
              </div>
            </div>

            {/* Right side - Form */}
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Create a new account</h1>
              <p className="text-slate-600 mb-8">Start your research journey with OmniQuery</p>

              <form onSubmit={handleSignup} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Your name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">What is your role?</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option>Student</option>
                    <option>Researcher</option>
                    <option>Teacher</option>
                    <option>Academic Advisor</option>
                    <option>Librarian</option>
                    <option>Other</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-8 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  {loading ? "Creating account…" : "Create account"}
                </Button>
              </form>

              <div className="mt-8 pt-8 border-t border-slate-200">
                <p className="text-center text-xs text-slate-600 mb-4">
                  By creating an account, you agree to our{" "}
                  <a href="#" className="text-blue-600 hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </a>
                </p>
                <p className="text-center text-sm text-slate-600">
                  Already have an account?{" "}
                  <Link to="/login" className="text-blue-600 hover:underline font-semibold">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
