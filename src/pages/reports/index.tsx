import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vehicleService, maintenanceService, fuelService, assignmentService, type Vehicle, type MaintenanceWithVehicle, type FuelLogWithRelations, type AssignmentWithRelations } from "@/services/fleetService";
import { useToast } from "@/hooks/use-toast";

function ReportsPage() {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceWithVehicle[]>([]);
  const [fuel, setFuel] = useState<FuelLogWithRelations[]>([]);
  const [assignments, setAssignments] = useState<AssignmentWithRelations[]>([]);
  const [report, setReport] = useState("utilization");

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
      if (v.error) toast({ title: "Error", description: v.error.message, variant: "destructive" });
    });
  }, [toast]);

  const utilization = useMemo(() => {
    const counts: Record<string, number> = {};
    assignments.forEach((a) => { counts[a.vehicle_id] = (counts[a.vehicle_id] || 0) + 1; });
    return Object.entries(counts).map(([id, count]) => ({ vehicle: vehicles.find((v) => v.id === id), count })).sort((a, b) => b.count - a.count);
  }, [assignments, vehicles]);

  const maintenanceByVehicle = useMemo(() => {
    const costs: Record<string, number> = {};
    maintenance.forEach((m) => { costs[m.vehicle_id] = (costs[m.vehicle_id] || 0) + (m.cost ?? 0); });
    return Object.entries(costs).map(([id, cost]) => ({ vehicle: vehicles.find((v) => v.id === id), cost })).sort((a, b) => b.cost - a.cost);
  }, [maintenance, vehicles]);

  const fuelByVehicle = useMemo(() => {
    const costs: Record<string, number> = {};
    fuel.forEach((f) => { costs[f.vehicle_id] = (costs[f.vehicle_id] || 0) + (f.cost ?? 0); });
    return Object.entries(costs).map(([id, cost]) => ({ vehicle: vehicles.find((v) => v.id === id), cost })).sort((a, b) => b.cost - a.cost);
  }, [fuel, vehicles]);

  const dueService = useMemo(() => vehicles.filter((v) => v.service_due_date && new Date(v.service_due_date) <= new Date()).sort((a, b) => new Date(a.service_due_date!).getTime() - new Date(b.service_due_date!).getTime()), [vehicles]);
  const expiring = useMemo(() => vehicles.filter((v) => (v.insurance_expiry && new Date(v.insurance_expiry) <= new Date(new Date().setDate(new Date().getDate() + 30))) || (v.registration_expiry && new Date(v.registration_expiry) <= new Date(new Date().setDate(new Date().getDate() + 30)))), [vehicles]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-2xl font-bold tracking-tight">Reports</h1>
          <Select value={report} onValueChange={setReport}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="utilization">Vehicle utilization</SelectItem>
              <SelectItem value="maintenance">Maintenance costs</SelectItem>
              <SelectItem value="fuel">Fuel expenses</SelectItem>
              <SelectItem value="assignments">Active assignments</SelectItem>
              <SelectItem value="due">Vehicles due for service</SelectItem>
              <SelectItem value="expiring">Insurance/registration expiring</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {report === "utilization" && (
          <Card><CardHeader><CardTitle className="text-base">Vehicle utilization</CardTitle></CardHeader><CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Vehicle</TableHead><TableHead>Assignments</TableHead></TableRow></TableHeader>
              <TableBody>
                {utilization.map((u) => <TableRow key={u.vehicle?.id || u.vehicle?.vehicle_id}><TableCell className="font-mono">{u.vehicle?.vehicle_id} — {u.vehicle?.make} {u.vehicle?.model}</TableCell><TableCell>{u.count}</TableCell></TableRow>)}
                {utilization.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        )}

        {report === "maintenance" && (
          <Card><CardHeader><CardTitle className="text-base">Maintenance costs by vehicle</CardTitle></CardHeader><CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Vehicle</TableHead><TableHead>Total cost</TableHead></TableRow></TableHeader>
              <TableBody>
                {maintenanceByVehicle.map((m) => <TableRow key={m.vehicle?.id}><TableCell className="font-mono">{m.vehicle?.vehicle_id} — {m.vehicle?.make} {m.vehicle?.model}</TableCell><TableCell className="font-mono">${m.cost.toLocaleString()}</TableCell></TableRow>)}
                {maintenanceByVehicle.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        )}

        {report === "fuel" && (
          <Card><CardHeader><CardTitle className="text-base">Fuel expenses by vehicle</CardTitle></CardHeader><CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Vehicle</TableHead><TableHead>Total cost</TableHead></TableRow></TableHeader>
              <TableBody>
                {fuelByVehicle.map((f) => <TableRow key={f.vehicle?.id}><TableCell className="font-mono">{f.vehicle?.vehicle_id} — {f.vehicle?.make} {f.vehicle?.model}</TableCell><TableCell className="font-mono">${f.cost.toLocaleString()}</TableCell></TableRow>)}
                {fuelByVehicle.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        )}

        {report === "assignments" && (
          <Card><CardHeader><CardTitle className="text-base">Active assignments</CardTitle></CardHeader><CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Vehicle</TableHead><TableHead>Employee</TableHead><TableHead>Issued</TableHead><TableHead>Expected return</TableHead></TableRow></TableHeader>
              <TableBody>
                {assignments.filter((a) => !a.actual_return_date).map((a) => <TableRow key={a.id}><TableCell className="font-mono">{a.vehicle?.vehicle_id || a.vehicle_id}</TableCell><TableCell>{a.employee?.full_name || a.employee_id}</TableCell><TableCell>{a.assigned_date}</TableCell><TableCell>{a.expected_return_date || "—"}</TableCell></TableRow>)}
                {assignments.filter((a) => !a.actual_return_date).length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No active assignments</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        )}

        {report === "due" && (
          <Card><CardHeader><CardTitle className="text-base">Vehicles due for service</CardTitle></CardHeader><CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Vehicle</TableHead><TableHead>Service due</TableHead></TableRow></TableHeader>
              <TableBody>
                {dueService.map((v) => <TableRow key={v.id}><TableCell className="font-mono">{v.vehicle_id} — {v.make} {v.model}</TableCell><TableCell><Badge variant="warning">{v.service_due_date}</Badge></TableCell></TableRow>)}
                {dueService.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">None due</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        )}

        {report === "expiring" && (
          <Card><CardHeader><CardTitle className="text-base">Insurance/registration expiring within 30 days</CardTitle></CardHeader><CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Vehicle</TableHead><TableHead>Insurance</TableHead><TableHead>Registration</TableHead></TableRow></TableHeader>
              <TableBody>
                {expiring.map((v) => <TableRow key={v.id}><TableCell className="font-mono">{v.vehicle_id} — {v.make} {v.model}</TableCell><TableCell>{v.insurance_expiry || "—"}</TableCell><TableCell>{v.registration_expiry || "—"}</TableCell></TableRow>)}
                {expiring.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">None expiring soon</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        )}
      </div>
    </AppShell>
  );
}

export default withAuth(ReportsPage, ["admin", "director"]);