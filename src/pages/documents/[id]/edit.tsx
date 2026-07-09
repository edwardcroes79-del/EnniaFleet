import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vehicleService, documentService, type Vehicle, type Document } from "@/services/fleetService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, FileText } from "lucide-react";

function EditDocumentPage() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [doc, setDoc] = useState<Document | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [docType, setDocType] = useState("Registration");
  const [title, setTitle] = useState("");
  const [expiry, setExpiry] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    vehicleService.list().then(({ data }) => setVehicles(data ?? []));
  }, []);

  useEffect(() => {
    if (!id) return;
    documentService.get(id).then(({ data }) => {
      if (!data) return;
      setDoc(data);
      setVehicleId(data.vehicle_id || "");
      setDocType(data.document_type);
      setTitle(data.title || "");
      setExpiry(data.expiry_date || "");
    });
  }, [id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !doc) return;
    setSaving(true);
    try {
      let fileUrl = doc.file_url;
      if (file) {
        const path = `documents/${Date.now()}_${file.name}`;
        const { error: upError } = await supabase.storage.from("fleet-documents").upload(path, file);
        if (upError) throw upError;
        const { data } = supabase.storage.from("fleet-documents").getPublicUrl(path);
        fileUrl = data.publicUrl;
      }
      const { error } = await documentService.update(id, {
        vehicle_id: vehicleId || null,
        document_type: docType,
        title,
        expiry_date: expiry || null,
        file_url: fileUrl,
      });
      if (error) throw error;
      toast({ title: "Document updated" });
      router.push("/documents");
    } catch (err) {
      console.error("Update document error:", err);
      toast({
        title: "Could not update document",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!doc) {
    return (
      <AppShell>
        <div className="py-12 text-center">Loading…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl">
        <Link href="/documents" className="text-sm text-muted-foreground hover:underline flex items-center gap-1 mb-2">
          <ArrowLeft className="h-4 w-4" /> Back to documents
        </Link>
        <h1 className="font-display text-2xl font-bold tracking-tight mb-6">Edit document</h1>
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
              <div>
                <Label>Replace file</Label>
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                {file ? <p className="mt-1 text-sm text-muted-foreground">{file.name}</p> : doc.file_url ? (
                  <a href={doc.file_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-primary hover:underline text-sm">
                    <FileText className="h-4 w-4" /> Current file
                  </a>
                ) : null}
              </div>
            </CardContent>
          </Card>
          <div className="mt-6 flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push("/documents")}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default withAuth(EditDocumentPage, ["admin"]);