import { useState } from "react";
import { useExperiments, useRunExperiment, useExperimentDecision } from "@/api/hooks";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import { formatTimestamp } from "@/lib/utils";
import { Play, Download } from "lucide-react";

const STATUS_VARIANT: Record<string, "default" | "success" | "destructive" | "secondary" | "warning"> = {
  draft: "secondary",
  running: "warning",
  completed: "success",
  failed: "destructive",
};

const DECISION_OPTS = ["undecided", "adopted", "rejected", "needs_more_data"];

export default function ExperimentsPage() {
  const { data: experiments, isLoading } = useExperiments();
  const runExperiment = useRunExperiment();
  const makeDecision = useExperimentDecision();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Experiments</h1>

      {isLoading ? (
        <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-40 w-full" />)}</div>
      ) : !experiments?.length ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No experiments yet</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {experiments.map(exp => {
            const expanded = expandedId === exp.id;
            return (
              <Card key={exp.id}>
                <CardHeader className="cursor-pointer" onClick={() => setExpandedId(expanded ? null : exp.id)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm flex items-center gap-2">
                        Experiment #{exp.id}
                        <Badge variant={STATUS_VARIANT[exp.status] ?? "secondary"}>{exp.status}</Badge>
                        {exp.human_decision && exp.human_decision !== "undecided" && (
                          <Badge variant="outline">{exp.human_decision}</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {exp.feature_id} — {exp.objective}
                      </CardDescription>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatTimestamp(exp.created_at)}</span>
                  </div>
                </CardHeader>
                {expanded && (
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      {exp.status === "draft" && (
                        <Button
                          size="sm"
                          onClick={() => runExperiment.mutateAsync(exp.id).then(() => toast.success("Experiment started")).catch(e => toast.error(String(e)))}
                          disabled={runExperiment.isPending}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Run Experiment
                        </Button>
                      )}
                      {exp.status === "completed" && (
                        <div className="flex items-center gap-2">
                          <Select
                            className="w-40"
                            value={exp.human_decision ?? "undecided"}
                            onChange={(e) => {
                              makeDecision.mutateAsync({ id: exp.id, decision: e.target.value })
                                .then(() => toast.success("Decision saved"))
                                .catch(err => toast.error(String(err)));
                            }}
                          >
                            {DECISION_OPTS.map(d => <option key={d} value={d}>{d}</option>)}
                          </Select>
                        </div>
                      )}
                    </div>

                    {exp.variants?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Variants</h4>
                        <div className="space-y-3">
                          {exp.variants.map(v => (
                            <div key={v.id} className="rounded-lg border p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{v.label}</span>
                                  {v.is_baseline && <Badge variant="outline">baseline</Badge>}
                                  <Badge variant={v.status === "completed" ? "success" : v.status === "failed" ? "destructive" : "secondary"}>
                                    {v.status}
                                  </Badge>
                                </div>
                                {v.patch_text && (
                                  <Button
                                    size="sm" variant="ghost"
                                    onClick={() => {
                                      const blob = new Blob([v.patch_text!], { type: "text/plain" });
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement("a"); a.href = url; a.download = `variant-${v.variant_key}.diff`; a.click();
                                      URL.revokeObjectURL(url);
                                    }}
                                  >
                                    <Download className="h-3 w-3 mr-1" /> Patch
                                  </Button>
                                )}
                              </div>
                              {v.error && <p className="text-xs text-destructive mb-2">{v.error}</p>}
                              {v.metrics && Object.keys(v.metrics).length > 0 && (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b">
                                        <th className="pb-1 text-left font-medium text-muted-foreground">Metric</th>
                                        <th className="pb-1 text-right font-medium text-muted-foreground">Value</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {Object.entries(v.metrics).map(([k, val]) => (
                                        <tr key={k} className="border-b last:border-0">
                                          <td className="py-1">{k}</td>
                                          <td className="py-1 text-right font-mono">{String(val)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {exp.comparison && Object.keys(exp.comparison).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Comparison</h4>
                        <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto">
                          {JSON.stringify(exp.comparison, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
