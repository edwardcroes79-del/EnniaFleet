import { useState } from "react";
import { useRouter } from "next/router";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vehicleService, vehiclePhotoService } from "@/services/fleetService";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const initial = {
  vehicle_id: "",
  license_plate: "",
  vin: "",
  make: "",
  model: "",
  year: undefined as number | undefined,
  color: "",
  fuel_type: "Petrol",
  transmission: "Automatic",
  mileage: 0,
  purchase_date: "",
  purchase_price: undefined as number | undefined,
  status: "Available",
  insurance_expiry: "",
  registration_expiry: "",
  service_due_date: "",
  notes: "",
};

function NewVehiclePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState(initial);
  const [photo, setPhoto] = useState<File | null>(null);

  const set = (key: keyof typeof values, value: unknown) => setValues((s) => ({ ...s, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) {
      toast({ title: "Not signed in", description: "Please log in again.", variant: "destructive" });
      return;
    }

    if (!values.vehicle_id.trim() || !values.license_plate.trim() || !values.make.trim() || !values.model.trim()) {
      toast({ title: "Missing fields", description: "Vehicle ID, license plate, make, and model are required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        vehicle_id: values.vehicle_id.trim(),
        license_plate: values.license_plate.trim(),
        vin: values.vin.trim() || null,
        make: values.make.trim(),
        model: values.model.trim(),
        year: values.year ?? null,
        color: values.color.trim() || null,
        fuel_type: values.fuel_type,
        transmission: values.transmission,
        mileage: values.mileage ?? 0,
        purchase_date: values.purchase_date || null,
        purchase_price: values.purchase_price ?? null,
        status: values.status,
        insurance_expiry: values.insurance_expiry || null,
        registration_expiry: values.registration_expiry || null,
        service_due_date: values.service_due_date || null,
        notes: values.notes.trim() || null,
        is_deleted: false,
      };
      const { data, error } = await vehicleService.create(payload as any);
      if (error || !data) {
        console.error("Create vehicle error:", error);
        toast({ title: "Could not create vehicle", description: error?.message || "Unknown error", variant: "destructive" });
        setSaving(false);
        return;
      }

      if (photo) {
        const { publicUrl, error: uploadErr } = await vehiclePhotoService.upload(photo, data.id);
        if (uploadErr || !publicUrl) {
          toast({ title: "Vehicle created, but photo upload failed", description: uploadErr?.message || "Unknown error", variant: "destructive" });
        } else {
          const { error: updateErr } = await vehicleService.update(data.id, { photo_url: publicUrl });
          if (updateErr) {
            toast({ title: "Vehicle created, but photo URL not saved", description: updateErr.message, variant: "destructive" });
          } else {
            toast({ title: "Vehicle and photo created" });
          }
        }
      } else {
        toast({ title: "Vehicle created" });
      }
      router.push("/vehicles");
    } catch (err) {
      console.error("Create vehicle exception:", err);
      toast({
        title: "Unexpected error",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-6">Add vehicle</h1>
        <form onSubmit={submit}>
          <Card>
            <CardHeader><CardTitle className="text-base">Vehicle details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="vehicle_id">Vehicle ID *</Label><Input id="vehicle_id" required value={values.vehicle_id} onChange={(e) => set("vehicle_id", e.target.value)} /></div>
              <div><Label htmlFor="plate">License plate *</Label><Input id="plate" required value={values.license_plate} onChange={(e) => set("license_plate", e.target.value)} /></div>
              <div className="sm:col-span-2"><Label htmlFor="vin">VIN</Label><Input id="vin" value={values.vin} onChange={(e) => set("vin", e.target.value)} /></div>
              <div><Label htmlFor="make">Make *</Label><Input id="make" required value={values.make} onChange={(e) => set("make", e.target.value)} /></div>
              <div><Label htmlFor="model">Model *</Label><Input id="model" required value={values.model} onChange={(e) => set("model", e.target.value)} /></div>
              <div><Label htmlFor="year">Year</Label><Input id="year" type="number" value={values.year ?? ""} onChange={(e) => set("year", e.target.value ? parseInt(e.target.value) : undefined)} /></div>
              <div><Label htmlFor="color">Color</Label><Input id="color" value={values.color} onChange={(e) => set("color", e.target.value)} /></div>
              <div>
                <Label>Fuel type</Label>
                <Select value={values.fuel_type} onValueChange={(v) => set("fuel_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Petrol", "Diesel", "Electric", "Hybrid"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Transmission</Label>
                <Select value={values.transmission} onValueChange={(v) => set("transmission", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Automatic", "Manual"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label htmlFor="mileage">Mileage</Label><Input id="mileage" type="number" value={values.mileage} onChange={(e) => set("mileage", parseInt(e.target.value || "0"))} /></div>
              <div><Label htmlFor="purchase_date">Purchase date</Label><Input id="purchase_date" type="date" value={values.purchase_date} onChange={(e) => set("purchase_date", e.target.value)} /></div>
              <div><Label htmlFor="purchase_price">Purchase price</Label><Input id="purchase_price" type="number" value={values.purchase_price ?? ""} onChange={(e) => set("purchase_price", e.target.value ? parseFloat(e.target.value) : undefined)} /></div>
              <div>
                <Label>Status</Label>
                <Select value={values.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Available", "Assigned", "Maintenance", "Retired"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label htmlFor="insurance_expiry">Insurance expiry</Label><Input id="insurance_expiry" type="date" value={values.insurance_expiry} onChange={(e) => set("insurance_expiry", e.target.value)} /></div>
              <div><Label htmlFor="registration_expiry">Registration expiry</Label><Input id="registration_expiry" type="date" value={values.registration_expiry} onChange={(e) => set("registration_expiry", e.target.value)} /></div>
              <div><Label htmlFor="service_due">Service due</Label><Input id="service_due" type="date" value={values.service_due_date} onChange={(e) => set("service_due_date", e.target.value)} /></div>
              <div className="sm:col-span-2"><Label htmlFor="notes">Notes</Label><Input id="notes" value={values.notes} onChange={(e) => set("notes", e.target.value)} /></div>
              <div className="sm:col-span-2">
                <Label>Vehicle photo</Label>
                <div className="mt-2 flex items-center gap-4">
                  <Button asChild variant="outline" type="button">
                    <label className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" /> Choose photo
                      <input type="file" accept="image/*" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
                    </label>
                  </Button>
                  <span className="text-sm text-muted-foreground">{photo ? photo.name : "No file chosen"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="mt-6 flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push("/vehicles")}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save vehicle</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default withAuth(NewVehiclePage, ["admin"]);