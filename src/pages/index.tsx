import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { vehicleService, maintenanceService, fuelService, assignmentService, type Vehicle, type MaintenanceWithVehicle, type FuelLogWithRelations, type AssignmentWithRelations } from "@/services/fleetService";
import { settingsService } from "@/services/settingsService";
import { useToast } from "@/hooks/use-toast";
import { Car, Users, Wrench, Fuel, AlertTriangle, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

function statusVariant(status: string) {
  switch (status) {
    case "Available": return "success";
    case "Assigned": return "default";
    case "Maintenance": return "warning";
    case "Retired": return "secondary";
    default: return "outline";
  }
}

function addDays(date: string | null, days: number) {
  if (!date) return null;
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isWithinDays(date: string | null, days: number) {
  const d = addDays(date, days);
  return d ? d >= new Date() : false;
}

function isOverdue(date: string | null) {
  return date ? new Date(date) < new Date() : false;
}

function isWithinOrOverdue(date: string | null, days: number) {
  return isOverdue(date) || isWithinDays(date, days);
}

function DashboardPage() {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceWithVehicle[]>([]);
  const [fuel, setFuel] = useState<FuelLogWithRelations[]>([]);
  const [assignments, setAssignments] = useState<AssignmentWithRelations[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      vehicleService.list(),
      maintenanceService.list(),
      fuelService.list(),
      assignmentService.list(),
    ]).then(([v, m, f, a]) => {
      setVehicles(v.data ?? []);
      setMaintenance(m.data ?? []);
      setFuel(f.data ?? []);
      setAssignments(a.data ?? []);
      setLoaded(true);
      if (v.error) toast({ title: "Error", description: v.error.message, variant: "destructive" });
    });
  }, [toast]);

  const activeVehicles = vehicles.filter((v) => !v.is_deleted);

  const counts = {
    total: activeVehicles.length,
    available: activeVehicles.filter((v) => v.status === "Available").length,
    assigned: activeVehicles.filter((v) => v.status === "Assigned").length,
    maintenance: activeVehicles.filter((v) => v.status === "Maintenance").length,
  };

  const upcomingService = activeVehicles.filter((v) => v.service_due_date && isWithinOrOverdue(v.service_due_date, 14)).slice(0, 5);
  const expiringDocs = activeVehicles.filter((v) => (v.insurance_expiry && isWithinOrOverdue(v.insurance_expiry, 14)) || (v.registration_expiry && isWithinOrOverdue(v.registration_expiry, 14))).slice(0, 5);
  const activeAssignments = assignments.filter((a) => !a.actual_return_date && a.vehicle && !a.vehicle.is_deleted).slice(0, 5);
  const totalFuel = fuel.reduce((sum, f) => sum + (f.cost ?? 0), 0);
  const totalMaintenance = maintenance.reduce((sum, m) => sum + (m.cost ?? 0), 0);
  const totalVehicleCost = activeVehicles.reduce((sum, v) => sum + (v.purchase_price ?? 0), 0);

  const dueServiceRecords = maintenance.filter(
    (m) =>
      ["Small service", "General service"].includes(m.service_type) &&
      m.next_service_due &&
      isWithinOrOverdue(m.next_service_due, 14) &&
      m.vehicle &&
      !m.vehicle.is_deleted
  );

  const handleSendServiceReminder = async (id: string) => {
    setSendingReminder(id);
    const { data, error } = await settingsService.sendManualServiceReminder(id);
    setSendingReminder(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      toast({ title: "Reminder sent", description: data.note || `Sent to ${data.recipient || "admins"}` });
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Fleet dashboard</h1>
          <p className="text-muted-foreground">Live overview of vehicles, service, and assignments.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total vehicles</CardTitle><Car className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-3xl font-bold font-display">{counts.total}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Available</CardTitle><Car className="h-4 w-4 text-emerald-500" /></CardHeader><CardContent><div className="text-3xl font-bold font-display text-emerald-500">{counts.available}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Assigned</CardTitle><Users className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-3xl font-bold font-display text-primary">{counts.assigned}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">In maintenance</CardTitle><Wrench className="h-4 w-4 text-amber-500" /></CardHeader><CardContent><div className="text-3xl font-bold font-display text-amber-500">{counts.maintenance}</div></CardContent></Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Active assignments</CardTitle></CardHeader>
            <CardContent>
              {!loaded ? <p className="text-muted-foreground">Loading…</p> :
              activeAssignments.length === 0 ? <p className="text-muted-foreground">No active assignments.</p> :
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Expected return</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeAssignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono">
                        <Link href={`/vehicles/${a.vehicle_id}`} className="text-primary hover:underline">
                          {a.vehicle?.vehicle_id || a.vehicle_id}
                        </Link>
                      </TableCell>
                      <TableCell>{a.employee?.full_name || a.employee_id}</TableCell>
                      <TableCell>{a.assigned_date}</TableCell>
                      <TableCell>{a.expected_return_date || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Alerts</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {!loaded ? <p className="text-muted-foreground">Loading…</p> :
              <>
                <p className="text-sm text-muted-foreground">{dueServiceRecords.length} service reminder(s) due</p>
                <p className="text-sm text-muted-foreground">{upcomingService.length} vehicle(s) due for service</p>
                <p className="text-sm text-muted-foreground">{expiringDocs.length} registration/insurance expiring soon</p>
                {dueServiceRecords.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Due service records</p>
                    {dueServiceRecords.map((m) => (
                      <div key={m.id} className="flex items-center justify-between gap-2 rounded border p-2 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-mono">{m.vehicle?.vehicle_id || m.vehicle_id}</p>
                          <p className="truncate text-xs text-muted-foreground">{m.service_type} · {m.next_service_due}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="shrink-0"
                          onClick={() => handleSendServiceReminder(m.id)}
                          disabled={sendingReminder === m.id}
                          title="Send service reminder"
                        >
                          {sendingReminder === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {upcomingService.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded border p-2 text-sm">
                    <span>{v.vehicle_id}</span>
                    <Badge variant={isOverdue(v.service_due_date) ? "destructive" : "warning"}>{v.service_due_date}</Badge>
                  </div>
                ))}
                {expiringDocs.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded border p-2 text-sm">
                    <span>{v.vehicle_id}</span>
                    <Badge variant="outline">{v.insurance_expiry || v.registration_expiry}</Badge>
                  </div>
                ))}
              </>}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total fuel spend</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold font-display flex items-center gap-2"><Fuel className="h-5 w-5 text-blue-500" />{formatCurrency(totalFuel)}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total maintenance</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold font-display flex items-center gap-2"><Wrench className="h-5 w-5 text-amber-500" />{formatCurrency(totalMaintenance)}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total vehicle cost</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold font-display flex items-center gap-2"><Car className="h-5 w-5 text-emerald-500" />{formatCurrency(totalVehicleCost)}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Recent fuel entries</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold font-display">{fuel.length}</div></CardContent></Card>
        </div>
      </div>
    </AppShell>
  );
}

export default withAuth(DashboardPage);