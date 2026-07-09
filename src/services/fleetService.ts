import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/database.types";

export type Vehicle = Tables<"vehicles">;
export type VehicleInsert = TablesInsert<"vehicles">;
export type VehicleUpdate = TablesUpdate<"vehicles">;
export type Profile = Tables<"profiles">;
export type Assignment = Tables<"assignments">;
export type Maintenance = Tables<"maintenance">;
export type FuelLog = Tables<"fuel_log">;
export type Incident = Tables<"incidents">;
export type Document = Tables<"documents">;

export const vehicleService = {
  async list(activeOnly = true) {
    let q = supabase.from("vehicles").select("*").order("created_at", { ascending: false });
    if (activeOnly) q = q.eq("is_deleted", false);
    const { data, error } = await q;
    return { data: (data ?? []) as Vehicle[], error };
  },
  async get(id: string) {
    const { data, error } = await supabase.from("vehicles").select("*").eq("id", id).maybeSingle();
    return { data: data as Vehicle | null, error };
  },
  async create(values: VehicleInsert) {
    const { data, error } = await supabase.from("vehicles").insert(values).select().single();
    return { data: data as Vehicle | null, error };
  },
  async update(id: string, values: VehicleUpdate) {
    const { data, error } = await supabase.from("vehicles").update(values).eq("id", id).select().single();
    return { data: data as Vehicle | null, error };
  },
  async softDelete(id: string) {
    return await supabase.from("vehicles").update({ is_deleted: true, status: "Retired" }).eq("id", id);
  },
};

export const profileService = {
  async list(activeOnly = true) {
    let q = supabase.from("profiles").select("*").order("full_name");
    if (activeOnly) q = q.eq("is_active", true);
    const { data, error } = await q;
    return { data: (data ?? []) as Profile[], error };
  },
  async get(id: string) {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    return { data: data as Profile | null, error };
  },
  async update(id: string, values: TablesUpdate<"profiles">) {
    const { data, error } = await supabase.from("profiles").update(values).eq("id", id).select().single();
    return { data: data as Profile | null, error };
  },
};

export const assignmentService = {
  async list() {
    const { data, error } = await supabase
      .from("assignments")
      .select("*, vehicle:vehicles(*), employee:profiles(*)")
      .order("created_at", { ascending: false });
    return { data: (data ?? []) as unknown as (Assignment & { vehicle: Vehicle; employee: Profile })[], error };
  },
  async create(values: TablesInsert<"assignments">) {
    const { data, error } = await supabase.from("assignments").insert(values).select().single();
    return { data: data as Assignment | null, error };
  },
  async close(id: string, values: TablesUpdate<"assignments">) {
    const { data, error } = await supabase
      .from("assignments")
      .update({ ...values, is_active: false })
      .eq("id", id)
      .select()
      .single();
    return { data: data as Assignment | null, error };
  },
};

export const maintenanceService = {
  async list() {
    const { data, error } = await supabase
      .from("maintenance")
      .select("*, vehicle:vehicles(vehicle_id, make, model)")
      .order("service_date", { ascending: false });
    return { data: (data ?? []) as unknown as (Maintenance & { vehicle: Pick<Vehicle, "vehicle_id" | "make" | "model"> })[], error };
  },
  async create(values: TablesInsert<"maintenance">) {
    const { data, error } = await supabase.from("maintenance").insert(values).select().single();
    return { data: data as Maintenance | null, error };
  },
  async update(id: string, values: TablesUpdate<"maintenance">) {
    const { data, error } = await supabase.from("maintenance").update(values).eq("id", id).select().single();
    return { data: data as Maintenance | null, error };
  },
};

export const fuelService = {
  async list() {
    const { data, error } = await supabase
      .from("fuel_log")
      .select("*, vehicle:vehicles(vehicle_id, make, model), driver:profiles(full_name)")
      .order("fuel_date", { ascending: false });
    return { data: (data ?? []) as unknown as (FuelLog & { vehicle: Pick<Vehicle, "vehicle_id" | "make" | "model">; driver: Pick<Profile, "full_name"> })[], error };
  },
  async create(values: TablesInsert<"fuel_log">) {
    const { data, error } = await supabase.from("fuel_log").insert(values).select().single();
    return { data: data as FuelLog | null, error };
  },
};

export const incidentService = {
  async list() {
    const { data, error } = await supabase
      .from("incidents")
      .select("*, vehicle:vehicles(vehicle_id, make, model), reporter:profiles(full_name)")
      .order("created_at", { ascending: false });
    return { data: (data ?? []) as unknown as (Incident & { vehicle: Pick<Vehicle, "vehicle_id" | "make" | "model">; reporter: Pick<Profile, "full_name"> })[], error };
  },
  async create(values: TablesInsert<"incidents">) {
    const { data, error } = await supabase.from("incidents").insert(values).select().single();
    return { data: data as Incident | null, error };
  },
  async update(id: string, values: TablesUpdate<"incidents">) {
    const { data, error } = await supabase.from("incidents").update(values).eq("id", id).select().single();
    return { data: data as Incident | null, error };
  },
};

export const documentService = {
  async list() {
    const { data, error } = await supabase
      .from("documents")
      .select("*, vehicle:vehicles(vehicle_id, make, model), employee:profiles(full_name)")
      .order("created_at", { ascending: false });
    return { data: (data ?? []) as unknown as (Document & { vehicle: Pick<Vehicle, "vehicle_id" | "make" | "model"> | null; employee: Pick<Profile, "full_name"> | null })[], error };
  },
  async create(values: TablesInsert<"documents">) {
    const { data, error } = await supabase.from("documents").insert(values).select().single();
    return { data: data as Document | null, error };
  },
};

export const dashboardService = {
  async stats() {
    const { data: vehicles, error: vErr } = await supabase.from("vehicles").select("status, insurance_expiry, registration_expiry, service_due_date").eq("is_deleted", false);
    if (vErr) return { data: null, error: vErr };
    const now = new Date().toISOString().slice(0, 10);
    const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const in7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const counts = { Available: 0, Assigned: 0, Maintenance: 0, Retired: 0 };
    (vehicles ?? []).forEach((v) => { counts[v.status as keyof typeof counts] = (counts[v.status as keyof typeof counts] ?? 0) + 1; });
    const alerts = (vehicles ?? []).filter((v) =>
      (v.insurance_expiry && v.insurance_expiry <= in30) ||
      (v.registration_expiry && v.registration_expiry <= in30) ||
      (v.service_due_date && v.service_due_date <= in7)
    );
    return { data: { counts, total: (vehicles ?? []).length, alerts }, error: null };
  },
  async recentActivity(limit = 5) {
    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    return { data: (data ?? []), error };
  },
};