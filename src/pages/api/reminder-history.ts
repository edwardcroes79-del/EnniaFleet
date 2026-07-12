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

type ScheduleInfo = {
  returnReminders: { time: string; path: string };
  serviceReminders: { time: string; path: string };
};

type ReminderHistoryResponse = {
  history: ReminderHistoryItem[];
  nextCronRun: string;
  nextReturnRun: string;
  nextServiceRun: string;
  schedule: ScheduleInfo;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ReminderHistoryResponse | { error: string; details?: string }>) {
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

  try {
    const [{ data: emailRows, error: emailError }, { data: maintenanceRows, error: maintenanceError }] = await Promise.all([
      adminClient
        .from("email_reminders")
        .select("id, reminder_type, recipient_email, status, error_message, created_at, assignment_id")
        .order("created_at", { ascending: false })
        .limit(100),
      adminClient
        .from("maintenance_reminders")
        .select("id, reminder_type, recipient_email, status, error_message, created_at, maintenance_id")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    if (emailError) throw emailError;
    if (maintenanceError) throw maintenanceError;

    const assignmentIds = (emailRows || [])
      .map((r: any) => r.assignment_id)
      .filter(Boolean) as string[];

    const maintenanceIds = (maintenanceRows || [])
      .map((r: any) => r.maintenance_id)
      .filter(Boolean) as string[];

    const [assignmentResult, maintenanceResult] = await Promise.all([
      assignmentIds.length > 0
        ? adminClient
            .from("assignments")
            .select("id, vehicle_id, employee:profiles!employee_id(id, full_name, email)")
            .in("id", assignmentIds)
        : { data: [], error: null },
      maintenanceIds.length > 0
        ? adminClient
            .from("maintenance")
            .select("id, vehicle_id")
            .in("id", maintenanceIds)
        : { data: [], error: null },
    ]);

    if (assignmentResult.error) throw assignmentResult.error;
    if (maintenanceResult.error) throw maintenanceResult.error;

    const referencedVehicleIds = new Set<string>();
    for (const a of (assignmentResult.data || []) as any[]) {
      if (a.vehicle_id) referencedVehicleIds.add(a.vehicle_id);
    }
    for (const m of (maintenanceResult.data || []) as any[]) {
      if (m.vehicle_id) referencedVehicleIds.add(m.vehicle_id);
    }

    const { data: validVehicles, error: vehiclesError } = referencedVehicleIds.size > 0
      ? await adminClient
          .from("vehicles")
          .select("id, vehicle_id, make, model, is_deleted")
          .in("id", Array.from(referencedVehicleIds))
      : { data: [], error: null };

    if (vehiclesError) throw vehiclesError;

    const validVehicleMap = new Map<string, { id: string; vehicle_id: string; make: string; model: string }>();
    for (const v of (validVehicles || []) as any[]) {
      if (!v.is_deleted) validVehicleMap.set(v.id, v);
    }

    const assignmentMap = new Map<string, any>();
    for (const a of (assignmentResult.data || []) as any[]) {
      if (!validVehicleMap.has(a.vehicle_id)) continue;
      assignmentMap.set(a.id, { ...a, vehicle: [validVehicleMap.get(a.vehicle_id)] });
    }

    const maintenanceMap = new Map<string, any>();
    for (const m of (maintenanceResult.data || []) as any[]) {
      if (!validVehicleMap.has(m.vehicle_id)) continue;
      maintenanceMap.set(m.id, { ...m, vehicle: [validVehicleMap.get(m.vehicle_id)] });
    }

    const history: ReminderHistoryItem[] = [];

    for (const row of (emailRows || []) as any[]) {
      if (row.assignment_id && !assignmentMap.has(row.assignment_id)) continue;
      const assignment = row.assignment_id ? assignmentMap.get(row.assignment_id) : null;
      const vehicle = assignment?.vehicle?.[0] ?? null;
      const employee = assignment?.employee?.[0] ?? null;

      history.push({
        id: row.id,
        type: "return",
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
      });
    }

    for (const row of (maintenanceRows || []) as any[]) {
      if (row.maintenance_id && !maintenanceMap.has(row.maintenance_id)) continue;
      const maintenance = row.maintenance_id ? maintenanceMap.get(row.maintenance_id) : null;
      const vehicle = maintenance?.vehicle?.[0] ?? null;

      let employeeName: string | null = null;
      let employeeEmail: string | null = null;
      if (vehicle?.id) {
        const { data: activeAssignments } = await adminClient
          .from("assignments")
          .select("employee:profiles!employee_id(full_name, email)")
          .eq("vehicle_id", vehicle.id)
          .eq("is_active", true)
          .limit(1);
        const employee = (activeAssignments?.[0] as any)?.employee?.[0] ?? null;
        employeeName = employee?.full_name ?? null;
        employeeEmail = employee?.email ?? null;
      }

      history.push({
        id: row.id,
        type: "service",
        reminder_type: row.reminder_type,
        recipient_email: row.recipient_email,
        status: row.status,
        error_message: row.error_message,
        created_at: row.created_at,
        assignment_id: null,
        maintenance_id: row.maintenance_id,
        employee_name: employeeName,
        employee_email: employeeEmail,
        vehicle_label: vehicle ? `${vehicle.vehicle_id} — ${vehicle.make} ${vehicle.model}` : null,
      });
    }

    history.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const limitedHistory = history.slice(0, 50);

    const now = new Date();
    const nextRun = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + (now.getUTCHours() >= 9 ? 1 : 0), 9, 0, 0));

    return res.status(200).json({
      history: limitedHistory,
      nextCronRun: nextRun.toISOString(),
      nextReturnRun: nextRun.toISOString(),
      nextServiceRun: nextRun.toISOString(),
      schedule: {
        returnReminders: { time: "09:00 UTC", path: "/api/send-reminders" },
        serviceReminders: { time: "09:00 UTC", path: "/api/send-maintenance-reminders" },
      },
    });
  } catch (err) {
    console.error("[reminder-history] error:", err);
    return res.status(500).json({
      error: "Failed to load reminder history",
      details: err instanceof Error ? err.message : String(err),
    });
  }
}