"use client";

import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FieldLabelTooltipProps {
  htmlFor?: string;
  label: string;
  required?: boolean;
  tooltip: string;
}

export function FieldLabelTooltip({
  htmlFor,
  label,
  required,
  tooltip,
}: FieldLabelTooltipProps) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <TooltipProvider delay={200}>
        <Tooltip>
          <TooltipTrigger
            type="button"
            className="text-muted-foreground hover:text-foreground"
            aria-label={`Help: ${label}`}
          >
            <HelpCircle className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
