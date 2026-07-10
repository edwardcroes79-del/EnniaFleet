import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { maintenanceService, type MaintenanceWithVehicle } from "@/services/fleetService";
import { Plus, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

function MaintenancePage() {
  const [rows, setRows] = useState<MaintenanceWithVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    maintenanceService.list().then(({ data, error }) => {
      setRows(data ?? []);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
    });
  }, [toast]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold tracking-tight">Maintenance</h1>
          <Link href="/maintenance/new"><Button><Plus className="mr-2 h-4 w-4" /> Log service</Button></Link>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Service history</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Next due</TableHead>
                  <TableHead className="w-20">Edit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={7} className="h-24 text-center">Loading…</TableCell></TableRow> :
                rows.length === 0 ? <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No records found.</TableCell></TableRow> :
                rows.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono">{m.vehicle?.vehicle_id || m.vehicle_id}</TableCell>
                    <TableCell><Badge variant="outline">{m.service_type}</Badge></TableCell>
                    <TableCell>{m.service_date}</TableCell>
                    <TableCell>{m.service_provider || "—"}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(m.cost)}</TableCell>
                    <TableCell>{m.next_service_due || "—"}</TableCell>
                    <TableCell>
                      <Link href={`/maintenance/${m.id}/edit`}><Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button></Link>
                    </TableCell>
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

export default withAuth(MaintenancePage, ["admin", "director"]);