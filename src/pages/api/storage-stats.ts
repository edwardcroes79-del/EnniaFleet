import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: "Missing Supabase configuration" });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data: tableSizes, error: tableError } = await supabase.rpc("get_table_sizes");
    if (tableError) throw tableError;

    const { data: dbSize, error: dbError } = await supabase.rpc("get_database_size");
    if (dbError) throw dbError;

    const { data: buckets } = await supabase.storage.listBuckets();
    let storageUsed = 0;
    const bucketDetails: { name: string; size: number; count: number }[] = [];

    if (buckets) {
      for (const bucket of buckets) {
        const { data: files } = await supabase.storage.from(bucket.name).list("", { limit: 1000 });
        let bucketSize = 0;
        let fileCount = 0;
        if (files) {
          for (const file of files) {
            bucketSize += file.metadata?.size || 0;
            fileCount++;
          }
        }
        storageUsed += bucketSize;
        bucketDetails.push({ name: bucket.name, size: bucketSize, count: fileCount });
      }
    }

    const totalDbSize = typeof dbSize === "number" ? dbSize : 0;

    return res.status(200).json({
      database: {
        total_bytes: totalDbSize,
        tables: tableSizes || [],
      },
      storage: {
        total_bytes: storageUsed,
        buckets: bucketDetails,
      },
      total_bytes: totalDbSize + storageUsed,
    });
  } catch (err) {
    console.error("Storage stats error:", err);
    return res.status(500).json({ error: err instanceof Error ? err.message : "Failed to fetch storage stats" });
  }
}