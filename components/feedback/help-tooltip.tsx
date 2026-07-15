import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  content: string;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
}

export function HelpTooltip({ content, className, side = "top" }: HelpTooltipProps) {
  return (
    <TooltipProvider delay={150}>
      <Tooltip>
        <TooltipTrigger>
          <HelpCircle
            className={cn(
              "size-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help shrink-0",
              className
            )}
            aria-label="Help"
          />
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-60 text-xs">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
