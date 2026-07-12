import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

type MaintenanceReminderResult = {
  sent: number;
  skipped: number;
  errors: string[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<MaintenanceReminderResult | { error: string }>) {
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
  const twoWeeksFromNow = new Date(today);
  twoWeeksFromNow.setDate(today.getDate() + 14);

  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfWindow = new Date(twoWeeksFromNow.getFullYear(), twoWeeksFromNow.getMonth(), twoWeeksFromNow.getDate() + 1).toISOString();

  const { data: maintenanceRows, error: maintenanceError } = await adminClient
    .from("maintenance")
    .select(`
      id,
      service_type,
      next_service_due,
      next_service_due_mileage,
      mileage_at_service,
      cost,
      service_provider,
      vehicle:vehicles(id, vehicle_id, make, model, license_plate, mileage, is_deleted)
    `)
    .eq("is_deleted", false)
    .eq("vehicles.is_deleted", false)
    .in("service_type", ["Small service", "General service"])
    .gte("next_service_due", startOfDay)
    .lte("next_service_due", endOfWindow);

  if (maintenanceError) {
    return res.status(500).json({ error: maintenanceError.message });
  }

  const { data: settingsRows, error: settingsError } = await adminClient
    .from("app_settings")
    .select("service_reminder_email_subject, service_reminder_email_body")
    .order("created_at", { ascending: false })
    .limit(1);

  if (settingsError) {
    return res.status(500).json({ error: settingsError.message });
  }

  const settings = settingsRows?.[0];

  const subjectTemplate = settings?.service_reminder_email_subject || "Service reminder: {{vehicle}} is due for service soon";
  const bodyTemplate = settings?.service_reminder_email_body || "The vehicle {{vehicle}} is scheduled for {{service_type}} on {{next_service_due}}. Current mileage: {{mileage}}.";

  const { data: adminProfiles, error: adminsError } = await adminClient
    .from("profiles")
    .select("email")
    .eq("role", "admin");

  if (adminsError) {
    return res.status(500).json({ error: adminsError.message });
  }

  const adminEmails = (adminProfiles || []).map((p) => p.email).filter(Boolean) as string[];
  if (adminEmails.length === 0) {
    return res.status(200).json({ sent: 0, skipped: 0, errors: ["No admin emails found"] });
  }

  const result: MaintenanceReminderResult = { sent: 0, skipped: 0, errors: [] };

  for (const m of maintenanceRows || []) {
    const vehicleArr = (m as any).vehicle as unknown as Array<{ id: string; vehicle_id: string; make: string; model: string; license_plate: string; mileage: number; is_deleted?: boolean }> | null;
    const vehicle = vehicleArr?.[0] ?? null;

    if (vehicle?.is_deleted) continue;

    const nextDue = m.next_service_due;
    const serviceType = m.service_type;

    if (!nextDue) {
      result.skipped++;
      continue;
    }

    const { data: existingRows } = await adminClient
      .from("maintenance_reminders")
      .select("id")
      .eq("maintenance_id", m.id)
      .eq("reminder_type", "two_week_service")
      .limit(1);

    if (existingRows && existingRows.length > 0) {
      result.skipped++;
      continue;
    }

    const vehicleLabel = vehicle
      ? `${vehicle.vehicle_id} — ${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`
      : "a vehicle";

    const subject = subjectTemplate
      .replace(/{{vehicle}}/g, vehicleLabel)
      .replace(/{{service_type}}/g, serviceType)
      .replace(/{{next_service_due}}/g, new Date(nextDue).toLocaleDateString())
      .replace(/{{mileage}}/g, vehicle?.mileage?.toString() ?? "N/A")
      .replace(/{{service_provider}}/g, m.service_provider || "N/A");

    const body = bodyTemplate
      .replace(/{{vehicle}}/g, vehicleLabel)
      .replace(/{{service_type}}/g, serviceType)
      .replace(/{{next_service_due}}/g, new Date(nextDue).toLocaleDateString())
      .replace(/{{mileage}}/g, vehicle?.mileage?.toString() ?? "N/A")
      .replace(/{{service_provider}}/g, m.service_provider || "N/A");

    let recipientEmails: string[] = [];
    if (vehicle) {
      const { data: assignments, error: assignmentsError } = await adminClient
        .from("assignments")
        .select("employee_id, employee:profiles!employee_id(email)")
        .eq("vehicle_id", vehicle.id)
        .eq("is_active", true)
        .not("employee_id", "is", null);

      if (assignmentsError) {
        result.errors.push(`Failed to fetch assignments for ${vehicleLabel}: ${assignmentsError.message}`);
        continue;
      }

      recipientEmails = (assignments || [])
        .map((a: any) => a.employee?.email)
        .filter(Boolean) as string[];
    }

    if (recipientEmails.length === 0) {
      recipientEmails = adminEmails;
    }

    if (recipientEmails.length === 0) {
      result.errors.push(`No recipients for ${vehicleLabel}`);
      continue;
    }

    let anySent = false;
    const sendErrors: string[] = [];
    for (const email of recipientEmails) {
      const { sent, error: sendError } = await sendEmail({ to: email, subject, text: body });
      if (!sent) {
        result.errors.push(`Failed to send to ${email}: ${sendError}`);
        sendErrors.push(`${email}: ${sendError}`);
      } else {
        anySent = true;
      }
    }

    if (!anySent) {
      await adminClient.from("maintenance_reminders").insert({
        maintenance_id: m.id,
        reminder_type: "two_week_service",
        recipient_email: recipientEmails.join(", "),
        status: "failed",
        error_message: sendErrors.join("; ") || "All sends failed",
      });
      continue;
    }

    const { error: insertErr } = await adminClient.from("maintenance_reminders").insert({
      maintenance_id: m.id,
      reminder_type: "two_week_service",
      recipient_email: recipientEmails.join(", "),
      status: "sent",
    });
    if (insertErr) {
      result.errors.push(`Sent emails but failed to record reminder for ${vehicleLabel}: ${insertErr.message}`);
    } else {
      result.sent++;
    }
  }

  return res.status(200).json(result);
}