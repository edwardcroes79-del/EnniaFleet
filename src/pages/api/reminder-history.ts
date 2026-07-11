import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

type ReminderHistoryItem = {
  id: string;
  type: "return" | "service";
  reminder_type: string;
  recipient_email: string;
  status: "pending" | "sent" | "failed";
  error_message: string | null;
  created_at: string;
  assignment_id: string | null;
  maintenance_id: string | null;
  employee_name: string | null;
  employee_email: string | null;
  vehicle_label: string | null;
};

type ReminderHistoryResponse = {
  history: ReminderHistoryItem[];
  nextCronRun: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ReminderHistoryResponse | { error: string }>) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Supabase service configuration missing" });
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: emailRows, error: emailError } = await adminClient
    .from("email_reminders")
    .select(`
      id,
      reminder_type,
      recipient_email,
      status,
      error_message,
      created_at,
      assignment_id,
      assignment:assignments(vehicle:vehicles(vehicle_id, make, model), employee:profiles!employee_id(full_name, email))
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (emailError) {
    return res.status(500).json({ error: emailError.message });
  }

  const { data: maintenanceRows, error: maintenanceError } = await adminClient
    .from("maintenance_reminders")
    .select(`
      id,
      reminder_type,
      recipient_email,
      status,
      error_message,
      created_at,
      maintenance_id,
      maintenance:maintenance(id, vehicle_id, vehicle:vehicles(vehicle_id, make, model))
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (maintenanceError) {
    return res.status(500).json({ error: maintenanceError.message });
  }

  const maintenanceWithVehicles = await Promise.all(
    (maintenanceRows || []).map(async (row: any) => {
      const vehicle = row.maintenance?.vehicle?.[0] ?? null;
      const vehicleId = row.maintenance?.vehicle_id ?? null;
      let vehicleLabel: string | null = null;
      let employeeEmail: string | null = null;
      let employeeName: string | null = null;
      if (vehicle) {
        vehicleLabel = `${vehicle.vehicle_id} — ${vehicle.make} ${vehicle.model}`;
      }
      if (vehicleId) {
        const { data: assignmentRows } = await adminClient
          .from("assignments")
          .select("employee:profiles!employee_id(full_name, email)")
          .eq("vehicle_id", vehicleId)
          .eq("is_active", true)
          .limit(1);
        const employee = (assignmentRows?.[0] as any)?.employee?.[0] ?? null;
        employeeEmail = employee?.email ?? null;
        employeeName = employee?.full_name ?? null;
      }
      return {
        id: row.id,
        type: "service" as const,
        reminder_type: row.reminder_type,
        recipient_email: row.recipient_email,
        status: row.status,
        error_message: row.error_message,
        created_at: row.created_at,
        maintenance_id: row.maintenance_id,
        assignment_id: null,
        employee_name: employeeName,
        employee_email: employeeEmail,
        vehicle_label: vehicleLabel,
      };
    })
  );

  const history: ReminderHistoryItem[] = [
    ...(emailRows || []).map((row: any) => {
      const assignment = row.assignment;
      const vehicle = assignment?.vehicle?.[0] ?? null;
      const employee = assignment?.employee?.[0] ?? null;
      return {
        id: row.id,
        type: "return" as const,
        reminder_type: row.reminder_type,
        recipient_email: row.recipient_email,
        status: row.status,
        error_message: row.error_message,
        created_at: row.created_at,
        assignment_id: row.assignment_id,
        maintenance_id: null,
        employee_name: employee?.full_name ?? null,
        employee_email: employee?.email ?? null,
        vehicle_label: vehicle ? `${vehicle.vehicle_id} — ${vehicle.make} ${vehicle.model}` : null,
      };
    }),
    ...maintenanceWithVehicles,
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 50);

  const now = new Date();
  const nextRun = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 9, 0, 0));
  const secondsUntil = Math.max(0, Math.floor((nextRun.getTime() - now.getTime()) / 1000));

  return res.status(200).json({
    history,
    nextCronRun: nextRun.toISOString(),
  });
}