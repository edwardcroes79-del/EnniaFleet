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
import { vehicleService, incidentService, incidentTypeService, incidentPhotoService, type Vehicle, type IncidentType } from "@/services/fleetService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X } from "lucide-react";

function NewIncidentPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [types, setTypes] = useState<IncidentType[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [type, setType] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  useEffect(() => {
    vehicleService.list().then(({ data }) => setVehicles(data ?? []));
    incidentTypeService.list().then(({ data }) => {
      setTypes(data ?? []);
      if (data && data.length > 0 && !type) setType(data[0].name);
    });
  }, []);

  const handleAddPhoto = (file?: File) => {
    if (!file) return;
    setPhotoFiles((prev) => [...prev, file]);
    setPhotoUrls((prev) => [...prev, URL.createObjectURL(file)]);
  };

  const removePhoto = (idx: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== idx));
    setPhotoUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const uploaded: string[] = [];
    if (type.toLowerCase() === "accident" && photoFiles.length > 0) {
      for (const file of photoFiles) {
        const { publicUrl, error } = await incidentPhotoService.upload(file);
        if (error) {
          toast({ title: "Upload error", description: error.message, variant: "destructive" });
          setSaving(false);
          return;
        }
        if (publicUrl) uploaded.push(publicUrl);
      }
    }

    const { error } = await incidentService.create({
      vehicle_id: vehicleId,
      reporter_id: profile?.id || null,
      incident_type: type,
      incident_date: date,
      location,
      description,
      status: "Open",
      photos: uploaded.length > 0 ? uploaded : null,
    } as any);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Incident reported" });
      router.push("/incidents");
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-6">Report incident</h1>
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Date</Label><Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></div>
                <div><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
              </div>
              <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
              {type.toLowerCase() === "accident" && (
                <div>
                  <Label>Photos</Label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {photoUrls.map((url, idx) => (
                      <div key={idx} className="relative h-24 w-24 rounded-md border overflow-hidden">
                        <img src={url} alt="" className="h-full w-full object-cover" />
                        <button type="button" onClick={() => removePhoto(idx)} className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-white"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                    <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed hover:bg-muted">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="mt-1 text-xs text-muted-foreground">Add</span>
                      <input type="file" accept="image/*" className="sr-only" onChange={(e) => handleAddPhoto(e.target.files?.[0])} />
                    </label>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="mt-6 flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push("/incidents")}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit report</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default withAuth(NewIncidentPage, ["admin", "director", "employee"]);