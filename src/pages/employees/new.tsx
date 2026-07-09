import { useState } from "react";
import { useRouter } from "next/router";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy } from "lucide-react";

const initial = {
  employee_id: "",
  full_name: "",
  department: "",
  position: "",
  phone: "",
  email: "",
  license_number: "",
  license_expiry: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
};

function randomPassword(length = 12) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
}

function NewEmployeePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState(initial);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);

  const set = (key: keyof typeof values, value: string) => setValues((s) => ({ ...s, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.email || !values.full_name || !values.employee_id) {
      toast({ title: "Missing fields", description: "Email, full name, and employee ID are required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/create-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          password: randomPassword(),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast({ title: "Could not create employee", description: body.error || "Unknown error", variant: "destructive" });
      } else {
        toast({ title: "Employee created" });
        setCreated({ email: body.email, tempPassword: body.tempPassword });
        setValues(initial);
      }
    } catch (err) {
      toast({ title: "Unexpected error", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
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
              <div><Label htmlFor="employee_id">Employee ID *</Label><Input id="employee_id" required value={values.employee_id} onChange={(e) => set("employee_id", e.target.value)} /></div>
              <div><Label htmlFor="full_name">Full name *</Label><Input id="full_name" required value={values.full_name} onChange={(e) => set("full_name", e.target.value)} /></div>
              <div><Label htmlFor="email">Email *</Label><Input id="email" type="email" required value={values.email} onChange={(e) => set("email", e.target.value)} /></div>
              <div><Label htmlFor="department">Department</Label><Input id="department" value={values.department} onChange={(e) => set("department", e.target.value)} /></div>
              <div><Label htmlFor="position">Position</Label><Input id="position" value={values.position} onChange={(e) => set("position", e.target.value)} /></div>
              <div><Label htmlFor="phone">Phone</Label><Input id="phone" type="tel" value={values.phone} onChange={(e) => set("phone", e.target.value)} /></div>
              <div><Label htmlFor="license_number">Driver's license number</Label><Input id="license_number" value={values.license_number} onChange={(e) => set("license_number", e.target.value)} /></div>
              <div><Label htmlFor="license_expiry">License expiration</Label><Input id="license_expiry" type="date" value={values.license_expiry} onChange={(e) => set("license_expiry", e.target.value)} /></div>
              <div><Label htmlFor="emergency_name">Emergency contact name</Label><Input id="emergency_name" value={values.emergency_contact_name} onChange={(e) => set("emergency_contact_name", e.target.value)} /></div>
              <div><Label htmlFor="emergency_phone">Emergency contact phone</Label><Input id="emergency_phone" type="tel" value={values.emergency_contact_phone} onChange={(e) => set("emergency_contact_phone", e.target.value)} /></div>
            </CardContent>
          </Card>
          <div className="mt-6 flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push("/employees")}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save employee</Button>
          </div>
        </form>

        {created && (
          <Card className="mt-6 border-success/50 bg-success/10">
            <CardHeader><CardTitle className="text-base">Employee account created</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Email</Label>
                <div className="flex items-center gap-2">
                  <Input readOnly value={created.email} />
                  <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(created.email); toast({ title: "Copied" }); }}><Copy className="h-4 w-4" /></Button>
                </div>
              </div>
              <div>
                <Label>Temporary password</Label>
                <div className="flex items-center gap-2">
                  <Input readOnly value={created.tempPassword} />
                  <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(created.tempPassword); toast({ title: "Copied" }); }}><Copy className="h-4 w-4" /></Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Share these credentials with the employee. They can change their password after logging in.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

export default withAuth(NewEmployeePage, ["admin"]);