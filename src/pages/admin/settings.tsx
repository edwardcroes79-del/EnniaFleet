import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { settingsService, type AppSettings } from "@/services/settingsService";
import { authService } from "@/services/authService";
import { incidentTypeService, type IncidentType, maintenanceTypeService, type MaintenanceType } from "@/services/fleetService";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Plus } from "lucide-react";

function AdminSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [currency, setCurrency] = useState("AWG");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [reminderSubject, setReminderSubject] = useState("");
  const [reminderBody, setReminderBody] = useState("");
  const [incidentTypes, setIncidentTypes] = useState<IncidentType[]>([]);
  const [newType, setNewType] = useState("");
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [newMaintenanceType, setNewMaintenanceType] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [testReminderLoading, setTestReminderLoading] = useState(false);
  const [testReminderResult, setTestReminderResult] = useState<{ sent: boolean; recipient: string; note?: string } | null>(null);

  const loadTypes = () => {
    incidentTypeService.list().then(({ data, error }) => {
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else setIncidentTypes(data ?? []);
    });
  };

  const loadMaintenanceTypes = () => {
    maintenanceTypeService.list().then(({ data, error }) => {
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else setMaintenanceTypes(data ?? []);
    });
  };

  useEffect(() => {
    Promise.all([
      settingsService.get().then(({ data, error }) => {
        if (data) {
          setSettings(data);
          setCompanyName(data.company_name);
          setCurrency(data.currency);
          setReminderSubject(data.reminder_email_subject);
          setReminderBody(data.reminder_email_body);
        }
        if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      }),
      loadTypes(),
      loadMaintenanceTypes(),
    ]).then(() => setLoading(false));
  }, [toast]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let logoUrl = settings?.logo_url || null;
      if (logoFile) {
        const { publicUrl, error } = await settingsService.uploadLogo(logoFile);
        if (error) throw error;
        logoUrl = publicUrl;
      }
      const { data, error } = await settingsService.upsert({
        company_name: companyName,
        currency,
        logo_url: logoUrl,
        reminder_email_subject: reminderSubject,
        reminder_email_body: reminderBody,
      });
      if (error) throw error;
      toast({ title: "Settings saved" });
      setLogoFile(null);
      if (data) setSettings(data);
    } catch (err) {
      toast({
        title: "Could not save settings",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addType = async () => {
    if (!newType.trim()) return;
    const { data, error } = await incidentTypeService.create(newType.trim());
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Incident type added" });
      setNewType("");
      loadTypes();
    }
  };

  const removeType = async (id: string) => {
    const { error } = await incidentTypeService.update(id, { is_active: false });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Incident type removed" });
      loadTypes();
    }
  };

  const addMaintenanceType = async () => {
    if (!newMaintenanceType.trim()) return;
    const { data, error } = await maintenanceTypeService.create(newMaintenanceType.trim());
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Service type added" });
      setNewMaintenanceType("");
      loadMaintenanceTypes();
    }
  };

  const removeMaintenanceType = async (id: string) => {
    const { error } = await maintenanceTypeService.update(id, { is_active: false });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Service type removed" });
      loadMaintenanceTypes();
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setPasswordSaving(true);
    const { error } = await authService.updatePassword(newPassword);
    setPasswordSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const changeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.includes("@")) {
      toast({ title: "Enter a valid email address", variant: "destructive" });
      return;
    }
    if (newEmail !== confirmEmail) {
      toast({ title: "Email addresses do not match", variant: "destructive" });
      return;
    }
    setEmailSaving(true);
    const { error } = await authService.updateEmail(newEmail);
    setEmailSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email updated", description: "A confirmation email may be sent to the new address." });
      setNewEmail("");
      setConfirmEmail("");
    }
  };

  const sendTestReminder = async () => {
    setTestReminderLoading(true);
    setTestReminderResult(null);
    const { data, error } = await settingsService.sendTestReminder();
    setTestReminderLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      setTestReminderResult({ sent: data.sent, recipient: data.recipient, note: data.note });
      toast({ title: "Test reminder sent", description: `Sent to ${data.recipient}` });
    }
  };

  if (loading) {
    return <AppShell><div className="py-12 text-center">Loading…</div></AppShell>;
  }

  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-6">System settings</h1>
        <form onSubmit={submit}>
          <Card>
            <CardHeader><CardTitle className="text-base">Branding</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <Label>Company name</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div>
                <Label>Currency</Label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
              </div>
              <div>
                <Label>Logo</Label>
                {settings?.logo_url && (
                  <div className="mt-2 mb-3">
                    <img src={settings.logo_url} alt="Current logo" className="h-16 object-contain" />
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <Button asChild variant="outline" type="button">
                    <label className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" /> Upload logo
                      <input type="file" accept="image/*" className="sr-only" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                    </label>
                  </Button>
                  <span className="text-sm text-muted-foreground">{logoFile ? logoFile.name : "No file chosen"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardHeader><CardTitle className="text-base">Return reminder email</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <Label>Subject</Label>
                <Input value={reminderSubject} onChange={(e) => setReminderSubject(e.target.value)} placeholder="Reminder: Vehicle return due in 3 months" />
              </div>
              <div>
                <Label>Body</Label>
                <textarea
                  value={reminderBody}
                  onChange={(e) => setReminderBody(e.target.value)}
                  rows={6}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Dear {{employee_name}}, ..."
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Use {"{{employee_name}}"}, {"{{vehicle}}"}, and {"{{expected_return_date}}"} as placeholders.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardHeader><CardTitle className="text-base">Test reminder</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <p className="text-sm text-muted-foreground">
                Send a test reminder email to yourself using the configured subject and body above. Placeholders will use sample data.
              </p>
              <Button type="button" onClick={sendTestReminder} disabled={testReminderLoading}>
                {testReminderLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send test reminder
              </Button>
              {testReminderResult && (
                <div className="rounded-md border bg-muted p-3 text-sm">
                  <p>{testReminderResult.sent ? "Test reminder sent." : "Test reminder logged."}</p>
                  <p className="text-muted-foreground">Recipient: {testReminderResult.recipient}</p>
                  {testReminderResult.note && <p className="text-muted-foreground">{testReminderResult.note}</p>}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardHeader><CardTitle className="text-base">Incident types</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex gap-2">
                <Input value={newType} onChange={(e) => setNewType(e.target.value)} placeholder="New incident type" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addType())} />
                <Button type="button" onClick={addType}><Plus className="h-4 w-4" /></Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incidentTypes.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.name}</TableCell>
                      <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => removeType(t.id)}><X className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardHeader><CardTitle className="text-base">Maintenance service types</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex gap-2">
                <Input value={newMaintenanceType} onChange={(e) => setNewMaintenanceType(e.target.value)} placeholder="New service type" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMaintenanceType())} />
                <Button type="button" onClick={addMaintenanceType}><Plus className="h-4 w-4" /></Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceTypes.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.name}</TableCell>
                      <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => removeMaintenanceType(t.id)}><X className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardHeader><CardTitle className="text-base">Change email</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <Label>New email</Label>
                <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="admin@company.com" />
              </div>
              <div>
                <Label>Confirm new email</Label>
                <Input type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} placeholder="admin@company.com" />
              </div>
              <Button type="button" onClick={changeEmail} disabled={emailSaving}>{emailSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Update email</Button>
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardHeader><CardTitle className="text-base">Change password</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <Label>Current password</Label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div>
                <Label>New password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div>
                <Label>Confirm new password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <Button type="button" onClick={changePassword} disabled={passwordSaving}>{passwordSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Update password</Button>
            </CardContent>
          </Card>
          <div className="mt-6 flex gap-3">
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save settings</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default withAuth(AdminSettingsPage, ["admin"]);