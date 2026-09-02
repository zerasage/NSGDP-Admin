"use client";

import {
  ArrowRight,
  CircleHelp,
  Lightbulb,
  ListChecks,
  Route,
} from "lucide-react";
import {
  getGisReferenceHelpSection,
  type GisReferenceHelpSectionId,
} from "@/lib/constants/gis-reference-help";

function HelpSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="size-4 text-primary" aria-hidden />
        {title}
      </h3>
      <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export function GisReferenceHelpContent({
  section,
}: {
  section: GisReferenceHelpSectionId;
}) {
  const help = getGisReferenceHelpSection(section);

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">{help.whatIsThis}</p>

      <HelpSection title="What you can do here" icon={ListChecks}>
        <ul className="list-disc space-y-1.5 pl-5">
          {help.whatYouCanDo.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </HelpSection>

      <HelpSection title="How to do it" icon={Route}>
        <ol className="space-y-3">
          {help.steps.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {index + 1}
              </span>
              <div>
                <p className="font-medium text-foreground">{step.title}</p>
                <p className="mt-0.5">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </HelpSection>

      <HelpSection title="What happens next" icon={ArrowRight}>
        <ul className="list-disc space-y-1.5 pl-5">
          {help.whatHappensNext.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </HelpSection>

      <HelpSection title="If this happens…" icon={CircleHelp}>
        <div className="grid gap-2 sm:grid-cols-2">
          {help.scenarios.map((scenario) => (
            <div
              key={scenario.if}
              className="rounded-lg border border-border/80 bg-background/80 p-3"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                If
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">{scenario.if}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Then
              </p>
              <p className="mt-1 text-sm">{scenario.then}</p>
            </div>
          ))}
        </div>
      </HelpSection>

      {help.tips && help.tips.length > 0 ? (
        <HelpSection title="Tips" icon={Lightbulb}>
          <ul className="list-disc space-y-1.5 pl-5">
            {help.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </HelpSection>
      ) : null}
    </div>
  );
}
