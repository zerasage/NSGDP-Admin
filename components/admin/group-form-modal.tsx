"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { FolderKanban, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormError } from "@/components/forms/form-error";
import { useCreateGroup, useUpdateGroup } from "@/lib/hooks/useGroups";
import type { AdminGroup } from "@/lib/api/groups";
import { toast } from "sonner";

interface GroupFormData {
  name: string;
  description: string;
  isFeatured: boolean;
}

interface GroupFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Present = editing; absent = creating */
  group?: AdminGroup;
}

export function GroupFormModal({ open, onClose, group }: GroupFormModalProps) {
  const isEditing = !!group;
  const [submitting, setSubmitting] = useState(false);
  const createMutation = useCreateGroup();
  const updateMutation = useUpdateGroup();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<GroupFormData>({
    defaultValues: { name: "", description: "", isFeatured: false },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: group?.name ?? "",
        description: group?.description ?? "",
        isFeatured: group?.is_featured ?? false,
      });
    }
  }, [open, group, reset]);

  const onSubmit = async (data: GroupFormData) => {
    setSubmitting(true);
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          slug: group.slug,
          data: {
            name: data.name,
            description: data.description,
            isFeatured: data.isFeatured,
          },
        });
        toast.success("Group updated");
      } else {
        const created = await createMutation.mutateAsync({
          name: data.name,
          description: data.description,
          isFeatured: data.isFeatured,
        });
        toast.success(`Group "${created.name}" created`);
      }
      onClose();
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err?.message || `Failed to ${isEditing ? "update" : "create"} group`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderKanban className="size-5" />
            {isEditing ? "Edit Group" : "Create Group"}
          </DialogTitle>
          <DialogDescription>
            A curated collection of datasets and documents around a topic, e.g. &quot;Malaria
            Control 2024–2026&quot;.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              className="mt-1.5"
              placeholder="e.g. Malaria Control 2024–2026"
              {...register("name", { required: "Name is required", minLength: 3 })}
            />
            <FormError message={errors.name?.message} />
          </div>

          <div>
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              className="mt-1.5"
              rows={3}
              placeholder="What this group curates and why..."
              {...register("description", {
                required: "Description is required",
                minLength: 10,
              })}
            />
            <FormError message={errors.description?.message} />
          </div>

          <Controller
            name="isFeatured"
            control={control}
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(!!checked)}
                />
                Feature on the public homepage
              </label>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Group"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
