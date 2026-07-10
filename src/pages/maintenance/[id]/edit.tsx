import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vehicleService, maintenanceService, maintenanceTypeService, type Vehicle, type Maintenance, type MaintenanceType } from "@/services/fleetService";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

function EditMaintenancePage() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [serviceTypes, setServiceTypes] = useState<MaintenanceType[]>([]);
  const [record, setRecord] = useState<Maintenance | null>(null);
  const [vehicleId, setVehicleId] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [provider, setProvider] = useState("");
  const [cost, setCost] = useState("");
  const [mileage, setMileage] = useState("");
  const [nextDue, setNextDue] = useState("");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      vehicleService.list().then(({ data }) => setVehicles(data ?? [])),
      maintenanceTypeService.list().then(({ data, error }) => {
        if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
        setServiceTypes(data ?? []);
      }),
      maintenanceService.get(id).then(({ data, error }) => {
        if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
        if (data) {
          setRecord(data);
          setVehicleId(data.vehicle_id);
          setServiceType(data.service_type);
          setServiceDate(data.service_date);
          setProvider(data.service_provider || "");
          setCost(data.cost?.toString() || "");
          setMileage(data.mileage_at_service?.toString() || "");
          setNextDue(data.next_service_due || "");
        }
        setLoading(false);
      }),
    ]);
  }, [id, toast]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;
    setSaving(true);
    const { error } = await maintenanceService.update(record.id, {
      vehicle_id: vehicleId,
      service_type: serviceType,
      service_date: serviceDate,
      service_provider: provider || null,
      cost: cost ? parseFloat(cost) : null,
      mileage_at_service: mileage ? parseInt(mileage) : null,
      next_service_due: nextDue || null,
    });
    if (!error && nextDue) await vehicleService.update(vehicleId, { service_due_date: nextDue });
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Maintenance updated" });
      router.push("/maintenance");
    }
  };

  if (loading) return <AppShell><div className="p-8 text-center">Loading…</div></AppShell>;

  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-6">Edit maintenance</h1>
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
                  <SelectContent>{serviceTypes.map((t) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Service date</Label><Input type="date" required value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} /></div>
                <div><Label>Next service due</Label><Input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Cost (AWG)</Label><Input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
                <div><Label>Mileage at service</Label><Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} /></div>
              </div>
              <div><Label>Service provider</Label><Input value={provider} onChange={(e) => setProvider(e.target.value)} /></div>
            </CardContent>
          </Card>
          <div className="mt-6 flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push("/maintenance")}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default withAuth(EditMaintenancePage, ["admin"]);