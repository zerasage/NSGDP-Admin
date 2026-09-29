"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/forms/form-error";
import { PasswordStrengthMeter } from "@/components/forms/password-strength-meter";
import { changePassword } from "@/lib/api/users";
import { changePasswordSchema } from "@/lib/schemas/auth";
import { toast } from "sonner";

type PasswordFormData = z.infer<typeof changePasswordSchema>;

export function PasswordChangePanel() {
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const newPassword = watch("newPassword", "");

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success("Password changed successfully. Please sign in with your new password.");
      reset();
      setSaving(false);
    },
    onError: (error: unknown) => {
      const message =
        (error as { message?: string })?.message || "Failed to change password";
      toast.error(message);
      setSaving(false);
    },
  });

  const onSubmit = (data: PasswordFormData) => {
    setSaving(true);
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium">
          Current password
        </label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showCurrentPassword ? "text" : "password"}
            className="h-11 pr-10"
            {...register("currentPassword")}
            disabled={saving}
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showCurrentPassword ? "Hide password" : "Show password"}
          >
            {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <FormError message={errors.currentPassword?.message} />
      </div>

      <div>
        <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium">
          New password
        </label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            className="h-11 pr-10"
            {...register("newPassword")}
            disabled={saving}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showNewPassword ? "Hide password" : "Show password"}
          >
            {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <PasswordStrengthMeter password={newPassword} />
        <FormError message={errors.newPassword?.message} />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium">
          Confirm new password
        </label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            className="h-11 pr-10"
            {...register("confirmPassword")}
            disabled={saving}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <FormError message={errors.confirmPassword?.message} />
      </div>

      <Button type="submit" disabled={saving} className="h-11 gap-2 sm:w-auto">
        {saving ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Changing password…
          </>
        ) : (
          "Change password"
        )}
      </Button>
    </form>
  );
}
