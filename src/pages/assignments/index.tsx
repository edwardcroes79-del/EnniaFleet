import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { assignmentService, type Assignment } from "@/services/fleetService";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function AssignmentsPage() {
  const [rows, setRows] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    assignmentService.list().then(({ data, error }) => {
      setRows(data ?? []);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
    });
  }, [toast]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold tracking-tight">Assignments</h1>
          <Link href="/assignments/new"><Button><Plus className="mr-2 h-4 w-4" /> New assignment</Button></Link>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Active & historical assignments</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Expected return</TableHead>
                  <TableHead>Actual return</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading…</TableCell></TableRow> :
                rows.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No assignments found.</TableCell></TableRow> :
                rows.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono">{a.vehicle?.vehicle_id || a.vehicle_id}</TableCell>
                    <TableCell>{a.employee?.full_name || a.employee_id}</TableCell>
                    <TableCell>{a.assigned_date}</TableCell>
                    <TableCell>{a.expected_return_date || "—"}</TableCell>
                    <TableCell>{a.actual_return_date || "—"}</TableCell>
                    <TableCell><Badge variant={a.actual_return_date ? "secondary" : "default"}>{a.actual_return_date ? "Returned" : "Active"}</Badge></TableCell>
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

export default withAuth(AssignmentsPage, ["admin", "director"]);