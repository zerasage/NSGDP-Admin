"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormError } from "@/components/forms/form-error";
import { useUpdateOrganisation } from "@/lib/hooks/useOrganisations";
import { organisationFormSchema, type OrganisationFormData } from "@/lib/schemas/organisation";
import { ORG_TYPES } from "@/lib/constants/organisation-types";
import type { Organisation } from "@/lib/api/organisations";
import { toast } from "sonner";

interface EditOrganisationModalProps {
  open: boolean;
  onClose: () => void;
  org: Organisation;
  slug: string;
}

export function EditOrganisationModal({ open, onClose, org, slug }: EditOrganisationModalProps) {
  const updateMutation = useUpdateOrganisation(slug);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<OrganisationFormData>({
    resolver: zodResolver(organisationFormSchema),
    defaultValues: {
      name: org.name,
      acronym: org.acronym ?? "",
      type: org.type,
      description: org.description ?? "",
      website: org.website ?? "",
      email: org.email ?? "",
      phone: org.phone ?? "",
      address: org.address ?? "",
      logoUrl: org.logo_url ?? "",
    },
  });

  // Re-sync the form whenever a different organisation's modal is opened
  useEffect(() => {
    reset({
      name: org.name,
      acronym: org.acronym ?? "",
      type: org.type,
      description: org.description ?? "",
      website: org.website ?? "",
      email: org.email ?? "",
      phone: org.phone ?? "",
      address: org.address ?? "",
      logoUrl: org.logo_url ?? "",
    });
  }, [org, reset]);

  const onSubmit = async (data: OrganisationFormData) => {
    try {
      await updateMutation.mutateAsync({
        id: org.id,
        data: {
          name: data.name,
          acronym: data.acronym || undefined,
          type: data.type,
          description: data.description || undefined,
          website: data.website || undefined,
          email: data.email || undefined,
          phone: data.phone || undefined,
          address: data.address || undefined,
          logoUrl: data.logoUrl || undefined,
        },
      });

      toast.success(`Organisation "${data.name}" updated successfully`);
      onClose();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to update organisation";
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    if (!updateMutation.isPending) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Edit Organisation
          </DialogTitle>
          <DialogDescription>
            Update this organisation&apos;s details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium mb-1.5">
              Organisation Name <span className="text-destructive">*</span>
            </label>
            <Input id="edit-name" {...register("name")} />
            <FormError message={errors.name?.message} />
          </div>

          <div>
            <label htmlFor="edit-acronym" className="block text-sm font-medium mb-1.5">
              Acronym <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input id="edit-acronym" placeholder="E.g. NSPHCDA" {...register("acronym")} />
            <FormError message={errors.acronym?.message} />
          </div>

          <div>
            <label htmlFor="edit-type" className="block text-sm font-medium mb-1.5">
              Organisation Type <span className="text-destructive">*</span>
            </label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organisation type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORG_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FormError message={errors.type?.message} />
          </div>

          <div>
            <label htmlFor="edit-description" className="block text-sm font-medium mb-1.5">
              Description
            </label>
            <Textarea
              id="edit-description"
              rows={3}
              maxLength={500}
              {...register("description")}
            />
            <FormError message={errors.description?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-email" className="block text-sm font-medium mb-1.5">
                Email
              </label>
              <Input id="edit-email" type="email" {...register("email")} />
              <FormError message={errors.email?.message} />
            </div>

            <div>
              <label htmlFor="edit-phone" className="block text-sm font-medium mb-1.5">
                Phone
              </label>
              <Input id="edit-phone" type="tel" {...register("phone")} />
              <FormError message={errors.phone?.message} />
            </div>
          </div>

          <div>
            <label htmlFor="edit-website" className="block text-sm font-medium mb-1.5">
              Website
            </label>
            <Input id="edit-website" type="url" {...register("website")} />
            <FormError message={errors.website?.message} />
          </div>

          <div>
            <label htmlFor="edit-address" className="block text-sm font-medium mb-1.5">
              Physical Address
            </label>
            <Input id="edit-address" {...register("address")} />
            <FormError message={errors.address?.message} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
