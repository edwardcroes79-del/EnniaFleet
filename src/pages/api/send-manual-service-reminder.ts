import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

function getURL() {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
}

function renderTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${req.headers.authorization?.replace("Bearer ", "") || ""}`,
        },
      },
    }
  );

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { maintenance_id } = req.body;
  if (!maintenance_id) {
    return res.status(400).json({ error: "maintenance_id is required" });
  }

  const { data: maintenance, error: maintenanceError } = await supabase
    .from("maintenance")
    .select("*, vehicle:vehicles(*)")
    .eq("id", maintenance_id)
    .maybeSingle();

  if (maintenanceError || !maintenance) {
    return res.status(404).json({ error: maintenanceError?.message || "Maintenance record not found" });
  }

  const { data: alreadySent } = await supabase
    .from("maintenance_reminders")
    .select("id")
    .eq("maintenance_id", maintenance_id)
    .limit(1);

  if (alreadySent && alreadySent.length > 0) {
    return res.status(200).json({ sent: false, note: "Reminder already sent for this service record." });
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from("assignments")
    .select("employee_id, employee:profiles!employee_id(email)")
    .eq("vehicle_id", maintenance.vehicle_id)
    .eq("is_active", true)
    .not("employee_id", "is", null);

  if (assignmentsError) {
    return res.status(500).json({ error: assignmentsError.message });
  }

  let recipientEmails: string[] = [];
  if (assignments && assignments.length > 0) {
    recipientEmails = assignments
      .map((a: any) => a.employee?.email)
      .filter(Boolean) as string[];
  }

  if (recipientEmails.length === 0) {
    const { data: admins, error: adminsError } = await supabase
      .from("profiles")
      .select("email")
      .eq("role", "admin")
      .not("email", "is", null);
    if (adminsError) return res.status(500).json({ error: adminsError.message });
    recipientEmails = (admins || []).map((a) => a.email as string).filter(Boolean);
  }

  const recipientList = recipientEmails.join(", ");

  const { data: settings } = await supabase
    .from("app_settings")
    .select("service_reminder_email_subject, service_reminder_email_body")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const subjectTemplate = settings?.service_reminder_email_subject || "Service reminder: {{vehicle}} is due for service soon";
  const bodyTemplate = settings?.service_reminder_email_body || "The vehicle {{vehicle}} is scheduled for {{service_type}} on {{next_service_due}}. Current mileage: {{mileage}}.";

  const vehicleName = `${maintenance.vehicle?.vehicle_id} ${maintenance.vehicle?.make} ${maintenance.vehicle?.model}`.trim();
  const vars = {
    vehicle: vehicleName,
    service_type: maintenance.service_type || "",
    next_service_due: maintenance.next_service_due || "",
    mileage: String(maintenance.mileage_at_service ?? maintenance.vehicle?.mileage ?? ""),
    service_provider: maintenance.service_provider || "",
  };

  const renderedSubject = renderTemplate(subjectTemplate, vars);
  const renderedBody = renderTemplate(bodyTemplate, vars);

  let note: string | undefined;
  for (const email of recipientEmails) {
    const result = await sendEmail({
      to: email,
      subject: renderedSubject,
      text: renderedBody,
    });
    if (!result.sent) {
      note = result.note;
    }
  }

  await supabase.from("maintenance_reminders").insert({
    maintenance_id,
    recipient_email: recipientList,
    reminder_type: "manual_service_due",
  });

  return res.status(200).json({
    sent: true,
    recipient: recipientList,
    subject: renderedSubject,
    body: renderedBody,
    note,
  });
}