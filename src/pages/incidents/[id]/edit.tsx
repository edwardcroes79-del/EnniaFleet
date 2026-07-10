import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { vehicleService, incidentService, incidentTypeService, incidentPhotoService, incidentDocumentService, type Vehicle, type Incident, type IncidentType } from "@/services/fleetService";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, FileText } from "lucide-react";

function EditIncidentPage() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [types, setTypes] = useState<IncidentType[]>([]);
  const [record, setRecord] = useState<Incident | null>(null);
  const [vehicleId, setVehicleId] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("Open");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [newPhotoUrls, setNewPhotoUrls] = useState<string[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<string[]>([]);
  const [newDocumentFiles, setNewDocumentFiles] = useState<File[]>([]);
  const [newDocumentUrls, setNewDocumentUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      vehicleService.list().then(({ data }) => setVehicles(data ?? [])),
      incidentTypeService.list().then(({ data }) => setTypes(data ?? [])),
      incidentService.get(id).then(({ data, error }) => {
        if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
        if (data) {
          setRecord(data);
          setVehicleId(data.vehicle_id);
          setType(data.incident_type);
          setStatus(data.status);
          setDate(data.incident_date);
          setLocation(data.location || "");
          setDescription(data.description || "");
          setExistingPhotos(Array.isArray(data.photos) ? data.photos : []);
          setExistingDocuments(Array.isArray(data.documents) ? data.documents : []);
        }
        setLoading(false);
      }),
    ]);
  }, [id, toast]);

  const handleAddPhoto = (file?: File) => {
    if (!file) return;
    setNewPhotoFiles((prev) => [...prev, file]);
    setNewPhotoUrls((prev) => [...prev, URL.createObjectURL(file)]);
  };

  const removeExistingPhoto = (idx: number) => setExistingPhotos((prev) => prev.filter((_, i) => i !== idx));
  const removeNewPhoto = (idx: number) => {
    setNewPhotoFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewPhotoUrls((prev) => prev.filter((_, i) => i !== idx));
  };
  const handleAddDocument = (file?: File) => {
    if (!file) return;
    setNewDocumentFiles((prev) => [...prev, file]);
    setNewDocumentUrls((prev) => [...prev, URL.createObjectURL(file)]);
  };
  const removeExistingDocument = (idx: number) => setExistingDocuments((prev) => prev.filter((_, i) => i !== idx));
  const removeNewDocument = (idx: number) => {
    setNewDocumentFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewDocumentUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;
    setSaving(true);

    const uploadedPhotos: string[] = [];
    if (type.toLowerCase() === "accident" && newPhotoFiles.length > 0) {
      for (const file of newPhotoFiles) {
        const { publicUrl, error } = await incidentPhotoService.upload(file);
        if (error) {
          toast({ title: "Upload error", description: error.message, variant: "destructive" });
          setSaving(false);
          return;
        }
        if (publicUrl) uploadedPhotos.push(publicUrl);
      }
    }

    const uploadedDocs: string[] = [];
    if (type.toLowerCase() === "accident" && newDocumentFiles.length > 0) {
      for (const file of newDocumentFiles) {
        const { publicUrl, error } = await incidentDocumentService.upload(file);
        if (error) {
          toast({ title: "Upload error", description: error.message, variant: "destructive" });
          setSaving(false);
          return;
        }
        if (publicUrl) uploadedDocs.push(publicUrl);
      }
    }

    const allPhotos = type.toLowerCase() === "accident" ? [...existingPhotos, ...uploadedPhotos] : null;
    const allDocuments = type.toLowerCase() === "accident" ? [...existingDocuments, ...uploadedDocs] : null;

    const { error } = await incidentService.update(record.id, {
      vehicle_id: vehicleId,
      incident_type: type,
      incident_date: date,
      location: location || null,
      description: description || null,
      status,
      photos: allPhotos,
      documents: allDocuments,
    });
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Incident updated" });
      router.push("/incidents");
    }
  };

  if (loading) return <AppShell><div className="p-8 text-center">Loading…</div></AppShell>;

  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-6">Edit incident</h1>
        <form onSubmit={submit}>
          <Card>
            <CardHeader><CardTitle className="text-base">Incident details</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <Label>Vehicle</Label>
                <Select value={vehicleId} onValueChange={setVehicleId} required>
                  <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.vehicle_id} — {v.make} {v.model}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Incident type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{types.map((t) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Open", "In Progress", "Resolved"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Date</Label><Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></div>
                <div><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
              </div>
              <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
              {type.toLowerCase() === "accident" && (
                <>
                  <div>
                    <Label>Photos</Label>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {existingPhotos.map((url, idx) => (
                        <div key={`ex-${idx}`} className="relative h-24 w-24 rounded-md border overflow-hidden">
                          <Dialog>
                            <DialogTrigger asChild>
                              <button type="button" className="h-full w-full">
                                <img src={url} alt="" className="h-full w-full object-cover" />
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <img src={url} alt="" className="w-full rounded-md" />
                            </DialogContent>
                          </Dialog>
                          <button type="button" onClick={() => removeExistingPhoto(idx)} className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-white"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                      {newPhotoUrls.map((url, idx) => (
                        <div key={`new-${idx}`} className="relative h-24 w-24 rounded-md border overflow-hidden">
                          <Dialog>
                            <DialogTrigger asChild>
                              <button type="button" className="h-full w-full">
                                <img src={url} alt="" className="h-full w-full object-cover" />
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <img src={url} alt="" className="w-full rounded-md" />
                            </DialogContent>
                          </Dialog>
                          <button type="button" onClick={() => removeNewPhoto(idx)} className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-white"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                      <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed hover:bg-muted">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="mt-1 text-xs text-muted-foreground">Add</span>
                        <input type="file" accept="image/*" className="sr-only" onChange={(e) => handleAddPhoto(e.target.files?.[0])} />
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label>Documents (quotes, survey reports)</Label>
                    <div className="mt-2 space-y-2">
                      {existingDocuments.map((url, idx) => (
                        <div key={`doc-ex-${idx}`} className="flex items-center justify-between rounded-md border p-2">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                            <FileText className="h-4 w-4" /> Document {idx + 1}
                          </a>
                          <button type="button" onClick={() => removeExistingDocument(idx)} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
                        </div>
                      ))}
                      {newDocumentUrls.map((url, idx) => (
                        <div key={`doc-new-${idx}`} className="flex items-center justify-between rounded-md border p-2">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                            <FileText className="h-4 w-4" /> {newDocumentFiles[idx]?.name || `New document ${idx + 1}`}
                          </a>
                          <button type="button" onClick={() => removeNewDocument(idx)} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
                        </div>
                      ))}
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 hover:bg-muted">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Upload PDF</span>
                        <input type="file" accept=".pdf,application/pdf" className="sr-only" onChange={(e) => handleAddDocument(e.target.files?.[0])} />
                      </label>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          <div className="mt-6 flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push("/incidents")}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default withAuth(EditIncidentPage, ["admin", "director", "employee"]);