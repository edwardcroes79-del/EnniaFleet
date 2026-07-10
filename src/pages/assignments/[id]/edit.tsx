import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vehicleService, employeeService, assignmentService, type Vehicle, type Employee, type Assignment } from "@/services/fleetService";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

function EditAssignmentPage() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [vehicleId, setVehicleId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [assignedDate, setAssignedDate] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [actualReturn, setActualReturn] = useState("");
  const [odometerOut, setOdometerOut] = useState("");
  const [odometerIn, setOdometerIn] = useState("");
  const [fuelLevelOut, setFuelLevelOut] = useState("Full");
  const [fuelLevelIn, setFuelLevelIn] = useState("");
  const [comments, setComments] = useState("");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      vehicleService.list().then(({ data }) => setVehicles(data ?? [])),
      employeeService.list().then(({ data }) => setEmployees(data ?? [])),
      assignmentService.get(id).then(({ data, error }) => {
        if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
        if (data) {
          setAssignment(data);
          setVehicleId(data.vehicle_id);
          setEmployeeId(data.employee_id);
          setAssignedDate(data.assigned_date);
          setExpectedReturn(data.expected_return_date || "");
          setActualReturn(data.actual_return_date || "");
          setOdometerOut(data.odometer_issue?.toString() || "");
          setOdometerIn(data.odometer_return?.toString() || "");
          setFuelLevelOut(data.fuel_level_issue || "Full");
          setFuelLevelIn(data.fuel_level_return || "");
          setComments(data.condition_comments || "");
        }
        setLoading(false);
      }),
    ]);
  }, [id, toast]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment) return;
    setSaving(true);
    const { error } = await assignmentService.update(assignment.id, {
      vehicle_id: vehicleId,
      employee_id: employeeId,
      assigned_date: assignedDate,
      expected_return_date: expectedReturn || null,
      actual_return_date: actualReturn || null,
      odometer_issue: odometerOut ? parseInt(odometerOut) : null,
      odometer_return: odometerIn ? parseInt(odometerIn) : null,
      fuel_level_issue: fuelLevelOut,
      fuel_level_return: fuelLevelIn || null,
      condition_comments: comments || null,
      is_active: actualReturn ? false : true,
    });
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Assignment updated" });
      router.push("/assignments");
    }
  };

  if (loading) return <AppShell><div className="p-8 text-center">Loading…</div></AppShell>;

  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-6">Edit assignment</h1>
        <form onSubmit={submit}>
          <Card>
            <CardHeader><CardTitle className="text-base">Assignment details</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <Label>Vehicle</Label>
                <Select value={vehicleId} onValueChange={setVehicleId} required>
                  <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.vehicle_id} — {v.make} {v.model}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Employee</Label>
                <Select value={employeeId} onValueChange={setEmployeeId} required>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Assignment date</Label><Input type="date" required value={assignedDate} onChange={(e) => setAssignedDate(e.target.value)} /></div>
                <div><Label>Expected return</Label><Input type="date" value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Actual return</Label><Input type="date" value={actualReturn} onChange={(e) => setActualReturn(e.target.value)} /></div>
                <div><Label>Returned active</Label><Select value={actualReturn ? "Returned" : "Active"} disabled><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Returned">Returned</SelectItem></SelectContent></Select></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Odometer out</Label><Input type="number" value={odometerOut} onChange={(e) => setOdometerOut(e.target.value)} /></div>
                <div><Label>Odometer in</Label><Input type="number" value={odometerIn} onChange={(e) => setOdometerIn(e.target.value)} /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Fuel level out</Label>
                  <Select value={fuelLevelOut} onValueChange={setFuelLevelOut}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Full", "3/4", "1/2", "1/4", "Empty"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fuel level in</Label>
                  <Select value={fuelLevelIn} onValueChange={setFuelLevelIn}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Full", "3/4", "1/2", "1/4", "Empty"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Condition comments</Label><Input value={comments} onChange={(e) => setComments(e.target.value)} /></div>
            </CardContent>
          </Card>
          <div className="mt-6 flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push("/assignments")}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default withAuth(EditAssignmentPage, ["admin"]);