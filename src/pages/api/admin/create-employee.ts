import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const {
    email,
    password,
    employee_id,
    full_name,
    department,
    position,
    phone,
    license_number,
    license_expiry,
    emergency_contact_name,
    emergency_contact_phone,
  } = req.body;

  if (!email || !password || !full_name || !employee_id) {
    return res.status(400).json({ error: "Email, password, full name, and employee ID are required." });
  }

  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) return res.status(409).json({ error: "An employee with this email already exists." });

  const { data: user, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !user.user) {
    return res.status(500).json({ error: authError?.message || "Failed to create user." });
  }

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      employee_id,
      full_name,
      department: department || null,
      position: position || null,
      phone: phone || null,
      license_number: license_number || null,
      license_expiry: license_expiry || null,
      emergency_contact_name: emergency_contact_name || null,
      emergency_contact_phone: emergency_contact_phone || null,
      role: "employee",
      is_active: true,
    })
    .eq("id", user.user.id);

  if (profileError) {
    return res.status(500).json({ error: profileError.message });
  }

  return res.status(200).json({ userId: user.user.id, email, tempPassword: password });
}