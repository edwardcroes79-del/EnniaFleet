import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { id, ...values } = req.body;

  if (!id) return res.status(400).json({ error: "Employee ID is required." });

  const allowedFields = [
    "employee_id",
    "full_name",
    "department",
    "position",
    "phone",
    "license_number",
    "license_expiry",
    "emergency_contact_name",
    "emergency_contact_phone",
    "is_active",
  ];

  const update: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (values[key] !== undefined) {
      update[key] = values[key] || null;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update(update)
    .eq("id", id)
    .select("*");

  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: "Employee not found." });

  return res.status(200).json({ data: data[0] });
}