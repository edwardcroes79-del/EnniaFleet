import { supabase } from "@/integrations/supabase/client";

export interface AppSettings {
  id: string;
  company_name: string;
  logo_url: string | null;
  currency: string;
  reminder_email_subject: string;
  reminder_email_body: string;
}

export const settingsService = {
  async get(): Promise<{ data: AppSettings | null; error: Error | null }> {
    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { data: data as AppSettings | null, error };
  },
  async upsert(values: Partial<Omit<AppSettings, "id">>): Promise<{ data: AppSettings | null; error: Error | null }> {
    const { data: existing, error: readErr } = await this.get();
    if (readErr) return { data: null, error: readErr };
    if (existing) {
      const { data, error } = await supabase
        .from("app_settings")
        .update(values)
        .eq("id", existing.id)
        .select()
        .single();
      return { data: data as AppSettings | null, error };
    }
    const { data, error } = await supabase
      .from("app_settings")
      .insert({
        company_name: values.company_name || "FleetCommand",
        currency: values.currency || "AWG",
        logo_url: values.logo_url || null,
        reminder_email_subject: values.reminder_email_subject || "Reminder: Vehicle return due in 3 months",
        reminder_email_body: values.reminder_email_body || "Dear {{employee_name}}, your assigned vehicle {{vehicle}} is due for return on {{expected_return_date}}. Please make the necessary arrangements.",
      })
      .select()
      .single();
    return { data: data as AppSettings | null, error };
  },
  async uploadLogo(file: File): Promise<{ publicUrl: string | null; error: Error | null }> {
    const ext = file.name.split(".").pop() || "png";
    const path = `logo.${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("logos").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });
    if (error) return { publicUrl: null, error };
    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    return { publicUrl: data.publicUrl, error: null };
  },
};