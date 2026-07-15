"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, X } from "lucide-react";
import { mockNotifications } from "@/lib/mock/notifications";
import type { PortalNotification, NotificationType } from "@/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const TYPE_ICON_CLASS: Record<NotificationType, string> = {
  dataset_published: "bg-emerald-500",
  dataset_updated:   "bg-blue-500",
  approval_request:  "bg-amber-500",
  revision_request:  "bg-orange-500",
  access_granted:    "bg-teal-500",
  disease_alert:     "bg-destructive",
  qa_flag:           "bg-yellow-500",
  sop_updated:       "bg-purple-500",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PortalNotification[]>(mockNotifications);

  const unreadCount = items.filter((n) => !n.read).length;

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismiss = (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

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
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted"
                  >
                    <CheckCheck className="size-3" />
                    Mark all read
                  </button>
                )}
                <Link
                  href="/dashboard/notifications"
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
                items.slice(0, 6).map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors",
                      !n.read && "bg-primary/5"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1 size-2 rounded-full shrink-0",
                        TYPE_ICON_CLASS[n.type]
                      )}
                      aria-hidden
                    />
                    <div className="flex-1 min-w-0">
                      <Link
                        href={n.link ?? "#"}
                        onClick={() => {
                          setItems((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
                          setOpen(false);
                        }}
                        className="block"
                      >
                        <p className={cn("text-sm leading-snug", !n.read && "font-medium")}>
                          {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      </Link>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => dismiss(n.id)}
                      className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground mt-0.5"
                      aria-label="Dismiss"
                    >
                      <X className="size-3.5" />
                    </button>
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
