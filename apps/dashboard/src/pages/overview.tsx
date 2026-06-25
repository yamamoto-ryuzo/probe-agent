import { useComponents } from "@/api/hooks";
import { useAuth } from "@/api/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Boxes, Activity, Clock } from "lucide-react";
import { formatTimestamp } from "@/lib/utils";

const MODE_VARIANT = {
  off: "secondary",
  trace: "success",
  shadow: "warning",
} as const;

export default function OverviewPage() {
  const { systems, systemId } = useAuth();
  const { data: components, isLoading } = useComponents();

  const system = systems.find((s) => s.id === systemId);
  const totalTraces = components?.reduce((s, c) => s + c.trace_count, 0) ?? 0;
  const lastSeen = components?.reduce((max, c) =>
    c.last_seen && (!max || c.last_seen > max) ? c.last_seen : max, null as number | null);
  const modeCount = components?.reduce((acc, c) => {
    acc[c.mode] = (acc[c.mode] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        {system && (
          <p className="text-muted-foreground mt-1">
            {system.name}{system.environment ? ` — ${system.environment}` : ""}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Components"
          value={isLoading ? undefined : String(components?.length ?? 0)}
          icon={<Boxes className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Total Traces"
          value={isLoading ? undefined : totalTraces.toLocaleString()}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Last Seen"
          value={isLoading ? undefined : formatTimestamp(lastSeen)}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Active Modes"
          value={isLoading ? undefined : Object.entries(modeCount).map(([m, n]) => `${m}: ${n}`).join(", ") || "—"}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Components</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !components?.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No components registered yet. Connect the SDK to start tracing.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">Component ID</th>
                    <th className="pb-2 font-medium text-muted-foreground">Mode</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Traces</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {components.map((c) => (
                    <tr key={c.component_id} className="border-b last:border-0">
                      <td className="py-3 font-mono text-xs">{c.component_id}</td>
                      <td className="py-3">
                        <Badge variant={MODE_VARIANT[c.mode] ?? "secondary"}>{c.mode}</Badge>
                      </td>
                      <td className="py-3 text-right">{c.trace_count.toLocaleString()}</td>
                      <td className="py-3 text-right text-muted-foreground text-xs">
                        {formatTimestamp(c.last_seen)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string; value?: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon}
        </div>
        {value === undefined ? (
          <Skeleton className="mt-2 h-7 w-20" />
        ) : (
          <p className="mt-2 text-2xl font-bold">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}
