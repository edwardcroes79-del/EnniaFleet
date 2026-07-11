import type { NextApiRequest, NextApiResponse } from "next";
import { createClient, type User } from "@supabase/supabase-js";

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

  const resendKey = process.env.RESEND_API_KEY;
  let sent = false;

  if (resendKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL || "noreply@fleetcommand.app",
          to: user.email,
          subject,
          text: body,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        return res.status(500).json({ error: `Failed to send test email: ${JSON.stringify(err)}` });
      }
      sent = true;
    } catch (err) {
      return res.status(500).json({ error: `Exception sending test email: ${err instanceof Error ? err.message : String(err)}` });
    }
  } else {
    console.log(`[send-test-reminder] Would send test email to ${user.email}:\n${subject}\n${body}`);
    sent = true;
  }

  return res.status(200).json({
    sent,
    recipient: user.email || "",
    subject,
    body,
    note: resendKey ? undefined : "RESEND_API_KEY not configured; email logged to server console instead.",
  });
}