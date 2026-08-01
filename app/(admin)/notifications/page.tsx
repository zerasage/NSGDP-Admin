"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from "@/lib/hooks/useNotifications";
import { getAdminNotificationHref, type Notification, type NotificationType } from "@/lib/api/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/data/pagination";
import { EmptyState } from "@/components/feedback/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<NotificationType, string> = {
  dataset_approved: "Dataset Approved",
  dataset_rejected: "Dataset Rejected",
  dataset_revision_requested: "Revision Requested",
  account_approved: "Account Approved",
  account_suspended: "Account Suspended",
  new_dataset_available: "New Dataset",
  system_announcement: "Announcement",
  dataset_published: "Dataset Published",
  new_organisation: "New Organisation",
  new_user: "New User",
  admin_invited: "Org Admin Invited",
};

const TYPE_DOT_CLASS: Record<NotificationType, string> = {
  dataset_approved: "bg-emerald-500",
  dataset_rejected: "bg-destructive",
  dataset_revision_requested: "bg-orange-500",
  account_approved: "bg-teal-500",
  account_suspended: "bg-destructive",
  new_dataset_available: "bg-blue-500",
  system_announcement: "bg-purple-500",
  dataset_published: "bg-emerald-500",
  new_organisation: "bg-blue-500",
  new_user: "bg-teal-500",
  admin_invited: "bg-amber-500",
};

const TABS: Array<{ key: "all" | "unread"; label: string }> = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
];

export default function NotificationsPage() {
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isFetching } = useNotifications(page, limit, tab === "unread");
  // Platform-wide unread count, independent of the current page/tab —
  // filtering the current page's items would undercount whenever unread
  // notifications exist outside the page currently in view.
  const { data: unreadData } = useNotifications(1, 1, true);
  const markRead = useMarkNotificationAsRead();
  const markAllRead = useMarkAllNotificationsAsRead();

  const items = data?.data ?? [];
  const meta = data?.meta;
  const unreadCount = unreadData?.meta.total ?? 0;

  const handleClick = (n: Notification) => {
    if (!n.is_read) markRead.mutate(n.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Platform activity and alerts for your account</p>
        </div>
        <div className="flex items-center gap-2">
          {meta && (
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium tabular-nums">
              {meta.total} {meta.total === 1 ? "notification" : "notifications"}
            </Badge>
          )}
          {unreadCount > 0 && (
            <Button
              variant="outline"
              className="h-11 sm:h-9"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="size-4" aria-hidden="true" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="scrollbar-hide overflow-x-auto px-4">
          <div className="flex min-w-max gap-1" role="tablist" aria-label="Notification filter">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => { setTab(t.key); setPage(1); }}
                className={cn(
                  "relative px-3 py-3 text-sm font-medium transition-colors",
                  tab === t.key
                    ? "text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
                {t.key === "unread" && unreadCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-foreground">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div aria-busy={isLoading || isFetching} className="space-y-4">
        {isLoading ? (
          <div className="divide-y overflow-hidden rounded-2xl border bg-card">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-4">
                <Skeleton className="mt-1.5 size-2 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border bg-card">
            <EmptyState
              icon={Bell}
              title={tab === "unread" ? "No unread notifications" : "No notifications yet"}
              description={tab === "unread" ? "You're all caught up." : "Platform activity will appear here as it happens."}
            />
          </div>
        ) : (
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
            {items.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-4 transition-colors hover:bg-muted/30",
                  !n.is_read && "bg-primary/5"
                )}
              >
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    TYPE_DOT_CLASS[n.type] ?? "bg-muted-foreground"
                  )}
                  aria-hidden="true"
                />
                <Link
                  href={getAdminNotificationHref(n.link)}
                  onClick={() => handleClick(n)}
                  className="min-w-0 flex-1"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={cn("text-sm", !n.is_read && "font-semibold")}>{n.title}</p>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {TYPE_LABELS[n.type] ?? n.type}
                    </span>
                    {!n.is_read && (
                      <span className="size-1.5 rounded-full bg-primary" aria-label="Unread" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    {formatDateTime(n.created_at)}
                  </p>
                </Link>
                {!n.is_read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markRead.mutate(n.id)}
                    disabled={markRead.isPending}
                    className="shrink-0"
                  >
                    Mark read
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {meta && meta.totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={meta.totalPages}
            pageSize={limit}
            total={meta.total}
            onPageChange={setPage}
            className="rounded-xl border bg-card px-4 py-3"
          />
        )}
      </div>
    </div>
  );
}
