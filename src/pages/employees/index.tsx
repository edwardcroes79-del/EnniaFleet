import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { employeeService, type Employee } from "@/services/fleetService";
import { Plus, Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function EmployeesPage() {
  const [rows, setRows] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    employeeService.list().then(({ data, error }) => {
      setRows(data ?? []);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
    });
  }, [toast]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold tracking-tight">Employees</h1>
          <Link href="/employees/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Add employee</Button>
          </Link>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Staff directory</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department / Position</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>License expiry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading…</TableCell></TableRow> :
                rows.length === 0 ? <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No employees found.</TableCell></TableRow> :
                rows.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono">{e.employee_id}</TableCell>
                    <TableCell className="font-medium">{e.full_name}</TableCell>
                    <TableCell>{e.department} / {e.position}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <a href={`mailto:${e.email}`} className="hover:text-primary"><Mail className="h-4 w-4" /></a>
                        <a href={`tel:${e.phone}`} className="hover:text-primary"><Phone className="h-4 w-4" /></a>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={new Date(e.license_expiry) < new Date() ? "destructive" : "outline"}>{e.license_expiry}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

export default withAuth(EmployeesPage, ["admin", "director"]);