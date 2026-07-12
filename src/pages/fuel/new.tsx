import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vehicleService, fuelService, type Vehicle } from "@/services/fleetService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

function NewFuelPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [date, setDate] = useState("");
  const [odometer, setOdometer] = useState("");
  const [liters, setLiters] = useState("");
  const [cost, setCost] = useState("");
  const [station, setStation] = useState("");

  useEffect(() => {
    vehicleService.list().then(({ data }) => setVehicles(data ?? []));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await fuelService.create({
      vehicle_id: vehicleId,
      driver_id: profile?.id || null,
      fuel_date: date,
      odometer: odometer ? parseInt(odometer) : null,
      liters: liters ? parseFloat(liters) : null,
      cost: cost ? parseFloat(cost) : null,
      fuel_station: station || null,
    });
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Fuel entry added" });
      router.push("/fuel");
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-6">Add fuel entry</h1>
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
              <div><Label>Cost ($)</Label><Input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
              <div><Label>Fuel station</Label><Input value={station} onChange={(e) => setStation(e.target.value)} /></div>
            </CardContent>
          </Card>
          <div className="mt-6 flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push("/fuel")}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save entry</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default withAuth(NewFuelPage, ["admin", "director", "employee"]);