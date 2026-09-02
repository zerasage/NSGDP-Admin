"use client";

import { useEffect, useState } from "react";
import { BookOpen, Route } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  INGESTION_JOURNEY_STEPS,
  INGESTION_OPS_TAB_HELP,
  INGESTION_OPS_TAB_ORDER,
  type IngestionOpsTabId,
} from "@/lib/constants/ingestion-ops-help";
import { IngestionOpsTabHelpContent } from "@/components/admin/ingestion-ops-help-panel";

type IngestionOpsHelpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: IngestionOpsTabId;
  visibleTabs?: IngestionOpsTabId[];
};

export function IngestionOpsHelpDialog({
  open,
  onOpenChange,
  initialTab = "observability",
  visibleTabs,
}: IngestionOpsHelpDialogProps) {
  const tabs = visibleTabs ?? INGESTION_OPS_TAB_ORDER;
  const [selectedTab, setSelectedTab] = useState<IngestionOpsTabId>(initialTab);

  useEffect(() => {
    if (open) {
      setSelectedTab(initialTab);
    }
  }, [open, initialTab]);

  const selectedHelp = INGESTION_OPS_TAB_HELP[selectedTab];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,820px)] w-full max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b px-5 py-4 pr-12">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="size-5 text-primary" aria-hidden />
            Ingestion Ops guide
          </DialogTitle>
          <DialogDescription>
            Plain-language manual for turning uploads into public charts — pick a tab below or
            read the full journey first.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <section className="mb-6 rounded-xl border bg-muted/30 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Route className="size-4 text-primary" aria-hidden />
              The full journey (start to charts)
            </h2>
            <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {INGESTION_JOURNEY_STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="rounded-lg border border-border/60 bg-background px-3 py-2.5"
                >
                  <p className="text-xs font-semibold text-primary">
                    {index + 1}. {step.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {step.detail}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <nav
              className="flex shrink-0 flex-wrap gap-1.5 lg:w-44 lg:flex-col lg:flex-nowrap"
              aria-label="Guide sections"
            >
              {tabs.map((tabId) => {
                const tab = INGESTION_OPS_TAB_HELP[tabId];
                const active = selectedTab === tabId;
                return (
                  <button
                    key={tabId}
                    type="button"
                    onClick={() => setSelectedTab(tabId)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {tab.tabLabel}
                  </button>
                );
              })}
            </nav>

            <div className="min-w-0 flex-1 rounded-xl border bg-card p-4">
              <div className="mb-4 border-b pb-3">
                <h2 className="text-base font-semibold text-foreground">
                  {selectedHelp.tabLabel}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{selectedHelp.tagline}</p>
              </div>
              <IngestionOpsTabHelpContent tab={selectedTab} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
