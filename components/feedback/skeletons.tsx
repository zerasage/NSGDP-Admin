import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function DatasetCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border p-5 space-y-4", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2 py-8">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-5 w-96 max-w-full" />
    </div>
  );
}

export function GroupTileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border p-6 space-y-4", className)}>
      <Skeleton className="size-12 rounded-lg" />
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

export function OrgCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border p-6 space-y-4", className)}>
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}
