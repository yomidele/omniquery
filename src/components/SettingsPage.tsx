import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Lock, Bell, Palette, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SettingsPage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Notifications
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [researchAlerts, setResearchAlerts] = useState(true);

  // Theme
  const [currentTheme, setCurrentTheme] = useState<string>("system");

  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setDisplayName(data.display_name || "");
        setAvatarUrl(data.avatar_url || "");
      }
    };
    loadProfile();

    // Load theme
    const saved = localStorage.getItem("omniquery-theme") || "system";
    setCurrentTheme(saved);

    // Load notification prefs
    const notifPrefs = localStorage.getItem("omniquery-notif-prefs");
    if (notifPrefs) {
      try {
        const parsed = JSON.parse(notifPrefs);
        setEmailNotifs(parsed.email ?? true);
        setResearchAlerts(parsed.research ?? true);
      } catch {}
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, display_name: displayName, avatar_url: avatarUrl, updated_at: new Date().toISOString() });
      if (error) throw error;

      // Also update auth metadata
      await supabase.auth.updateUser({ data: { display_name: displayName } });
      toast.success("Profile updated successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast.error(e.message || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveNotifications = () => {
    localStorage.setItem("omniquery-notif-prefs", JSON.stringify({ email: emailNotifs, research: researchAlerts }));
    toast.success("Notification preferences saved");
  };

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    localStorage.setItem("omniquery-theme", theme);
    const root = document.documentElement;
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else if (theme === "light") {
      root.removeAttribute("data-theme");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) root.setAttribute("data-theme", "dark");
      else root.removeAttribute("data-theme");
    }
    toast.success(`Theme set to ${theme}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-foreground font-display">Settings</h1>

      {/* Profile */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Profile</CardTitle>
          </div>
          <CardDescription>Update your display name and profile info</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
            <Input value={user?.email || ""} disabled className="bg-muted/50" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Display Name</label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Password</CardTitle>
          </div>
          <CardDescription>Change your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">New Password</label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Confirm Password</label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button onClick={handleChangePassword} disabled={changingPassword || !newPassword} variant="outline" className="gap-2">
            {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Notifications</CardTitle>
          </div>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow label="Email notifications" description="Receive updates via email" checked={emailNotifs} onChange={setEmailNotifs} />
          <ToggleRow label="Research alerts" description="Get notified when research completes" checked={researchAlerts} onChange={setResearchAlerts} />
          <Button onClick={handleSaveNotifications} variant="outline" className="gap-2">
            <Check className="h-4 w-4" /> Save Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Appearance</CardTitle>
          </div>
          <CardDescription>Choose your preferred theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {(["light", "dark", "system"] as const).map((theme) => (
              <button
                key={theme}
                onClick={() => handleThemeChange(theme)}
                className={`px-4 py-3 rounded-xl border text-sm font-medium capitalize transition-all ${
                  currentTheme === theme
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30"
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}
