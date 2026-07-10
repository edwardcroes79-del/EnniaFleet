import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { vehicleService, type Vehicle } from "@/services/fleetService";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

function EditVehiclePage() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [vehicle, setVehicle] = useState<Partial<Vehicle>>({});

  useEffect(() => {
    if (!id) return;
    vehicleService.get(id).then(({ data }) => data && setVehicle(data));
  }, [id]);

  const set = (key: keyof Vehicle, value: unknown) => setVehicle((s) => ({ ...s, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: Partial<Vehicle> = { ...vehicle };
    delete payload.id;
    delete payload.created_at;
    delete payload.is_deleted;
    const { error } = await vehicleService.update(id, payload);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Vehicle updated" });
      router.push(`/vehicles/${id}`);
    }
  };

  if (!vehicle.id) return <AppShell><div className="py-12 text-center">Loading…</div></AppShell>;

  return (
    <AppShell>
      <div className="max-w-3xl">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-6">Edit vehicle</h1>
        <form onSubmit={submit}>
          <Tabs defaultValue="details">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="insurance">Insurance</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <Card>
                <CardHeader><CardTitle className="text-base">Vehicle details</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div><Label>Vehicle ID</Label><Input value={vehicle.vehicle_id ?? ""} onChange={(e) => set("vehicle_id", e.target.value)} /></div>
                  <div><Label>License plate</Label><Input value={vehicle.license_plate ?? ""} onChange={(e) => set("license_plate", e.target.value)} /></div>
                  <div className="sm:col-span-2"><Label>VIN</Label><Input value={vehicle.vin ?? ""} onChange={(e) => set("vin", e.target.value)} /></div>
                  <div><Label>Make</Label><Input value={vehicle.make ?? ""} onChange={(e) => set("make", e.target.value)} /></div>
                  <div><Label>Model</Label><Input value={vehicle.model ?? ""} onChange={(e) => set("model", e.target.value)} /></div>
                  <div><Label>Year</Label><Input type="number" value={vehicle.year ?? ""} onChange={(e) => set("year", e.target.value ? parseInt(e.target.value) : null)} /></div>
                  <div><Label>Color</Label><Input value={vehicle.color ?? ""} onChange={(e) => set("color", e.target.value)} /></div>
                  <div>
                    <Label>Fuel type</Label>
                    <Select value={vehicle.fuel_type ?? "Petrol"} onValueChange={(v) => set("fuel_type", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["Petrol", "Diesel", "Electric", "Hybrid"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Transmission</Label>
                    <Select value={vehicle.transmission ?? "Automatic"} onValueChange={(v) => set("transmission", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["Automatic", "Manual"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Mileage</Label><Input type="number" value={vehicle.mileage ?? 0} onChange={(e) => set("mileage", parseInt(e.target.value || "0"))} /></div>
                  <div><Label>Purchase date</Label><Input type="date" value={vehicle.purchase_date ?? ""} onChange={(e) => set("purchase_date", e.target.value || null)} /></div>
                  <div><Label>Purchase price</Label><Input type="number" value={vehicle.purchase_price ?? ""} onChange={(e) => set("purchase_price", e.target.value ? parseFloat(e.target.value) : null)} /></div>
                  <div><Label>Status</Label>
                    <Select value={vehicle.status ?? "Available"} onValueChange={(v) => set("status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["Available", "Assigned", "Maintenance", "Retired"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2"><Label>Notes</Label><Input value={vehicle.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="insurance">
              <Card>
                <CardHeader><CardTitle className="text-base">Insurance information</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div><Label>Insurance provider</Label><Input value={vehicle.insurance_provider ?? ""} onChange={(e) => set("insurance_provider", e.target.value || null)} /></div>
                  <div><Label>Insurance number</Label><Input value={vehicle.insurance_policy_number ?? ""} onChange={(e) => set("insurance_policy_number", e.target.value || null)} /></div>
                  <div><Label>Insurance expiry</Label><Input type="date" value={vehicle.insurance_expiry ?? ""} onChange={(e) => set("insurance_expiry", e.target.value || null)} /></div>
                  <div><Label>Registration expiry</Label><Input type="date" value={vehicle.registration_expiry ?? ""} onChange={(e) => set("registration_expiry", e.target.value || null)} /></div>
                  <div><Label>Service due</Label><Input type="date" value={vehicle.service_due_date ?? ""} onChange={(e) => set("service_due_date", e.target.value || null)} /></div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          <div className="mt-6 flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push(`/vehicles/${id}`)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default withAuth(EditVehiclePage, ["admin"]);