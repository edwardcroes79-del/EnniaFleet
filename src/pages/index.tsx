import { AppShell } from "@/components/AppShell";
import { withAuth } from "@/components/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Car, Fuel, Wrench, Users, ClipboardList } from "lucide-react";
import Link from "next/link";

function DashboardPage() {
  const stats = [
    { label: "Total Vehicles", value: 0, icon: Car, href: "/vehicles" },
    { label: "Available", value: 0, icon: Car, href: "/vehicles?status=available" },
    { label: "Assigned", value: 0, icon: ClipboardList, href: "/assignments" },
    { label: "In Maintenance", value: 0, icon: Wrench, href: "/maintenance" },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Fleet Dashboard
          </h1>
          <p className="text-muted-foreground">Overview of your fleet status and recent activity.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="font-display text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-display text-lg">Upcoming Reminders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center rounded-md border border-dashed py-12 text-center">
                <div className="space-y-1">
                  <AlertTriangle className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No upcoming reminders. Add vehicles and service dates to see alerts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center rounded-md border border-dashed py-12 text-center">
                <div className="space-y-1">
                  <Fuel className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No recent activity yet.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

export default withAuth(DashboardPage);