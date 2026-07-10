import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vehicleService, fuelService, type Vehicle, type FuelLog } from "@/services/fleetService";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

function EditFuelPage() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [record, setRecord] = useState<FuelLog | null>(null);
  const [vehicleId, setVehicleId] = useState("");
  const [date, setDate] = useState("");
  const [odometer, setOdometer] = useState("");
  const [liters, setLiters] = useState("");
  const [cost, setCost] = useState("");
  const [station, setStation] = useState("");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      vehicleService.list().then(({ data }) => setVehicles(data ?? [])),
      fuelService.get(id).then(({ data, error }) => {
        if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
        if (data) {
          setRecord(data);
          setVehicleId(data.vehicle_id);
          setDate(data.fuel_date);
          setOdometer(data.odometer?.toString() || "");
          setLiters(data.liters?.toString() || "");
          setCost(data.cost?.toString() || "");
          setStation(data.station || "");
        }
        setLoading(false);
      }),
    ]);
  }, [id, toast]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;
    setSaving(true);
    const { error } = await fuelService.update(record.id, {
      vehicle_id: vehicleId,
      fuel_date: date,
      odometer: odometer ? parseInt(odometer) : null,
      liters: liters ? parseFloat(liters) : null,
      cost: cost ? parseFloat(cost) : null,
      station: station || null,
    });
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Fuel entry updated" });
      router.push("/fuel");
    }
  };

  if (loading) return <AppShell><div className="p-8 text-center">Loading…</div></AppShell>;

  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-6">Edit fuel entry</h1>
        <form onSubmit={submit}>
          <Card>
            <CardHeader><CardTitle className="text-base">Fuel details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Vehicle</Label>
                <Select value={vehicleId} onValueChange={setVehicleId} required>
                  <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.vehicle_id} — {v.make} {v.model}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Date</Label><Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div><Label>Odometer</Label><Input type="number" value={odometer} onChange={(e) => setOdometer(e.target.value)} /></div>
              <div><Label>Liters</Label><Input type="number" step="0.01" value={liters} onChange={(e) => setLiters(e.target.value)} /></div>
              <div><Label>Cost (AWG)</Label><Input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
              <div><Label>Fuel station</Label><Input value={station} onChange={(e) => setStation(e.target.value)} /></div>
            </CardContent>
          </Card>
          <div className="mt-6 flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push("/fuel")}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default withAuth(EditFuelPage, ["admin", "director", "employee"]);