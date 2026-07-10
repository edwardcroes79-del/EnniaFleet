import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { vehicleService, vehiclePhotoService, type Vehicle } from "@/services/fleetService";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2, Upload, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

function statusVariant(status: string) {
  switch (status) {
    case "Available": return "success";
    case "Assigned": return "default";
    case "Maintenance": return "warning";
    case "Retired": return "secondary";
    default: return "outline";
  }
}

function VehicleDetailPage() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { toast } = useToast();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    if (!id) return;
    vehicleService.get(id).then(({ data }) => setVehicle(data));
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || !vehicle) return;
    setUploading(true);
    const { publicUrl, error } = await vehiclePhotoService.upload(file, id);
    if (error || !publicUrl) {
      toast({ title: "Upload failed", description: error?.message || "Unknown error", variant: "destructive" });
    } else {
      const { error: updateErr } = await vehicleService.update(id, { photo_url: publicUrl });
      if (updateErr) {
        toast({ title: "Could not save photo URL", description: updateErr.message, variant: "destructive" });
      } else {
        toast({ title: "Photo uploaded" });
        load();
      }
    }
    setUploading(false);
  };

  const remove = async () => {
    if (!confirm("Soft-delete this vehicle?")) return;
    const { error } = await vehicleService.softDelete(id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else router.push("/vehicles");
  };

  if (!vehicle) return <AppShell><div className="py-12 text-center">Loading…</div></AppShell>;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/vehicles" className="text-sm text-muted-foreground hover:underline flex items-center gap-1 mb-2">
              <ArrowLeft className="h-4 w-4" /> Back to vehicles
            </Link>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {vehicle.make} {vehicle.model}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link href={`/vehicles/${id}/edit`}>Edit</Link></Button>
            <Button variant="destructive" onClick={remove}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardContent className="pt-6 space-y-4">
              <div className="flex h-48 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground">
                {vehicle.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={vehicle.photo_url} alt={vehicle.vehicle_id} className="h-full w-full object-cover" />
                ) : (
                  <span>No photo</span>
                )}
              </div>
              <div className="flex items-center justify-center">
                <Button asChild variant="outline" disabled={uploading}>
                  <label className="cursor-pointer">
                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {uploading ? "Uploading…" : "Upload photo"}
                    <input type="file" accept="image/*" className="sr-only" onChange={handleFile} disabled={uploading} />
                  </label>
                </Button>
              </div>
              <div className="text-center">
                <Badge variant={statusVariant(vehicle.status)} className="text-sm">{vehicle.status}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div><p className="text-xs text-muted-foreground uppercase">Vehicle ID</p><p className="font-mono">{vehicle.vehicle_id}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase">License plate</p><p className="font-mono">{vehicle.license_plate}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase">VIN</p><p className="font-mono">{vehicle.vin || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase">Year / Color</p><p>{vehicle.year ?? "—"} / {vehicle.color || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase">Fuel / Transmission</p><p>{vehicle.fuel_type} / {vehicle.transmission}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase">Mileage</p><p className="font-mono">{vehicle.mileage?.toLocaleString() ?? "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase">Purchase date</p><p>{vehicle.purchase_date || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase">Purchase price</p><p className="font-mono">{formatCurrency(vehicle.purchase_price)}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase">Insurance provider</p><p>{vehicle.insurance_provider || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase">Insurance number</p>
                {vehicle.insurance_policy_number ? (
                  <Link href={`/documents?vehicle_id=${vehicle.id}&type=Insurance certificate`} className="font-mono text-primary hover:underline">
                    {vehicle.insurance_policy_number}
                  </Link>
                ) : (
                  <p className="font-mono">—</p>
                )}
              </div>
              <div><p className="text-xs text-muted-foreground uppercase">Insurance expiry</p><p>{vehicle.insurance_expiry || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase">Registration expiry</p><p>{vehicle.registration_expiry || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase">Service due</p><p>{vehicle.service_due_date || "—"}</p></div>
              <div className="sm:col-span-2"><p className="text-xs text-muted-foreground uppercase">Notes</p><p className="whitespace-pre-wrap">{vehicle.notes || "—"}</p></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

export default withAuth(VehicleDetailPage, ["admin", "director"]);