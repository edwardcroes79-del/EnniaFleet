import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

type ReminderResult = {
  sent: number;
  skipped: number;
  errors: string[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ReminderResult | { error: string }>) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.CRON_SECRET;
  const providedSecret = req.headers["x-cron-secret"] || req.query.secret;
  if (secret && providedSecret !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Supabase service configuration missing" });
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const today = new Date();
  const target = new Date(today);
  target.setMonth(target.getMonth() + 3);

  const startOfDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).toISOString();
  const endOfDay = new Date(target.getFullYear(), target.getMonth(), target.getDate() + 1).toISOString();

  const { data: assignments, error: assignmentsError } = await adminClient
    .from("assignments")
    .select("id, expected_return_date, vehicle:vehicles(id, vehicle_id, make, model), employee:profiles!employee_id(id, full_name, email)")
    .eq("is_active", true)
    .gte("expected_return_date", startOfDay)
    .lt("expected_return_date", endOfDay);

  if (assignmentsError) {
    return res.status(500).json({ error: assignmentsError.message });
  }

  const { data: settingsRows, error: settingsError } = await adminClient
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

  const result: ReminderResult = { sent: 0, skipped: 0, errors: [] };

  for (const a of assignments || []) {
    const employeeArr = a.employee as unknown as Array<{ full_name: string; email: string }> | null;
    const vehicleArr = a.vehicle as unknown as Array<{ vehicle_id: string; make: string; model: string }> | null;
    const employee = employeeArr?.[0] ?? null;
    const vehicle = vehicleArr?.[0] ?? null;
    const email = employee?.email;
    const expectedReturn = a.expected_return_date;

    if (!email || !expectedReturn) {
      result.skipped++;
      continue;
    }

    const { data: existingRows } = await adminClient
      .from("email_reminders")
      .select("id")
      .eq("assignment_id", a.id)
      .eq("reminder_type", "three_month_return")
      .limit(1);

    if (existingRows && existingRows.length > 0) {
      result.skipped++;
      continue;
    }

    const vehicleLabel = vehicle ? `${vehicle.vehicle_id} — ${vehicle.make} ${vehicle.model}` : "your assigned vehicle";

    const subject = subjectTemplate
      .replace(/{{employee_name}}/g, employee.full_name)
      .replace(/{{vehicle}}/g, vehicleLabel)
      .replace(/{{expected_return_date}}/g, new Date(expectedReturn).toLocaleDateString());

    const body = bodyTemplate
      .replace(/{{employee_name}}/g, employee.full_name)
      .replace(/{{vehicle}}/g, vehicleLabel)
      .replace(/{{expected_return_date}}/g, new Date(expectedReturn).toLocaleDateString());

    const { sent, error: sendError } = await sendEmail({ to: email, subject, text: body });

    if (!sent) {
      await adminClient.from("email_reminders").insert({
        assignment_id: a.id,
        reminder_type: "three_month_return",
        recipient_email: email,
        status: "failed",
        error_message: sendError || "Unknown send error",
      });
      result.errors.push(`Failed to send to ${email}: ${sendError}`);
      continue;
    }

    const { error: insertErr } = await adminClient.from("email_reminders").insert({
      assignment_id: a.id,
      reminder_type: "three_month_return",
      recipient_email: email,
      status: "sent",
    });
    if (insertErr) {
      result.errors.push(`Sent to ${email} but failed to record reminder: ${insertErr.message}`);
    } else {
      result.sent++;
    }
  }

  return res.status(200).json(result);
}