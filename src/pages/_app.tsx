import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { SettingsProvider, type AppSettings } from "@/contexts/SettingsProvider";
import { Toaster } from "@/components/ui/toaster";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { createClient } from "@supabase/supabase-js";

interface FleetAppProps extends AppProps {
  initialSettings: AppSettings | null;
}

export default function App({ Component, pageProps, initialSettings }: FleetAppProps) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="fleet-ui-theme">
      <SettingsProvider initialSettings={initialSettings}>
        <AuthProvider>
          <Component {...pageProps} />
          <Toaster />
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

App.getInitialProps = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseUrl || !serviceRoleKey) {
    return { initialSettings: null };
  }
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data } = await adminClient
    .from("app_settings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);
  return { initialSettings: (data?.[0] as AppSettings) || null };
};