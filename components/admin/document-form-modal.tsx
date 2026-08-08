"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { FileText, Loader2, Upload } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormError } from "@/components/forms/form-error";
import { useCreateDocument, useUpdateDocument } from "@/lib/hooks/useDocuments";
import { uploadFile } from "@/lib/api/uploads";
import type { AdminDocument, DocumentType } from "@/lib/api/documents";
import { toast } from "sonner";

const DOCUMENT_TYPES: Array<{ value: DocumentType; label: string }> = [
  { value: "sop", label: "SOP" },
  { value: "policy", label: "Policy" },
  { value: "guideline", label: "Guideline" },
  { value: "report", label: "Report" },
  { value: "research", label: "Research" },
  { value: "training", label: "Training" },
  { value: "evaluation", label: "Evaluation" },
  { value: "other", label: "Other" },
];

interface DocumentFormData {
  title: string;
  description: string;
  type: DocumentType;
  version: string;
  author: string;
}

interface DocumentFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Present = editing; absent = creating */
  document?: AdminDocument;
}

export function DocumentFormModal({ open, onClose, document }: DocumentFormModalProps) {
  const isEditing = !!document;
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const createMutation = useCreateDocument();
  const updateMutation = useUpdateDocument();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<DocumentFormData>({
    defaultValues: {
      title: "",
      description: "",
      type: "sop",
      version: "",
      author: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: document?.title ?? "",
        description: document?.description ?? "",
        type: document?.type ?? "sop",
        version: document?.version ?? "",
        author: document?.author ?? "",
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFile(null);
    }
  }, [open, document, reset]);

  const onSubmit = async (data: DocumentFormData) => {
    setSubmitting(true);
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          slug: document.slug,
          data: {
            title: data.title,
            description: data.description,
            type: data.type,
            version: data.version || undefined,
            author: data.author || undefined,
          },
        });
        if (file) {
          await uploadFile(file, undefined, document.id);
        }
        toast.success("Document updated");
      } else {
        if (!file) {
          toast.error("Attach a file before creating the document");
          setSubmitting(false);
          return;
        }
        const created = await createMutation.mutateAsync({
          title: data.title,
          description: data.description,
          type: data.type,
          version: data.version || undefined,
          author: data.author || undefined,
        });
        await uploadFile(file, undefined, created.id);
        toast.success(`Document "${created.title}" created`);
      }
      onClose();
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err?.message || `Failed to ${isEditing ? "update" : "create"} document`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            {isEditing ? "Edit Document" : "Create Document"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this document's metadata, or replace its file."
              : "Upload a new SOP, policy, guideline, report, or other document. Starts as Draft until published."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              className="mt-1.5"
              placeholder="e.g. Malaria Case Management SOP 2026"
              {...register("title", { required: "Title is required", minLength: 5 })}
            />
            <FormError message={errors.title?.message} />
          </div>

          <div>
            <Label htmlFor="type">
              Type <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue>
                      {(v: string) => DOCUMENT_TYPES.find((t) => t.value === v)?.label ?? "Select type"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              className="mt-1.5"
              rows={3}
              placeholder="Brief description of this document's content and purpose..."
              {...register("description", { required: "Description is required", minLength: 10 })}
            />
            <FormError message={errors.description?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="version">Version</Label>
              <Input id="version" className="mt-1.5" placeholder="v1.0" {...register("version")} />
            </div>
            <div>
              <Label htmlFor="author">Author / Owning unit</Label>
              <Input id="author" className="mt-1.5" placeholder="DPRS" {...register("author")} />
            </div>
          </div>

          <div>
            <Label htmlFor="document-file">
              File {!isEditing && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="document-file"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              className="mt-1.5"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {isEditing && (
              <p className="text-xs text-muted-foreground mt-1">
                {document?.file_name
                  ? `Current file: ${document.file_name}`
                  : "No file uploaded yet."}{" "}
                Leave empty to keep it unchanged.
              </p>
            )}
          </div>

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
              ) : (
                <>
                  <Upload className="size-4 mr-1.5" />
                  {isEditing ? "Save Changes" : "Create Document"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
