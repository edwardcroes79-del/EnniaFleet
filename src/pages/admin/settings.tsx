import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { settingsService, type AppSettings } from "@/services/settingsService";
import { authService } from "@/services/authService";
import { mfaService } from "@/services/mfaService";
import { incidentTypeService, type IncidentType, maintenanceTypeService, type MaintenanceType } from "@/services/fleetService";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Plus, Clock, RefreshCw, Shield, ShieldCheck, ShieldOff } from "lucide-react";
import QRCode from "qrcode";

type ReminderHistoryItem = {
  id: string;
  type: "return" | "service";
  reminder_type: string;
  recipient_email: string;
  status: "pending" | "sent" | "failed";
  error_message: string | null;
  created_at: string;
  employee_name: string | null;
  employee_email: string | null;
  vehicle_label: string | null;
};

function formatCountdown(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

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
  const [serviceReminderSubject, setServiceReminderSubject] = useState("");
  const [serviceReminderBody, setServiceReminderBody] = useState("");
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
  const [testServiceReminderLoading, setTestServiceReminderLoading] = useState(false);
  const [testServiceReminderResult, setTestServiceReminderResult] = useState<{ sent: boolean; recipient: string; note?: string } | null>(null);
  const [reminderHistory, setReminderHistory] = useState<ReminderHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [nextCronRun, setNextCronRun] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [nextReturnRun, setNextReturnRun] = useState<string | null>(null);
  const [nextServiceRun, setNextServiceRun] = useState<string | null>(null);
  const [returnCountdownSeconds, setReturnCountdownSeconds] = useState(0);
  const [serviceCountdownSeconds, setServiceCountdownSeconds] = useState(0);
  const [cronSchedule, setCronSchedule] = useState<{ returnReminders: { time: string; path: string }; serviceReminders: { time: string; path: string } } | null>(null);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(true);
  const [mfaSetup, setMfaSetup] = useState<{ secret: string; qrCodeUrl: string; qrCodeDataUrl: string } | null>(null);
  const [mfaToken, setMfaToken] = useState("");
  const [mfaVerifying, setMfaVerifying] = useState(false);
  const [mfaBackupCodes, setMfaBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    mfaService.isEnabled().then((enabled) => {
      setMfaEnabled(enabled);
      setMfaLoading(false);
    });
  }, []);

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
          setServiceReminderSubject(data.service_reminder_email_subject);
          setServiceReminderBody(data.service_reminder_email_body);
        }
        if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      }),
      loadTypes(),
      loadMaintenanceTypes(),
      loadReminderHistory(),
    ]).then(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    if (!nextCronRun) return;
    const interval = setInterval(() => {
      const next = new Date(nextCronRun);
      setCountdownSeconds(Math.max(0, Math.floor((next.getTime() - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [nextCronRun]);

  useEffect(() => {
    if (!nextReturnRun && !nextServiceRun) return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (nextReturnRun) {
        setReturnCountdownSeconds(Math.max(0, Math.floor((new Date(nextReturnRun).getTime() - now) / 1000)));
      }
      if (nextServiceRun) {
        setServiceCountdownSeconds(Math.max(0, Math.floor((new Date(nextServiceRun).getTime() - now) / 1000)));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [nextReturnRun, nextServiceRun]);

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
        service_reminder_email_subject: serviceReminderSubject,
        service_reminder_email_body: serviceReminderBody,
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

  const sendTestServiceReminder = async () => {
    setTestServiceReminderLoading(true);
    setTestServiceReminderResult(null);
    const { data, error } = await settingsService.sendTestMaintenanceReminder();
    setTestServiceReminderLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      setTestServiceReminderResult({ sent: data.sent, recipient: data.recipient, note: data.note });
      toast({ title: "Test service reminder sent", description: `Sent to ${data.recipient}` });
    }
  };

  const loadReminderHistory = async () => {
    setHistoryLoading(true);
    setReminderHistory([]);
    const { data, error } = await settingsService.getReminderHistory();
    setHistoryLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    if (data) {
      setReminderHistory(data.history);
      setNextCronRun(data.nextCronRun);
      setNextReturnRun(data.nextReturnRun);
      setNextServiceRun(data.nextServiceRun);
      setCronSchedule(data.schedule);
      const now = Date.now();
      const returnNext = new Date(data.nextReturnRun).getTime();
      const serviceNext = new Date(data.nextServiceRun).getTime();
      setReturnCountdownSeconds(Math.max(0, Math.floor((returnNext - now) / 1000)));
      setServiceCountdownSeconds(Math.max(0, Math.floor((serviceNext - now) / 1000)));
    }
  };

  const handleSetupMfa = async () => {
    const { data, error } = await mfaService.generateSecret();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    if (data) {
      const qrDataUrl = await QRCode.toDataURL(data.qrCodeUrl);
      setMfaSetup({ secret: data.secret, qrCodeUrl: data.qrCodeUrl, qrCodeDataUrl: qrDataUrl });
      setMfaToken("");
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!mfaSetup || !mfaToken.trim()) {
      toast({ title: "Error", description: "Please enter a verification code", variant: "destructive" });
      return;
    }
    setMfaVerifying(true);
    const { data, error } = await mfaService.verifyAndEnable(mfaSetup.secret, mfaToken);
    setMfaVerifying(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    if (data?.success) {
      setMfaEnabled(true);
      setMfaSetup(null);
      setMfaToken("");
      const { data: profileData } = await mfaService.getBackupCodes();
      if (profileData) setMfaBackupCodes(profileData.backupCodes);
      toast({ title: "MFA enabled", description: "Multi-factor authentication is now active" });
    }
  };

  const handleDisableMfa = async () => {
    if (!confirm("Are you sure you want to disable MFA? Your account will be less secure.")) return;
    const { error } = await mfaService.disable();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setMfaEnabled(false);
    setMfaBackupCodes([]);
    toast({ title: "MFA disabled", description: "Multi-factor authentication has been turned off" });
  };

  const handleCancelSetup = () => {
    setMfaSetup(null);
    setMfaToken("");
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
            <CardHeader><CardTitle className="text-base">Service reminder email</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <Label>Subject</Label>
                <Input value={serviceReminderSubject} onChange={(e) => setServiceReminderSubject(e.target.value)} placeholder="Service reminder: {{vehicle}} is due for service soon" />
              </div>
              <div>
                <Label>Body</Label>
                <textarea
                  value={serviceReminderBody}
                  onChange={(e) => setServiceReminderBody(e.target.value)}
                  rows={6}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="The vehicle {{vehicle}} is scheduled for {{service_type}} on {{next_service_due}}..."
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Use {"{{vehicle}}"}, {"{{service_type}}"}, {"{{next_service_due}}"}, {"{{mileage}}"}, {"{{service_provider}}"} as placeholders.
                </p>
              </div>
              <Button type="button" onClick={sendTestServiceReminder} disabled={testServiceReminderLoading}>
                {testServiceReminderLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send test service reminder
              </Button>
              {testServiceReminderResult && (
                <div className="rounded-md border bg-muted p-3 text-sm">
                  <p>{testServiceReminderResult.sent ? "Test service reminder sent." : "Test service reminder logged."}</p>
                  <p className="text-muted-foreground">Recipient: {testServiceReminderResult.recipient}</p>
                  {testServiceReminderResult.note && <p className="text-muted-foreground">{testServiceReminderResult.note}</p>}
                </div>
              )}
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
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {mfaEnabled ? <ShieldCheck className="h-5 w-5 text-emerald-500" /> : <Shield className="h-5 w-5" />}
                Multi-factor authentication
              </CardTitle>
              <CardDescription>
                {mfaEnabled
                  ? "Your account is protected with an additional verification step."
                  : "Add an extra layer of security to your account."}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {mfaLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Checking MFA status…
                </div>
              ) : mfaEnabled ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-emerald-900">MFA is enabled</p>
                      <p className="text-sm text-emerald-700">You'll be asked for a verification code after signing in.</p>
                    </div>
                  </div>
                  {mfaBackupCodes.length > 0 && (
                    <Alert>
                      <AlertDescription>
                        <p className="font-medium mb-2">Your backup codes:</p>
                        <div className="grid grid-cols-2 gap-1 font-mono text-sm">
                          {mfaBackupCodes.map((code, i) => (
                            <div key={i} className="rounded bg-muted px-2 py-1">{code}</div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Save these codes in a safe place. Each can be used once if you lose access to your authenticator app.
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button type="button" variant="destructive" onClick={handleDisableMfa}>
                    <ShieldOff className="mr-2 h-4 w-4" /> Disable MFA
                  </Button>
                </div>
              ) : mfaSetup ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Scan the QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.) or enter the secret key manually.
                  </p>
                  <div className="flex flex-col items-center gap-4 rounded-md border bg-muted/50 p-6">
                    <img src={mfaSetup.qrCodeDataUrl} alt="QR code" className="h-48 w-48" />
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Secret key:</p>
                      <code className="rounded bg-background px-3 py-1 font-mono text-sm">{mfaSetup.secret}</code>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mfa-token">Verification code</Label>
                    <Input
                      id="mfa-token"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={mfaToken}
                      onChange={(e) => setMfaToken(e.target.value)}
                      maxLength={6}
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the code from your authenticator app to verify setup.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" onClick={handleVerifyAndEnable} disabled={mfaVerifying}>
                      {mfaVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Verify and enable
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancelSetup}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Multi-factor authentication adds an extra layer of security by requiring a code from your authenticator app in addition to your password.
                  </p>
                  <Button type="button" onClick={handleSetupMfa}>
                    <Shield className="mr-2 h-4 w-4" /> Set up MFA
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Cron job monitor</CardTitle>
              <div className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                  <Clock className="h-4 w-4" />
                  <span>Return reminders: <span className="font-medium text-foreground">{cronSchedule?.returnReminders.time ?? "09:00 UTC"}</span> — {formatCountdown(returnCountdownSeconds)}</span>
                </div>
                <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                  <Clock className="h-4 w-4" />
                  <span>Service reminders: <span className="font-medium text-foreground">{cronSchedule?.serviceReminders.time ?? "09:00 UTC"}</span> — {formatCountdown(serviceCountdownSeconds)}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Recent reminder emails sent by the daily cron jobs.</p>
                <Button type="button" variant="outline" size="sm" onClick={loadReminderHistory} disabled={historyLoading}>
                  {historyLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminderHistory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">No reminder history yet.</TableCell>
                    </TableRow>
                  )}
                  {reminderHistory.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell>
                        <div>{h.employee_name || h.recipient_email}</div>
                        {h.employee_email && <div className="text-xs text-muted-foreground">{h.employee_email}</div>}
                      </TableCell>
                      <TableCell>{h.vehicle_label || "—"}</TableCell>
                      <TableCell className="capitalize">{h.reminder_type.replace(/_/g, " ")}</TableCell>
                      <TableCell>{new Date(h.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={h.status === "sent" ? "default" : "destructive"}>{h.status}</Badge>
                        {h.error_message && <p className="mt-1 max-w-xs truncate text-xs text-destructive">{h.error_message}</p>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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