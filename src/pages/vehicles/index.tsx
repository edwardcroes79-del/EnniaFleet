import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { vehicleService, type Vehicle } from "@/services/fleetService";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function statusVariant(status: string) {
  switch (status) {
    case "Available": return "success";
    case "Assigned": return "default";
    case "Maintenance": return "warning";
    case "Retired": return "secondary";
    default: return "outline";
  }
}

function VehiclesPage() {
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    vehicleService.list().then(({ data, error }) => {
      setRows(data ?? []);
      if (error) toast({ title: "Error loading vehicles", description: error.message, variant: "destructive" });
      setLoading(false);
    });
  }, [toast]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((v) =>
      [v.vehicle_id, v.license_plate, v.make, v.model, v.vin, v.status].some((f) =>
        String(f ?? "").toLowerCase().includes(term)
      )
    );
  }, [rows, q]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-2xl font-bold tracking-tight">Vehicles</h1>
          <Link href="/vehicles/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add vehicle
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Fleet inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ID, plate, make, model, VIN, status…"
                className="pl-9"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle ID</TableHead>
                    <TableHead>Plate</TableHead>
                    <TableHead>Make / Model</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Mileage</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading…</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No vehicles found.</TableCell></TableRow>
                  ) : filtered.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono">
                        <Link href={`/vehicles/${v.id}`} className="text-primary hover:underline">{v.vehicle_id}</Link>
                      </TableCell>
                      <TableCell className="font-mono">{v.license_plate}</TableCell>
                      <TableCell>{v.make} {v.model}</TableCell>
                      <TableCell>{v.year ?? "—"}</TableCell>
                      <TableCell className="font-mono">{v.mileage?.toLocaleString() ?? "—"}</TableCell>
                      <TableCell><Badge variant={statusVariant(v.status)}>{v.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

export default withAuth(VehiclesPage, ["admin", "director"]);