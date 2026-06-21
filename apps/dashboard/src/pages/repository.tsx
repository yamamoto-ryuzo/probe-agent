import { useState } from "react";
import {
  useRepositoryConfig, useUpdateRepositoryConfig,
  useSnapshots, useCreateSnapshot, useSymbols, useIndexSymbols,
} from "@/api/hooks";
import { useAuth } from "@/api/auth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { formatTimestamp } from "@/lib/utils";
import { GitCommit, FolderTree, Code2, RefreshCw } from "lucide-react";
import type { RepositoryConfigOut } from "@/api/types";

function patternsToText(patterns: string[] | undefined): string {
  return (patterns ?? []).join("\n");
}

function textToPatterns(text: string): string[] {
  return text.split("\n").map(l => l.trim()).filter(Boolean);
}

export default function RepositoryPage() {
  const { systemId } = useAuth();
  const { data: config, isLoading: configLoading } = useRepositoryConfig();
  const updateConfig = useUpdateRepositoryConfig();
  const { data: snapshots, isLoading: snapsLoading } = useSnapshots();
  const createSnapshot = useCreateSnapshot();
  const { data: symbolIndex, isLoading: symLoading } = useSymbols();
  const indexSymbols = useIndexSymbols();

  const configKey = systemId != null ? `${systemId}-${config?.repo_path ?? ""}` : "empty";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Repository</h1>

      <Tabs defaultValue="config">
        <TabsList>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
          <TabsTrigger value="symbols">Symbols</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Repository Configuration</CardTitle>
              <CardDescription>Configure the target repository for analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {configLoading ? (
                <div className="space-y-3">{[1,2,3].map(i=><Skeleton key={i} className="h-10 w-full"/>)}</div>
              ) : (
                <RepoConfigForm
                  key={configKey}
                  config={config ?? null}
                  onSave={async (data) => {
                    await updateConfig.mutateAsync(data);
                    toast.success("Repository config saved");
                  }}
                  isPending={updateConfig.isPending}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="snapshots">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Snapshots</CardTitle>
                <CardDescription>Point-in-time snapshots of the repository</CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => createSnapshot.mutateAsync().then(() => toast.success("Snapshot created")).catch(e => toast.error(String(e)))}
                disabled={createSnapshot.isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${createSnapshot.isPending ? "animate-spin" : ""}`} />
                Create Snapshot
              </Button>
            </CardHeader>
            <CardContent>
              {snapsLoading ? (
                <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-16 w-full"/>)}</div>
              ) : !snapshots?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">No snapshots yet</p>
              ) : (
                <div className="space-y-3">
                  {snapshots.map(s => (
                    <div key={s.id} className="flex items-start justify-between rounded-lg border p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <GitCommit className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-xs">{s.commit_sha?.slice(0, 8)}</span>
                          <Badge variant={s.status === "ready" ? "success" : s.status === "failed" ? "destructive" : "secondary"}>
                            {s.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span><FolderTree className="inline h-3 w-3 mr-1" />{s.file_count} files</span>
                          <span>{formatTimestamp(s.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="symbols">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Code Symbols</CardTitle>
                <CardDescription>Indexed functions, classes, and modules</CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => indexSymbols.mutateAsync().then(() => toast.success("Symbols indexed")).catch(e => toast.error(String(e)))}
                disabled={indexSymbols.isPending}
              >
                <Code2 className={`h-4 w-4 mr-1 ${indexSymbols.isPending ? "animate-spin" : ""}`} />
                Index Symbols
              </Button>
            </CardHeader>
            <CardContent>
              {symLoading ? (
                <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-10 w-full"/>)}</div>
              ) : !symbolIndex?.symbols?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">No symbols indexed yet</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">{symbolIndex.symbol_count} symbols indexed</p>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-card">
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium text-muted-foreground">Symbol</th>
                          <th className="pb-2 font-medium text-muted-foreground">Kind</th>
                          <th className="pb-2 font-medium text-muted-foreground">Path</th>
                          <th className="pb-2 font-medium text-muted-foreground text-right">Lines</th>
                        </tr>
                      </thead>
                      <tbody>
                        {symbolIndex.symbols.map(s => (
                          <tr key={s.id} className="border-b last:border-0">
                            <td className="py-2 font-mono text-xs">{s.qualified_name}</td>
                            <td className="py-2"><Badge variant="outline">{s.kind}</Badge></td>
                            <td className="py-2 text-xs text-muted-foreground">{s.path}</td>
                            <td className="py-2 text-right text-xs">{s.start_line}–{s.end_line}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RepoConfigForm({ config, onSave, isPending }: {
  config: RepositoryConfigOut | null;
  onSave: (data: { repo_path: string; include_patterns: string[]; exclude_patterns: string[] }) => Promise<void>;
  isPending: boolean;
}) {
  const [repoPath, setRepoPath] = useState(config?.repo_path ?? "");
  const [includePatterns, setIncludePatterns] = useState(patternsToText(config?.include_patterns));
  const [excludePatterns, setExcludePatterns] = useState(patternsToText(config?.exclude_patterns));

  const handleSave = async () => {
    try {
      await onSave({
        repo_path: repoPath,
        include_patterns: textToPatterns(includePatterns),
        exclude_patterns: textToPatterns(excludePatterns),
      });
    } catch (err) { toast.error(String(err)); }
  };

  return (
    <>
      <div className="space-y-2">
        <Label>Repository Path</Label>
        <Input value={repoPath} onChange={e => setRepoPath(e.target.value)} placeholder="/path/to/repo" />
      </div>
      <div className="space-y-2">
        <Label>Include Patterns <span className="text-muted-foreground font-normal">(one per line)</span></Label>
        <Textarea value={includePatterns} onChange={e => setIncludePatterns(e.target.value)} placeholder={"*.py\n*.js"} rows={3} />
      </div>
      <div className="space-y-2">
        <Label>Exclude Patterns <span className="text-muted-foreground font-normal">(one per line)</span></Label>
        <Textarea value={excludePatterns} onChange={e => setExcludePatterns(e.target.value)} placeholder={"test_*\n__pycache__"} rows={3} />
      </div>
      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? "Saving..." : "Save Configuration"}
      </Button>
    </>
  );
}
