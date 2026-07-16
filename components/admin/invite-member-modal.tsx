"use client";

import { useState } from "react";
import { X, Mail, UserPlus, Info } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInvite, InviteRole } from "@/lib/api/admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  organisationId: string;
  organisationName: string;
}

export function InviteMemberModal({
  open,
  onClose,
  organisationId,
  organisationName,
}: InviteMemberModalProps) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>(InviteRole.CONTRIBUTOR);
  const [message, setMessage] = useState("");

  const inviteMutation = useMutation({
    mutationFn: () =>
      createInvite(organisationId, {
        invitedEmail: email,
        role,
        message: message || undefined,
      }),
    onSuccess: () => {
      toast.success("Invite sent successfully", {
        description: `An invitation email has been sent to ${email}`,
      });
      // Invalidate invites query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["org-invites", organisationId] });
      handleClose();
    },
    onError: (error: any) => {
      toast.error("Failed to send invite", {
        description: error.response?.data?.message || "Please try again",
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            Invite Member to {organisationName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
                disabled={inviteMutation.isPending}
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <Label>
              Role <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={role}
              onValueChange={(value) => setRole(value as InviteRole)}
              disabled={inviteMutation.isPending}
              className="space-y-3"
            >
              <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={InviteRole.CONTRIBUTOR} id="contributor" className="mt-0.5" />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="contributor" className="font-medium cursor-pointer">
                    Contributor
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Can upload and manage their own datasets
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={InviteRole.ADMIN} id="admin" className="mt-0.5" />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="admin" className="font-medium cursor-pointer">
                    Organisation Admin
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Can manage all datasets and invite new members
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Optional Message */}
          <div className="space-y-2">
            <Label htmlFor="message">
              Personal Message <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to the invitation email..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
              disabled={inviteMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/500 characters
            </p>
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="size-4" />
            <AlertDescription className="text-sm">
              The invited user will receive an email with a link to accept the invitation
              and create their account. The invitation will expire in 7 days.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={inviteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={inviteMutation.isPending || !email}
            >
              {inviteMutation.isPending ? "Sending..." : "Send Invite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
