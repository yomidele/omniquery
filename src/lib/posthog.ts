import { supabase } from "@/integrations/supabase/client";

// Track events via backend edge function (keeps PostHog API key secure)
export async function trackEvent(event: string, properties?: Record<string, any>) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    await supabase.functions.invoke("posthog-track", {
      body: {
        event,
        distinct_id: userId || "anonymous",
        properties: {
          ...properties,
          $current_url: window.location.href,
          email: session?.user?.email,
        },
      },
    });
  } catch {
    // Silent fail — analytics should never block UX
  }
}

export function identifyUser(userId: string, traits?: Record<string, any>) {
  trackEvent("$identify", { $set: traits, distinct_id: userId });
}
