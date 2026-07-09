import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fuelService, type FuelLogWithRelations } from "@/services/fleetService";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function FuelPage() {
  const [rows, setRows] = useState<FuelLogWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fuelService.list().then(({ data, error }) => {
      setRows(data ?? []);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
    });
  }, [toast]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold tracking-tight">Fuel log</h1>
          <Link href="/fuel/new"><Button><Plus className="mr-2 h-4 w-4" /> Add fuel entry</Button></Link>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Fuel entries</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Odometer</TableHead>
                  <TableHead>Liters</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Station</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={7} className="h-24 text-center">Loading…</TableCell></TableRow> :
                rows.length === 0 ? <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No entries found.</TableCell></TableRow> :
                rows.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>{f.fuel_date}</TableCell>
                    <TableCell className="font-mono">{f.vehicle?.vehicle_id || f.vehicle_id}</TableCell>
                    <TableCell>{f.driver?.full_name || "—"}</TableCell>
                    <TableCell className="font-mono">{f.odometer?.toLocaleString() ?? "—"}</TableCell>
                    <TableCell>{f.liters ?? "—"}</TableCell>
                    <TableCell className="font-mono">${f.cost?.toLocaleString() ?? "—"}</TableCell>
                    <TableCell>{f.fuel_station || "—"}</TableCell>
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

export default withAuth(FuelPage, ["admin", "director", "employee"]);