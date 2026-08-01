"use client";

import { useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepperStep {
  id: number;
  name: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function Stepper({
  steps,
  currentStep,
  onStepClick,
  orientation = "horizontal",
  className,
}: StepperProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeStepRef = useRef<HTMLButtonElement>(null);

  // Horizontal variant only: keep the active step visible (and roughly
  // centered) as currentStep advances, since the step row is wider than the
  // viewport on mobile and would otherwise silently scroll off-screen.
  useEffect(() => {
    activeStepRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [currentStep]);

  if (orientation === "vertical") {
    return (
      <ol className={cn("space-y-0.5", className)} aria-label="Upload steps">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isComplete = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const clickable = !!onStepClick && step.id < currentStep;

          return (
            <li key={step.id}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  isCurrent && "bg-primary/10 text-primary",
                  !isCurrent && "text-muted-foreground hover:text-foreground",
                  clickable && "hover:bg-muted",
                  !clickable && !isCurrent && "cursor-default"
                )}
                onClick={() => clickable && onStepClick(step.id)}
                disabled={!clickable}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                    (isComplete || isCurrent)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background"
                  )}
                >
                  {isComplete ? (
                    <CheckCircle className="size-4" aria-hidden="true" />
                  ) : Icon ? (
                    <Icon className="size-4" aria-hidden="true" />
                  ) : (
                    <span className="text-xs font-semibold">{step.id}</span>
                  )}
                </span>
                <span className={cn("text-sm font-medium leading-tight", isCurrent && "font-semibold")}>
                  {step.name}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "ml-5 h-4 w-px",
                    currentStep > step.id ? "bg-primary" : "bg-border"
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <div ref={scrollRef} className={cn("scrollbar-hide overflow-x-auto", className)}>
      <div className="flex w-full min-w-[44rem] items-start">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isComplete = currentStep > step.id;
        const isActive = currentStep >= step.id;
        const isCurrent = currentStep === step.id;
        const clickable = onStepClick && step.id < currentStep;

        return (
          <div
            key={step.id}
            className={cn("flex items-center", index < steps.length - 1 ? "flex-1" : "shrink-0")}
          >
            <button
              ref={isCurrent ? activeStepRef : undefined}
              type="button"
              className={cn(
                "flex flex-col items-center",
                clickable ? "cursor-pointer" : "cursor-default"
              )}
              onClick={() => clickable && onStepClick(step.id)}
              disabled={!clickable}
              aria-current={isCurrent ? "step" : undefined}
            >
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border-2 transition-colors",
                  isActive
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isComplete ? (
                  <CheckCircle className="size-5" aria-hidden="true" />
                ) : Icon ? (
                  <Icon className="size-5" aria-hidden="true" />
                ) : (
                  <span className="text-sm font-semibold">{step.id}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-2 w-28 text-center text-xs font-medium",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.name}
              </span>
            </button>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-3 -mt-6 h-0.5 min-w-8 flex-1 transition-colors",
                  currentStep > step.id ? "bg-primary" : "bg-muted-foreground/30"
                )}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
