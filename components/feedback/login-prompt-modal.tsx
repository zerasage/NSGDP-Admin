"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoginPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectAfterAuth: string;
  title?: string;
  description?: string;
}

export function LoginPromptModal({
  open,
  onOpenChange,
  redirectAfterAuth,
  title = "Log in to download",
  description = "Create a free account or log in to access this dataset.",
}: LoginPromptModalProps) {
  const loginUrl = `/login?returnTo=${encodeURIComponent(redirectAfterAuth)}`;
  const registerUrl = `/register?returnTo=${encodeURIComponent(redirectAfterAuth)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          <Link href={loginUrl} className={cn(buttonVariants(), "w-full")}>
            <LogIn className="size-4" />
            Log In
          </Link>
          <Link href={registerUrl} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
            <UserPlus className="size-4" />
            Register
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
