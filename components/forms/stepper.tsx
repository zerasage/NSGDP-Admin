"use client";

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
  className?: string;
}

export function Stepper({ steps, currentStep, onStepClick, className }: StepperProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isComplete = currentStep > step.id;
        const isActive = currentStep >= step.id;
        const clickable = onStepClick && step.id < currentStep;

        return (
          <div key={step.id} className="flex items-center">
            <button
              type="button"
              className={cn(
                "flex flex-col items-center",
                clickable ? "cursor-pointer" : "cursor-default"
              )}
              onClick={() => clickable && onStepClick(step.id)}
              disabled={!clickable}
              aria-current={currentStep === step.id ? "step" : undefined}
            >
              <div
                className={cn(
                  "flex size-12 items-center justify-center rounded-full border-2 transition-colors",
                  isActive
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isComplete ? (
                  <CheckCircle className="size-6" aria-hidden="true" />
                ) : Icon ? (
                  <Icon className="size-6" aria-hidden="true" />
                ) : (
                  <span className="text-sm font-semibold">{step.id}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-sm font-medium",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.name}
              </span>
            </button>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-24 h-0.5 mx-4 transition-colors",
                  currentStep > step.id ? "bg-primary" : "bg-muted-foreground/30"
                )}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
