import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vehicleService, documentService, type Vehicle } from "@/services/fleetService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

function NewDocumentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [docType, setDocType] = useState("Registration");
  const [title, setTitle] = useState("");
  const [expiry, setExpiry] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    vehicleService.list().then(({ data }) => setVehicles(data ?? []));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ title: "Please select a file", variant: "destructive" });
      return;
    }
    setSaving(true);
    const path = `documents/${Date.now()}_${file.name}`;
    const { error: upError } = await supabase.storage.from("fleet-documents").upload(path, file);
    if (upError) {
      setSaving(false);
      toast({ title: "Upload failed", description: upError.message, variant: "destructive" });
      return;
    }
    const { data } = supabase.storage.from("fleet-documents").getPublicUrl(path);
    const { error } = await documentService.create({
      vehicle_id: vehicleId || null,
      document_type: docType,
      title,
      expiry_date: expiry || null,
      file_url: data.publicUrl,
    } as any);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Document uploaded" });
      router.push("/documents");
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-6">Upload document</h1>
        <form onSubmit={submit}>
          <Card>
            <CardHeader><CardTitle className="text-base">Document details</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <Label>Vehicle (optional)</Label>
                <Select value={vehicleId} onValueChange={setVehicleId}>
                  <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.vehicle_id} — {v.make} {v.model}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Document type</Label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Registration", "Insurance", "Inspection certificate", "Purchase document", "Service record"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Title</Label><Input required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
              <div><Label>Expiry date</Label><Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} /></div>
              <div><Label>File</Label><Input type="file" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
            </CardContent>
          </Card>
          <div className="mt-6 flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push("/documents")}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Upload document</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default withAuth(NewDocumentPage, ["admin"]);