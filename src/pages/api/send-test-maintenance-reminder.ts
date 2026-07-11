import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

type TestMaintenanceReminderResult = {
  sent: boolean;
  recipient: string;
  subject: string;
  body: string;
  note?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TestMaintenanceReminderResult | { error: string }>) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return res.status(500).json({ error: "Supabase configuration missing" });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { data: userProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (profileError || userProfile?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { data: settingsRows, error: settingsError } = await supabase
    .from("app_settings")
    .select("service_reminder_email_subject, service_reminder_email_body")
    .order("created_at", { ascending: false })
    .limit(1);

  if (settingsError) {
    return res.status(500).json({ error: settingsError.message });
  }

  const settings = settingsRows?.[0];
  const subject = settings?.service_reminder_email_subject || "Service reminder: {{vehicle}} is due for service soon";
  const body = settings?.service_reminder_email_body || "The vehicle {{vehicle}} is scheduled for {{service_type}} on {{next_service_due}}. Current mileage: {{mileage}}.";

  const sampleVehicle = "SAMPLE-001 — Toyota Camry (A-12345)";
  const sampleDate = new Date();
  sampleDate.setDate(sampleDate.getDate() + 14);

  const renderedSubject = subject
    .replace(/{{vehicle}}/g, sampleVehicle)
    .replace(/{{service_type}}/g, "Small service")
    .replace(/{{next_service_due}}/g, sampleDate.toLocaleDateString())
    .replace(/{{mileage}}/g, "45,000")
    .replace(/{{service_provider}}/g, "Sample Garage");

  const renderedBody = body
    .replace(/{{vehicle}}/g, sampleVehicle)
    .replace(/{{service_type}}/g, "Small service")
    .replace(/{{next_service_due}}/g, sampleDate.toLocaleDateString())
    .replace(/{{mileage}}/g, "45,000")
    .replace(/{{service_provider}}/g, "Sample Garage");

  const { sent, note, error: sendError } = await sendEmail({
    to: userData.user.email || "",
    subject: renderedSubject,
    text: renderedBody,
  });

  if (!sent) {
    return res.status(500).json({ error: sendError || "Failed to send test reminder" });
  }

  return res.status(200).json({
    sent: true,
    recipient: userData.user.email || "",
    subject: renderedSubject,
    body: renderedBody,
    note,
  });
}