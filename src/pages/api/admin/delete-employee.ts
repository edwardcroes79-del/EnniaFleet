import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { id } = req.body as { id?: string };
  if (!id) return res.status(400).json({ error: "Missing employee id" });

  try {
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authErr) throw authErr;
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("delete-employee error:", err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to delete employee",
    });
  }
}