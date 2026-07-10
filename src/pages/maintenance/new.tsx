import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vehicleService, maintenanceService, type Vehicle } from "@/services/fleetService";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

function NewMaintenancePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [serviceType, setServiceType] = useState("General repair");
  const [serviceDate, setServiceDate] = useState("");
  const [provider, setProvider] = useState("");
  const [cost, setCost] = useState("");
  const [mileage, setMileage] = useState("");
  const [nextDue, setNextDue] = useState("");

  useEffect(() => {
    vehicleService.list().then(({ data }) => setVehicles(data ?? []));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await maintenanceService.create({
      vehicle_id: vehicleId,
      service_type: serviceType,
      service_date: serviceDate,
      service_provider: provider || null,
      cost: cost ? parseFloat(cost) : null,
      mileage_at_service: mileage ? parseInt(mileage) : null,
      next_service_due: nextDue || null,
    } as any);
    if (!error && nextDue) await vehicleService.update(vehicleId, { service_due_date: nextDue });
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Service logged" });
      router.push("/maintenance");
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-6">Log service</h1>
        <form onSubmit={submit}>
          <Card>
            <CardHeader><CardTitle className="text-base">Service details</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <Label>Vehicle</Label>
                <Select value={vehicleId} onValueChange={setVehicleId} required>
                  <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.vehicle_id} — {v.make} {v.model}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Service type</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Oil change", "Tire replacement", "Brake service", "General repair", "Small service", "General service", "Annual inspection"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Service date</Label><Input type="date" required value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} /></div>
                <div><Label>Next service due</Label><Input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Cost ($)</Label><Input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
                <div><Label>Mileage at service</Label><Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} /></div>
              </div>
              <div><Label>Service provider</Label><Input value={provider} onChange={(e) => setProvider(e.target.value)} /></div>
            </CardContent>
          </Card>
          <div className="mt-6 flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push("/maintenance")}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Log service</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default withAuth(NewMaintenancePage, ["admin"]);