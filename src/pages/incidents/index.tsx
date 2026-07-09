import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { incidentService, type IncidentWithRelations } from "@/services/fleetService";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function statusVariant(status: string) {
  switch (status) {
    case "Open": return "destructive";
    case "In Progress": return "warning";
    case "Resolved": return "success";
    default: return "outline";
  }
}

function IncidentsPage() {
  const [rows, setRows] = useState<IncidentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    incidentService.list().then(({ data, error }) => {
      setRows(data ?? []);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
    });
  }, [toast]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold tracking-tight">Incidents</h1>
          <Link href="/incidents/new"><Button><Plus className="mr-2 h-4 w-4" /> Report incident</Button></Link>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Incident reports</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading…</TableCell></TableRow> :
                rows.length === 0 ? <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No incidents found.</TableCell></TableRow> :
                rows.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>{i.incident_date || i.created_at.slice(0, 10)}</TableCell>
                    <TableCell className="font-mono">{i.vehicle?.vehicle_id || i.vehicle_id}</TableCell>
                    <TableCell>{i.incident_type}</TableCell>
                    <TableCell>{i.location || "—"}</TableCell>
                    <TableCell><Badge variant={statusVariant(i.status)}>{i.status}</Badge></TableCell>
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

export default withAuth(IncidentsPage, ["admin", "director", "employee"]);