"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { PermissionGroup, PermissionActionKey } from "@/lib/api/permissions";
import { PERMISSION_ACTION_LABELS, PERMISSION_ACTION_DESCRIPTIONS } from "@/types/permissions";

const ALL_ACTIONS = Object.keys(PERMISSION_ACTION_LABELS) as PermissionActionKey[];

interface PermissionGroupFormProps {
  initial?: PermissionGroup;
  onSave: (payload: { name: string; description?: string; initialActions?: PermissionActionKey[] }) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function PermissionGroupForm({ initial, onSave, onCancel, isSaving }: PermissionGroupFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [selectedActions, setSelectedActions] = useState<Set<PermissionActionKey>>(new Set());

  const toggleAction = (action: PermissionActionKey) => {
    setSelectedActions((prev) => {
      const next = new Set(prev);
      if (next.has(action)) next.delete(action);
      else next.add(action);
      return next;
    });
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      ...(initial ? {} : { initialActions: Array.from(selectedActions) }),
    });
  };

  return (
    <Card className="ring-1 ring-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{initial ? "Edit Group" : "Create Group"}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <label htmlFor="group-name" className="mb-1.5 block text-sm font-medium">
            Group Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="E.g. DPRS Team"
          />
        </div>

        <div>
          <label htmlFor="group-desc" className="mb-1.5 block text-sm font-medium">
            Description <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Textarea
            id="group-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of who this group is for"
          />
        </div>

        {initial ? (
          <p className="text-xs text-muted-foreground">
            Members and delegated permissions are managed on the group card below.
          </p>
        ) : (
          <div>
            <p className="mb-1.5 block text-sm font-medium">
              Delegated Permissions <span className="text-muted-foreground font-normal">(optional)</span>
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Grant atomic permissions now, or skip this and delegate later from this group&apos;s card.
            </p>
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              {ALL_ACTIONS.map((action) => (
                <label key={action} className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={selectedActions.has(action)}
                    onCheckedChange={() => toggleAction(action)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium">{PERMISSION_ACTION_LABELS[action]}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {PERMISSION_ACTION_DESCRIPTIONS[action]}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
            {initial ? "Save Changes" : "Create Group"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
