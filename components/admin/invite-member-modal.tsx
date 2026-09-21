"use client";

import { useState } from "react";
import { Mail, UserPlus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInvite, InviteRole } from "@/lib/api/invites";
import { ApiError } from "@/lib/api/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  developmentPartnerId: string;
  developmentPartnerName: string;
}

export function InviteMemberModal({
  open,
  onClose,
  developmentPartnerId,
  developmentPartnerName,
}: InviteMemberModalProps) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>(InviteRole.CONTRIBUTOR);
  const [message, setMessage] = useState("");

  const inviteMutation = useMutation({
    mutationFn: () =>
      createInvite(developmentPartnerId, {
        invitedEmail: email,
        role,
        message: message || undefined,
      }),
    onSuccess: () => {
      toast.success("Invite sent successfully", {
        description: `An invitation email has been sent to ${email}`,
      });
      queryClient.invalidateQueries({ queryKey: ["org-invites", developmentPartnerId] });
      handleClose();
    },
    onError: (error: unknown) => {
      toast.error("Failed to send invite", {
        description: error instanceof ApiError ? error.message : "Please try again",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    inviteMutation.mutate();
  };

  const handleClose = () => {
    setEmail("");
    setRole(InviteRole.CONTRIBUTOR);
    setMessage("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="max-h-[min(90dvh,720px)] gap-0 overflow-y-auto sm:max-w-[520px]">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <UserPlus className="size-5 shrink-0" />
            <span className="truncate">Invite Member to {developmentPartnerName}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 pl-9"
                required
                disabled={inviteMutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              Role <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={role}
              onValueChange={(value) => setRole(value as InviteRole)}
              disabled={inviteMutation.isPending}
              className="grid gap-2 sm:grid-cols-2"
            >
              <label
                htmlFor="contributor"
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors",
                  role === InviteRole.CONTRIBUTOR
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                )}
              >
                <RadioGroupItem value={InviteRole.CONTRIBUTOR} id="contributor" className="mt-0.5" />
                <div className="min-w-0 space-y-0.5">
                  <span className="text-sm font-medium leading-none">Contributor</span>
                  <p className="text-xs leading-snug text-muted-foreground">
                    Upload and manage their own datasets
                  </p>
                </div>
              </label>

              <label
                htmlFor="admin"
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors",
                  role === InviteRole.ADMIN
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                )}
              >
                <RadioGroupItem value={InviteRole.ADMIN} id="admin" className="mt-0.5" />
                <div className="min-w-0 space-y-0.5">
                  <span className="text-sm font-medium leading-none">Development Partner Admin</span>
                  <p className="text-xs leading-snug text-muted-foreground">
                    Manage datasets and invite members
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message">
              Personal Message <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to the invitation email..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              maxLength={500}
              className="min-h-[64px] resize-none"
              disabled={inviteMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/500 · Invite expires in 7 days
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={inviteMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending || !email}>
              {inviteMutation.isPending ? "Sending..." : "Send Invite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
