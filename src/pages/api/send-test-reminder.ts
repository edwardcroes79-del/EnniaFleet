import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

type TestReminderResult = {
  sent: boolean;
  recipient: string;
  subject: string;
  body: string;
  note?: string;
};

type TestReminderError = {
  error: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TestReminderResult | TestReminderError>) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return res.status(500).json({ error: "Supabase configuration missing" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  const token = authHeader.replace("Bearer ", "");
  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData.user) {
    return res.status(401).json({ error: userError?.message || "Invalid session" });
  }

  const user = userData.user;

  const { data: profileRows, error: profileError } = await client
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profileRows) {
    return res.status(403).json({ error: "Profile not found" });
  }

  if (profileRows.role !== "admin") {
    return res.status(403).json({ error: "Only admins can send test reminders" });
  }

  const { data: settingsRows, error: settingsError } = await client
    .from("app_settings")
    .select("reminder_email_subject, reminder_email_body")
    .order("created_at", { ascending: false })
    .limit(1);

  if (settingsError) {
    return res.status(500).json({ error: settingsError.message });
  }

  const settings = settingsRows?.[0];
  const subjectTemplate = settings?.reminder_email_subject || "Reminder: Vehicle return due in 3 months";
  const bodyTemplate = settings?.reminder_email_body || "Dear {{employee_name}}, your assigned vehicle {{vehicle}} is due for return on {{expected_return_date}}. Please make the necessary arrangements.";

  const sampleDate = new Date();
  sampleDate.setMonth(sampleDate.getMonth() + 3);

  const vehicleLabel = "ABC-123 — Sample Make Sample Model";

  const subject = subjectTemplate
    .replace(/{{employee_name}}/g, profileRows.full_name || user.email || "Admin")
    .replace(/{{vehicle}}/g, vehicleLabel)
    .replace(/{{expected_return_date}}/g, sampleDate.toLocaleDateString());

  const body = bodyTemplate
    .replace(/{{employee_name}}/g, profileRows.full_name || user.email || "Admin")
    .replace(/{{vehicle}}/g, vehicleLabel)
    .replace(/{{expected_return_date}}/g, sampleDate.toLocaleDateString());

  if (!user.email) {
    return res.status(400).json({ error: "User email not available" });
  }

  const { sent, note, error: sendError } = await sendEmail({ to: user.email, subject, text: body });

  if (!sent) {
    return res.status(500).json({ error: sendError || "Failed to send test email" });
  }

  return res.status(200).json({
    sent: true,
    recipient: user.email,
    subject,
    body,
    note,
  });
}