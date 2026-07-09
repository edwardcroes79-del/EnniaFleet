import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vehicleService, employeeService, assignmentService, type Vehicle, type Employee } from "@/services/fleetService";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

function NewAssignmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [assignedDate, setAssignedDate] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [odometerOut, setOdometerOut] = useState("");
  const [fuelLevelOut, setFuelLevelOut] = useState("Full");
  const [comments, setComments] = useState("");

  useEffect(() => {
    vehicleService.list().then(({ data }) => setVehicles((data ?? []).filter((v) => v.status === "Available")));
    employeeService.list().then(({ data }) => setEmployees(data ?? []));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await assignmentService.create({
      vehicle_id: vehicleId,
      employee_id: employeeId,
      assigned_date: assignedDate,
      expected_return_date: expectedReturn || null,
      odometer_out: odometerOut ? parseInt(odometerOut) : null,
      fuel_level_out: fuelLevelOut,
      condition_comments: comments,
      status: "Active",
    } as any);
    if (!error) await vehicleService.update(vehicleId, { status: "Assigned" });
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Assignment created" });
      router.push("/assignments");
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-6">New assignment</h1>
        <form onSubmit={submit}>
          <Card>
            <CardHeader><CardTitle className="text-base">Assignment details</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <Label>Vehicle</Label>
                <Select value={vehicleId} onValueChange={setVehicleId} required>
                  <SelectTrigger><SelectValue placeholder="Select available vehicle" /></SelectTrigger>
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
                <div><Label>Odometer out</Label><Input type="number" value={odometerOut} onChange={(e) => setOdometerOut(e.target.value)} /></div>
                <div>
                  <Label>Fuel level out</Label>
                  <Select value={fuelLevelOut} onValueChange={setFuelLevelOut}>
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
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create assignment</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default withAuth(NewAssignmentPage, ["admin"]);