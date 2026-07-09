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
import { vehicleService, incidentService, type Vehicle } from "@/services/fleetService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

function NewIncidentPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [type, setType] = useState("Mechanical issue");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    vehicleService.list().then(({ data }) => setVehicles(data ?? []));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await incidentService.create({
      vehicle_id: vehicleId,
      reporter_id: profile?.id || null,
      incident_type: type,
      incident_date: date,
      location,
      description,
      status: "Open",
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Accident", "Damage", "Traffic fine", "Mechanical issue", "Breakdown"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Date</Label><Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></div>
                <div><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
              </div>
              <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
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