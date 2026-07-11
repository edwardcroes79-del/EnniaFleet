import { supabase } from "@/integrations/supabase/client";

export interface AppSettings {
  id: string;
  company_name: string;
  logo_url: string | null;
  currency: string;
  reminder_email_subject: string;
  reminder_email_body: string;
  service_reminder_email_subject: string;
  service_reminder_email_body: string;
}

export const settingsService = {
  async get(): Promise<{ data: AppSettings | null; error: Error | null }> {
    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) return { data: null, error };
    return { data: (data?.[0] as AppSettings) || null, error: null };
  },
  async upsert(values: Partial<Omit<AppSettings, "id">>): Promise<{ data: AppSettings | null; error: Error | null }> {
    const { data: existingRows, error: readErr } = await supabase
      .from("app_settings")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1);
    if (readErr) return { data: null, error: readErr };
    const existing = existingRows?.[0];
    if (existing?.id) {
      const { data, error } = await supabase
        .from("app_settings")
        .update(values)
        .eq("id", existing.id)
        .select("*");
      if (error) return { data: null, error };
      return { data: (data?.[0] as AppSettings) || null, error: null };
    }
    const { data, error } = await supabase
      .from("app_settings")
      .insert({
        company_name: values.company_name || "FleetCommand",
        currency: values.currency || "AWG",
        logo_url: values.logo_url || null,
        reminder_email_subject: values.reminder_email_subject || "Reminder: Vehicle return due in 3 months",
        reminder_email_body: values.reminder_email_body || "Dear {{employee_name}}, your assigned vehicle {{vehicle}} is due for return on {{expected_return_date}}. Please make the necessary arrangements.",
        service_reminder_email_subject: values.service_reminder_email_subject || "Service reminder: {{vehicle}} is due for service soon",
        service_reminder_email_body: values.service_reminder_email_body || "The vehicle {{vehicle}} is scheduled for {{service_type}} on {{next_service_due}}. Current mileage: {{mileage}}.",
      })
      .select("*");
    return { data: (data?.[0] as AppSettings) || null, error };
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
  async sendTestReminder(): Promise<{ data: { sent: boolean; recipient: string; subject: string; body: string; note?: string } | null; error: Error | null }> {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      return { data: null, error: new Error("Not authenticated") };
    }
    const response = await fetch("/api/send-test-reminder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
    });
    if (!response.ok) {
      const err = await response.json();
      return { data: null, error: new Error(err?.error || "Failed to send test reminder") };
    }
    const data = await response.json();
    return { data, error: null };
  },
  async sendTestMaintenanceReminder(): Promise<{ data: { sent: boolean; recipient: string; subject: string; body: string; note?: string } | null; error: Error | null }> {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      return { data: null, error: new Error("Not authenticated") };
    }
    const response = await fetch("/api/send-test-maintenance-reminder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
    });
    if (!response.ok) {
      const err = await response.json();
      return { data: null, error: new Error(err?.error || "Failed to send test service reminder") };
    }
    const data = await response.json();
    return { data, error: null };
  },
  async sendManualServiceReminder(maintenanceId: string): Promise<{ data: { sent: boolean; recipient: string; note?: string } | null; error: Error | null }> {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      return { data: null, error: new Error("Not authenticated") };
    }
    const response = await fetch("/api/send-manual-service-reminder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
      body: JSON.stringify({ maintenance_id: maintenanceId }),
    });
    if (!response.ok) {
      const err = await response.json();
      return { data: null, error: new Error(err?.error || "Failed to send manual service reminder") };
    }
    const data = await response.json();
    return { data, error: null };
  },
  async getReminderHistory(): Promise<{ data: { history: any[]; nextCronRun: string } | null; error: Error | null }> {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      return { data: null, error: new Error("Not authenticated") };
    }
    const response = await fetch("/api/reminder-history", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
    });
    if (!response.ok) {
      const err = await response.json();
      return { data: null, error: new Error(err?.error || "Failed to load reminder history") };
    }
    const data = await response.json();
    return { data, error: null };
  },
};