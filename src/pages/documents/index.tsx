import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { documentService, type FleetDocument } from "@/services/fleetService";
import { Plus, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function DocumentsPage() {
  const [rows, setRows] = useState<FleetDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    documentService.list().then(({ data, error }) => {
      setRows(data ?? []);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
    });
  }, [toast]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold tracking-tight">Documents</h1>
          <Link href="/documents/new"><Button><Plus className="mr-2 h-4 w-4" /> Upload document</Button></Link>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Fleet documents</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>File</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading…</TableCell></TableRow> :
                rows.length === 0 ? <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No documents found.</TableCell></TableRow> :
                rows.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell><Badge variant="outline">{d.document_type}</Badge></TableCell>
                    <TableCell className="font-mono">{d.vehicle?.vehicle_id || d.vehicle_id || "—"}</TableCell>
                    <TableCell>{d.title}</TableCell>
                    <TableCell>{d.expiry_date || "—"}</TableCell>
                    <TableCell>{d.file_url ? <a href={d.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline"><FileText className="h-4 w-4" /> View</a> : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

export default withAuth(DocumentsPage, ["admin", "director"]);