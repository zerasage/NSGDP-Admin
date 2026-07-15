"use client";

import { useState } from "react";
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
import { useCreateOrganisation } from "@/lib/hooks/useOrganisations";
import { organisationFormSchema, type OrganisationFormData } from "@/lib/schemas/organisation";
import { toast } from "sonner";

interface CreateOrganisationModalProps {
  open: boolean;
  onClose: () => void;
}

const ORG_TYPES = [
  { value: "government", label: "Government Agency" },
  { value: "ngo", label: "Non-Governmental Organisation" },
  { value: "private", label: "Private Sector" },
  { value: "international", label: "International Organisation" },
  { value: "academic", label: "Academic Institution" },
  { value: "community", label: "Community Organisation" },
] as const;

export function CreateOrganisationModal({ open, onClose }: CreateOrganisationModalProps) {
  const [loading, setLoading] = useState(false);
  const createMutation = useCreateOrganisation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<OrganisationFormData>({
    resolver: zodResolver(organisationFormSchema),
    defaultValues: {
      type: "government",
    },
  });

  const onSubmit = async (data: OrganisationFormData) => {
    setLoading(true);

    try {
      await createMutation.mutateAsync({
        name: data.name,
        type: data.type,
        description: data.description || undefined,
        website: data.website || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        logoUrl: data.logoUrl || undefined,
      });

      toast.success(`Organisation "${data.name}" created successfully`);
      reset();
      onClose();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to create organisation";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Create New Organisation
          </DialogTitle>
          <DialogDescription>
            Add a new partner organisation to the platform. All fields except name and type are optional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name - Required */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1.5">
              Organisation Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="name"
              placeholder="e.g. Niger State Primary Health Care Agency"
              {...register("name")}
            />
            <FormError message={errors.name?.message} />
          </div>

          {/* Type - Required */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium mb-1.5">
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

          {/* Description - Optional */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1.5">
              Description
            </label>
            <Textarea
              id="description"
              rows={3}
              maxLength={500}
              placeholder="Brief description of the organisation..."
              {...register("description")}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional · Max 500 characters
            </p>
            <FormError message={errors.description?.message} />
          </div>

          {/* Contact Information Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="contact@example.org"
                {...register("email")}
              />
              <FormError message={errors.email?.message} />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
                Phone
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="+234 803 123 4567"
                {...register("phone")}
              />
              <FormError message={errors.phone?.message} />
            </div>
          </div>

          {/* Website */}
          <div>
            <label htmlFor="website" className="block text-sm font-medium mb-1.5">
              Website
            </label>
            <Input
              id="website"
              type="url"
              placeholder="https://example.org"
              {...register("website")}
            />
            <FormError message={errors.website?.message} />
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium mb-1.5">
              Physical Address
            </label>
            <Input
              id="address"
              placeholder="123 Main Street, City, State"
              {...register("address")}
            />
            <FormError message={errors.address?.message} />
          </div>

          {/* Logo URL */}
          <div>
            <label htmlFor="logoUrl" className="block text-sm font-medium mb-1.5">
              Logo URL
            </label>
            <Input
              id="logoUrl"
              type="url"
              placeholder="https://example.com/logo.png"
              {...register("logoUrl")}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Direct link to logo image (future: file upload)
            </p>
            <FormError message={errors.logoUrl?.message} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Organisation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
