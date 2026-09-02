"use client";

import { BookOpen, CircleHelp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  getIngestionOpsTabHelp,
  type IngestionOpsTabId,
} from "@/lib/constants/ingestion-ops-help";
import { IngestionOpsTabHelpContent } from "@/components/admin/ingestion-ops-help-panel";

type IngestionOpsTabHelpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: IngestionOpsTabId;
};

export function IngestionOpsTabHelpDialog({
  open,
  onOpenChange,
  tab,
}: IngestionOpsTabHelpDialogProps) {
  const help = getIngestionOpsTabHelp(tab);
  if (!help) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(85vh,720px)] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-5 py-4 pr-12">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="size-5 text-primary" aria-hidden />
            {help.tabLabel} guide
          </DialogTitle>
          <DialogDescription>{help.tagline}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <IngestionOpsTabHelpContent tab={tab} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function IngestionOpsHelpFab({
  tab,
  onClick,
  className,
}: {
  tab: IngestionOpsTabId;
  onClick: () => void;
  className?: string;
}) {
  const help = getIngestionOpsTabHelp(tab);
  if (!help) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-1 ring-primary/20 transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      aria-label={`Open ${help.tabLabel} guide`}
      title={`${help.tabLabel} guide`}
    >
      <CircleHelp className="size-6" aria-hidden />
    </button>
  );
}
