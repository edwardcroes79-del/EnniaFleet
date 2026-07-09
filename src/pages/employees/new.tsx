import { useState } from "react";
import { useRouter } from "next/router";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { employeeService } from "@/services/fleetService";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const initial = {
  employee_id: "",
  full_name: "",
  department: "",
  position: "",
  phone: "",
  email: "",
  license_number: "",
  license_expiry: "",
  emergency_contact: "",
};

function NewEmployeePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState(initial);

  const set = (key: keyof typeof values, value: string) => setValues((s) => ({ ...s, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await employeeService.create({
      ...values,
      license_expiry: values.license_expiry || null,
    } as any);
    setSaving(false);
    if (error) toast({ title: "Could not create employee", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Employee created" });
      router.push("/employees");
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-6">Add employee</h1>
        <form onSubmit={submit}>
          <Card>
            <CardHeader><CardTitle className="text-base">Employee details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="employee_id">Employee ID</Label><Input id="employee_id" required value={values.employee_id} onChange={(e) => set("employee_id", e.target.value)} /></div>
              <div><Label htmlFor="full_name">Full name</Label><Input id="full_name" required value={values.full_name} onChange={(e) => set("full_name", e.target.value)} /></div>
              <div><Label htmlFor="department">Department</Label><Input id="department" value={values.department} onChange={(e) => set("department", e.target.value)} /></div>
              <div><Label htmlFor="position">Position</Label><Input id="position" value={values.position} onChange={(e) => set("position", e.target.value)} /></div>
              <div><Label htmlFor="phone">Phone</Label><Input id="phone" type="tel" value={values.phone} onChange={(e) => set("phone", e.target.value)} /></div>
              <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={values.email} onChange={(e) => set("email", e.target.value)} /></div>
              <div><Label htmlFor="license_number">Driver's license number</Label><Input id="license_number" value={values.license_number} onChange={(e) => set("license_number", e.target.value)} /></div>
              <div><Label htmlFor="license_expiry">License expiration</Label><Input id="license_expiry" type="date" value={values.license_expiry} onChange={(e) => set("license_expiry", e.target.value)} /></div>
              <div className="sm:col-span-2"><Label htmlFor="emergency">Emergency contact</Label><Input id="emergency" value={values.emergency_contact} onChange={(e) => set("emergency_contact", e.target.value)} /></div>
            </CardContent>
          </Card>
          <div className="mt-6 flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push("/employees")}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save employee</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default withAuth(NewEmployeePage, ["admin"]);