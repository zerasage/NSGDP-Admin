import { differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AgeBadgeProps {
  submittedAt: string | Date;
  className?: string;
}

export function AgeBadge({ submittedAt, className }: AgeBadgeProps) {
  const days = differenceInDays(new Date(), new Date(submittedAt));

  const variant =
    days <= 2 ? "success" : days <= 5 ? "warning" : "destructive";

  const label =
    days === 0 ? "Today" : days === 1 ? "1 day" : `${days} days`;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        variant === "success" && "border-success/50 bg-success/10 text-success",
        variant === "warning" && "border-warning/50 bg-warning/10 text-warning",
        variant === "destructive" && "border-destructive/50 bg-destructive/10 text-destructive",
        className
      )}
    >
      {label}
    </Badge>
  );
}
