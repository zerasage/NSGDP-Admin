"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { OrganisationGroup } from "@/lib/api/organisation-groups";

interface OrganisationGroupFormProps {
  initial?: OrganisationGroup;
  onSave: (payload: { name: string; description?: string }) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function OrganisationGroupForm({ initial, onSave, onCancel, isSaving }: OrganisationGroupFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <Card className="border-2 border-primary/30 shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{initial ? "Edit Group" : "Create Group"}</CardTitle>
          <Button variant="ghost" size="icon" className="size-11" onClick={onCancel} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <label htmlFor="org-group-name" className="mb-1.5 block text-sm font-medium">
            Group Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="org-group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="E.g. Programme Creators" className="h-11"
          />
        </div>

        <div>
          <label htmlFor="org-group-desc" className="mb-1.5 block text-sm font-medium">
            Description <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Textarea
            id="org-group-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of what this group enables organisations to do"
          />
        </div>

        <p className="text-sm text-muted-foreground">
          {initial ? "Members and capabilities are managed in the group detail." : "After creation, grant capabilities and add member organisations from the group detail."}
        </p>

        <div className="flex justify-end gap-2">
          <Button className="min-h-11" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button className="min-h-11" onClick={handleSave} disabled={!name.trim() || isSaving}>
            {initial ? "Save Changes" : "Create Group"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
