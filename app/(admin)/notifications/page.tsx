"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from "@/lib/hooks/useNotifications";
import type { Notification, NotificationType } from "@/lib/api/notifications";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/data/pagination";
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

  const { data, isLoading } = useNotifications(page, limit, tab === "unread");
  const markRead = useMarkNotificationAsRead();
  const markAllRead = useMarkAllNotificationsAsRead();

  const items = data?.data ?? [];
  const meta = data?.meta;
  const unreadCount = items.filter((n) => !n.is_read).length;

  const handleClick = (n: Notification) => {
    if (!n.is_read) markRead.mutate(n.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {meta ? `${meta.total} notification${meta.total !== 1 ? "s" : ""}` : "Loading…"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="size-4" />
            Mark all read
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              setTab(key);
              setPage(1);
            }}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <Bell className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {tab === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-4 hover:bg-muted/30 transition-colors",
                  !n.is_read && "bg-primary/5"
                )}
              >
                <span
                  className={cn(
                    "mt-1.5 size-2 rounded-full shrink-0",
                    TYPE_DOT_CLASS[n.type] ?? "bg-muted-foreground"
                  )}
                  aria-hidden
                />
                <Link
                  href={n.link ?? "#"}
                  onClick={() => handleClick(n)}
                  className="flex-1 min-w-0"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={cn("text-sm", !n.is_read && "font-semibold")}>{n.title}</p>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                      {TYPE_LABELS[n.type] ?? n.type}
                    </span>
                    {!n.is_read && (
                      <span className="size-1.5 rounded-full bg-primary" aria-label="Unread" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
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
      </div>

      {meta && meta.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={meta.totalPages}
          pageSize={limit}
          total={meta.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
