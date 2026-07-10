import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { employeeService, type Employee } from "@/services/fleetService";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

function EditEmployeePage() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [employee, setEmployee] = useState<Partial<Employee>>({});

  useEffect(() => {
    if (!id) return;
    employeeService.get(id).then(({ data }) => data && setEmployee(data));
  }, [id]);

  const set = (key: keyof Employee, value: unknown) => setEmployee((s) => ({ ...s, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee.full_name || !employee.employee_id) {
      toast({ title: "Missing fields", description: "Full name and employee ID are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload: Partial<Employee> = { ...employee };
    delete payload.id;
    delete payload.created_at;
    delete payload.email;
    delete payload.role;
    const { error } = await employeeService.updateViaApi(id, payload);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Employee updated" });
      router.push("/employees");
    }
  };

  if (!employee.id) return <AppShell><div className="py-12 text-center">Loading…</div></AppShell>;

  return (
    <AppShell>
      <div className="max-w-3xl">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-6">Edit employee</h1>
        <form onSubmit={submit}>
          <Card>
            <CardHeader><CardTitle className="text-base">Employee details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div><Label>Employee ID</Label><Input value={employee.employee_id ?? ""} onChange={(e) => set("employee_id", e.target.value)} /></div>
              <div><Label>Full name</Label><Input value={employee.full_name ?? ""} onChange={(e) => set("full_name", e.target.value)} /></div>
              <div><Label>Department</Label><Input value={employee.department ?? ""} onChange={(e) => set("department", e.target.value || null)} /></div>
              <div><Label>Position</Label><Input value={employee.position ?? ""} onChange={(e) => set("position", e.target.value || null)} /></div>
              <div><Label>Phone</Label><Input type="tel" value={employee.phone ?? ""} onChange={(e) => set("phone", e.target.value || null)} /></div>
              <div><Label>Email</Label><Input type="email" value={employee.email ?? ""} disabled /></div>
              <div><Label>Driver's license number</Label><Input value={employee.license_number ?? ""} onChange={(e) => set("license_number", e.target.value || null)} /></div>
              <div><Label>License expiration</Label><Input type="date" value={employee.license_expiry ?? ""} onChange={(e) => set("license_expiry", e.target.value || null)} /></div>
              <div><Label>Emergency contact name</Label><Input value={employee.emergency_contact_name ?? ""} onChange={(e) => set("emergency_contact_name", e.target.value || null)} /></div>
              <div><Label>Emergency contact phone</Label><Input type="tel" value={employee.emergency_contact_phone ?? ""} onChange={(e) => set("emergency_contact_phone", e.target.value || null)} /></div>
            </CardContent>
          </Card>
          <div className="mt-6 flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push("/employees")}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default withAuth(EditEmployeePage, ["admin"]);