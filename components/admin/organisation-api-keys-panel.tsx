"use client";

import { useState } from "react";
import { Copy, KeyRound, Loader2, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatDate } from "@/lib/utils/date";
import {
  useOrganisationApiKeys,
  useCreateOrganisationApiKey,
  useRevokeOrganisationApiKey,
} from "@/lib/hooks/useOrganisationApiKeys";
import type { GeneratedOrganisationApiKey } from "@/lib/api/organisation-api-keys";

interface OrganisationApiKeysPanelProps {
  organisationId: string;
  canManage: boolean;
}

export function OrganisationApiKeysPanel({
  organisationId,
  canManage,
}: OrganisationApiKeysPanelProps) {
  const { data: keys, isLoading } = useOrganisationApiKeys(organisationId);
  const createMutation = useCreateOrganisationApiKey(organisationId);
  const revokeMutation = useRevokeOrganisationApiKey(organisationId);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [revealedKey, setRevealedKey] = useState<GeneratedOrganisationApiKey | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; name: string } | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const result = await createMutation.mutateAsync(name.trim());
      setCreateOpen(false);
      setName("");
      setRevealedKey(result);
    } catch {
      toast.error("Failed to generate API key");
    }
  };

  const handleCopy = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      toast.success("Key copied to clipboard");
    } catch {
      toast.error("Could not copy — select and copy manually");
    }
  };

  if (!canManage) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="No access"
        description="You don't have permission to manage this organisation's API keys."
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Partner API Keys</h2>
          <p className="text-sm text-muted-foreground">
            Programmatic access for this organisation&apos;s own systems — scoped to the same
            datasets they could already reach (their own data, the public catalogue, and any
            restricted dataset they hold an approved access request for).
          </p>
        </div>
        <Button className="h-11 sm:h-9" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Generate key
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3 p-4">
          {[1, 2].map((n) => (
            <Skeleton key={n} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : !keys || keys.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="No API keys yet"
          description="Generate a key to let this organisation pull data programmatically."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Prefix</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last used</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="font-medium">{key.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  nsgdp_pk_{key.keyPrefix}…
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(key.createdAt)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {key.lastUsedAt ? formatDate(key.lastUsedAt) : "Never"}
                </TableCell>
                <TableCell>
                  <Badge variant={key.revokedAt ? "secondary" : "default"}>
                    {key.revokedAt ? "Revoked" : "Active"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {!key.revokedAt && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setRevokeTarget({ id: key.id, name: key.name })}
                    >
                      <Trash2 className="size-4" />
                      Revoke
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Generate key dialog */}
      <Dialog open={createOpen} onOpenChange={(next) => !next && setCreateOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate a partner API key</DialogTitle>
            <DialogDescription>
              The raw key will be shown once. It cannot be retrieved again after this dialog
              closes — only a revoke-and-reissue is possible if it&apos;s lost.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="api-key-name">Name</Label>
            <Input
              id="api-key-name"
              placeholder='e.g. "WHO Nigeria sync job"'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim() || createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reveal-once dialog */}
      <Dialog open={!!revealedKey} onOpenChange={(next) => !next && setRevealedKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API key generated</DialogTitle>
            <DialogDescription>
              Copy this key now — it will not be shown again.
            </DialogDescription>
          </DialogHeader>
          {revealedKey && (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3">
              <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm">
                {revealedKey.key}
              </code>
              <Button variant="outline" size="sm" onClick={() => handleCopy(revealedKey.key)}>
                <Copy className="size-4" />
                Copy
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setRevealedKey(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        title="Revoke API key?"
        description={`Revoke "${revokeTarget?.name}"? Any system using it will immediately lose access.`}
        confirmLabel="Revoke"
        variant="destructive"
        loading={revokeMutation.isPending}
        onConfirm={() =>
          revokeTarget &&
          revokeMutation.mutate(revokeTarget.id, {
            onSuccess: () => {
              toast.success("API key revoked");
              setRevokeTarget(null);
            },
            onError: () => toast.error("Failed to revoke API key"),
          })
        }
      />
    </section>
  );
}
