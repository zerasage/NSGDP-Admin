import { Clock } from "lucide-react";
import type { DatasetVersion } from "@/types";

interface VersionHistoryPanelProps {
  versions: DatasetVersion[];
}

export function VersionHistoryPanel({ versions }: VersionHistoryPanelProps) {
  if (!versions.length) return null;

  return (
    <section>
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
        <Clock className="size-4 text-muted-foreground" aria-hidden />
        Version History
      </h3>
      <ol className="space-y-2">
        {versions.map((v, i) => (
          <li
            key={v.version}
            className="flex items-start gap-3 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm"
          >
            <span className="shrink-0 rounded border bg-background px-1.5 py-0.5 font-mono text-xs font-semibold">
              {v.version}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm">{v.changeNote}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {v.publishedBy} · {new Date(v.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            {i === 0 && (
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Latest
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
