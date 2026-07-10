import { createContext, useContext, useState, useEffect } from "react";
import { settingsService, type AppSettings } from "@/services/settingsService";

export type { AppSettings };

interface SettingsContextType {
  settings: AppSettings | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings?: AppSettings | null;
}) {
  const [settings, setSettings] = useState<AppSettings | null>(initialSettings ?? null);
  const [loading, setLoading] = useState(!initialSettings);

  const refresh = async () => {
    const { data } = await settingsService.get();
    if (data) setSettings(data);
  };

  useEffect(() => {
    if (!initialSettings) {
      refresh().finally(() => setLoading(false));
    }
  }, [initialSettings]);

  return <SettingsContext.Provider value={{ settings, loading, refresh }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}