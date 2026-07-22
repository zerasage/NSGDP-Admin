"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from "@/lib/hooks/useNotifications";
import type { NotificationType } from "@/lib/api/notifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

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

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data } = useNotifications(1, 10);
  const markRead = useMarkNotificationAsRead();
  const markAllRead = useMarkAllNotificationsAsRead();

  const items = data?.data ?? [];
  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex size-9 items-center justify-center rounded-md hover:bg-muted transition-colors"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-xl border bg-background shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <p className="font-semibold text-sm">Notifications</p>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllRead.mutate()}
                    disabled={markAllRead.isPending}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted"
                  >
                    <CheckCheck className="size-3" />
                    Mark all read
                  </button>
                )}
                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className="text-xs text-primary hover:underline px-2 py-1"
                >
                  View all
                </Link>
              </div>
            </div>

            <ul className="divide-y max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No notifications
                </li>
              ) : (
                items.map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors",
                      !n.is_read && "bg-primary/5"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1 size-2 rounded-full shrink-0",
                        TYPE_DOT_CLASS[n.type] ?? "bg-muted-foreground"
                      )}
                      aria-hidden
                    />
                    <Link
                      href={n.link ?? "/notifications"}
                      onClick={() => {
                        if (!n.is_read) markRead.mutate(n.id);
                        setOpen(false);
                      }}
                      className="flex-1 min-w-0 block"
                    >
                      <p className={cn("text-sm leading-snug", !n.is_read && "font-medium")}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
