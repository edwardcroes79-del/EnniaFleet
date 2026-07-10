import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { settingsService, type AppSettings } from "@/services/settingsService";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";

function AdminSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [currency, setCurrency] = useState("AWG");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    settingsService.get().then(({ data, error }) => {
      if (data) {
        setSettings(data);
        setCompanyName(data.company_name);
        setCurrency(data.currency);
      }
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
    });
  }, [toast]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      let logoUrl = settings.logo_url;
      if (logoFile) {
        const { publicUrl, error } = await settingsService.uploadLogo(logoFile);
        if (error) throw error;
        logoUrl = publicUrl;
      }
      const { error } = await settingsService.update(settings.id, {
        company_name: companyName,
        currency,
        logo_url: logoUrl,
      });
      if (error) throw error;
      toast({ title: "Settings saved" });
      setLogoFile(null);
      settingsService.get().then(({ data }) => data && setSettings(data));
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
          <div className="mt-6 flex gap-3">
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save settings</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default withAuth(AdminSettingsPage, ["admin"]);