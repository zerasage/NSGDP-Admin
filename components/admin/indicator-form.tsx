"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Indicator, CreateIndicatorPayload } from "@/lib/api/indicators";

interface IndicatorFormProps {
  initial?: Indicator;
  onSave: (payload: CreateIndicatorPayload) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function IndicatorForm({ initial, onSave, onCancel, isSaving }: IndicatorFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  const handleSave = () => {
    if (name.trim().length < 3) return;
    onSave({
      name: name.trim(),
      category: category.trim() || undefined,
      unit: unit.trim() || undefined,
      description: description.trim() || undefined,
    });
  };

  return (
    <Card className="border-2 border-primary/30 shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{initial ? "Edit Indicator" : "Create Indicator"}</CardTitle>
          <Button variant="ghost" size="icon" className="size-11" onClick={onCancel} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <label htmlFor="indicator-name" className="mb-1.5 block text-sm font-medium">
            Indicator Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="indicator-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="E.g. antenatal care first visit"
            className="h-11"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="indicator-category" className="mb-1.5 block text-sm font-medium">
              Category <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input
              id="indicator-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="E.g. maternal"
              className="h-11"
            />
          </div>
          <div>
            <label htmlFor="indicator-unit" className="mb-1.5 block text-sm font-medium">
              Unit <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input
              id="indicator-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="E.g. count, percent"
              className="h-11"
            />
          </div>
        </div>

        <div>
          <label htmlFor="indicator-description" className="mb-1.5 block text-sm font-medium">
            Description <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Textarea
            id="indicator-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this indicator measures"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button className="min-h-11" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button className="min-h-11" onClick={handleSave} disabled={name.trim().length < 3 || isSaving}>
            {initial ? "Save Changes" : "Create Indicator"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
