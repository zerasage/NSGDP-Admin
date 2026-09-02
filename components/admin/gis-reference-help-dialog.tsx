"use client";

import { useEffect, useState } from "react";
import { BookOpen, CircleHelp, Route } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  GIS_REFERENCE_HELP,
  GIS_REFERENCE_HELP_SECTION_ORDER,
  GIS_REFERENCE_JOURNEY_STEPS,
  type GisReferenceHelpSectionId,
} from "@/lib/constants/gis-reference-help";
import { GisReferenceHelpContent } from "@/components/admin/gis-reference-help-panel";

type GisReferenceHelpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSection?: GisReferenceHelpSectionId;
};

export function GisReferenceHelpDialog({
  open,
  onOpenChange,
  initialSection = "overview",
}: GisReferenceHelpDialogProps) {
  const [selectedSection, setSelectedSection] =
    useState<GisReferenceHelpSectionId>(initialSection);

  useEffect(() => {
    if (open) {
      setSelectedSection(initialSection);
    }
  }, [open, initialSection]);

  const selectedHelp = GIS_REFERENCE_HELP[selectedSection];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,820px)] w-full max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b px-5 py-4 pr-12">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="size-5 text-primary" aria-hidden />
            GIS Reference Layers guide
          </DialogTitle>
          <DialogDescription>
            Plain-language manual for platform map layers, the ward gazetteer, and spelling
            reconciliation.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <section className="mb-6 rounded-xl border bg-muted/30 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Route className="size-4 text-primary" aria-hidden />
              The full journey
            </h2>
            <ol className="mt-3 grid gap-2 sm:grid-cols-2">
              {GIS_REFERENCE_JOURNEY_STEPS.map((step, index) => (
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
              {GIS_REFERENCE_HELP_SECTION_ORDER.map((sectionId) => {
                const section = GIS_REFERENCE_HELP[sectionId];
                const active = selectedSection === sectionId;
                return (
                  <button
                    key={sectionId}
                    type="button"
                    onClick={() => setSelectedSection(sectionId)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {section.sectionLabel}
                  </button>
                );
              })}
            </nav>

            <div className="min-w-0 flex-1 rounded-xl border bg-card p-4">
              <div className="mb-4 border-b pb-3">
                <h2 className="text-base font-semibold text-foreground">
                  {selectedHelp.sectionLabel}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{selectedHelp.tagline}</p>
              </div>
              <GisReferenceHelpContent section={selectedSection} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function GisReferenceHelpFab({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-1 ring-primary/20 transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      aria-label="Open GIS Reference Layers guide"
      title="GIS Reference Layers guide"
    >
      <CircleHelp className="size-6" aria-hidden />
    </button>
  );
}
