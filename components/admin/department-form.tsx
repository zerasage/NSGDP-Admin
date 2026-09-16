"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Department } from "@/lib/api/departments";

interface DepartmentFormProps {
  initial?: Department;
  onSave: (payload: { name: string; description?: string }) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function DepartmentForm({ initial, onSave, onCancel, isSaving }: DepartmentFormProps) {
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
          <CardTitle>{initial ? "Edit Department" : "Create Department"}</CardTitle>
          <Button variant="ghost" size="icon" className="size-11" onClick={onCancel} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <label htmlFor="department-name" className="mb-1.5 block text-sm font-medium">
            Department Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="department-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="E.g. Disease Surveillance" className="h-11"
          />
        </div>

        <div>
          <label htmlFor="department-desc" className="mb-1.5 block text-sm font-medium">
            Description <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Textarea
            id="department-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this department's remit"
          />
        </div>

        <p className="text-sm text-muted-foreground">
          {initial ? "Members are managed in the department detail." : "After creation, add staff members from the department detail."}
        </p>

        <div className="flex justify-end gap-2">
          <Button className="min-h-11" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button className="min-h-11" onClick={handleSave} disabled={!name.trim() || isSaving}>
            {initial ? "Save Changes" : "Create Department"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
