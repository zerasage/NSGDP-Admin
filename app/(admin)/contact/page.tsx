"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Inbox,
  Loader2,
  Lock,
  Mail,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/feedback/empty-state";
import { Pagination } from "@/components/data/pagination";
import { TableRowSkeleton } from "@/components/feedback/skeletons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/lib/hooks/use-toast";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import {
  useContactMessages,
  useContactMessageStats,
  useUpdateContactMessage,
} from "@/lib/hooks/useContactMessages";
import type { ContactMessage, ContactMessageStatus } from "@/lib/api/contact";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import {
  DataTableShell,
  METRIC_TONE,
  MetricCard,
  Panel,
  tabToneClass,
  type MetricTone,
} from "@/components/admin/admin-analytics-ui";
import { HelpTip } from "@/components/admin/help-tip";
import {
  ContactEmailRow,
  ContactPhoneRow,
} from "@/components/admin/contact-links";
import {
  CONTACT_MESSAGES_CLOSE_TIP,
  CONTACT_MESSAGES_METRIC_TIPS,
  CONTACT_MESSAGES_PAGE_TIP,
  CONTACT_MESSAGES_PANEL_TIP,
  CONTACT_MESSAGES_REOPEN_TIP,
  CONTACT_MESSAGES_REPLY_TIP,
  CONTACT_MESSAGES_STAFF_NOTES_TIP,
  CONTACT_MESSAGES_TAB_TIPS,
} from "@/lib/constants/contact-tooltips";
import { TooltipProvider } from "@/components/ui/tooltip";

const STATUS_CONFIG: Record<ContactMessageStatus, { label: string; tone: MetricTone }> = {
  new: { label: "New", tone: "warning" },
  open: { label: "Open", tone: "info" },
  closed: { label: "Closed", tone: "success" },
};

const TABS: Array<{
  key: ContactMessageStatus | "all";
  label: string;
  tone: MetricTone;
  tip: string;
}> = [
  { key: "new", label: "New", tone: "warning", tip: CONTACT_MESSAGES_TAB_TIPS.new },
  { key: "open", label: "Open", tone: "info", tip: CONTACT_MESSAGES_TAB_TIPS.open },
  { key: "closed", label: "Closed", tone: "success", tip: CONTACT_MESSAGES_TAB_TIPS.closed },
  { key: "all", label: "All messages", tone: "muted", tip: CONTACT_MESSAGES_TAB_TIPS.all },
];

function StatusBadge({ status }: { status: ContactMessageStatus }) {
  const { label, tone } = STATUS_CONFIG[status];
  const t = METRIC_TONE[tone];
  return (
    <Badge variant="outline" className={cn("border text-xs capitalize", t.well, t.icon)}>
      {label}
    </Badge>
  );
}

export default function ContactMessagesPage() {
  const { toast } = useToast();
  const { isLoading: permissionsLoading, can, canAny } = useAdminAccess();

  const canReview = can("review:contact-messages");
  const canView = canAny("view:contact-messages", "review:contact-messages");

  const [status, setStatus] = useState<ContactMessageStatus | "all">("new");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isFetching, isError, refetch } = useContactMessages({
    page,
    limit: pageSize,
    status: status === "all" ? undefined : status,
    search: debouncedQuery || undefined,
  });
  const statsQuery = useContactMessageStats();
  const updateMutation = useUpdateContactMessage();

  const messages = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const stats = statsQuery.data;
  const isSearchPending = query.trim() !== debouncedQuery;

  const openMessage = (message: ContactMessage) => {
    setSelected(message);
    setNotes(message.staff_notes ?? "");
    if (canReview && message.status === "new") {
      updateMutation.mutate(
        { id: message.id, data: { status: "open" } },
        {
          onSuccess: (updated) => setSelected(updated),
          onError: () => {
            toast({
              title: "Couldn't mark as open",
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  const saveNotesAndStatus = (nextStatus?: ContactMessageStatus) => {
    if (!selected || !canReview) return;
    updateMutation.mutate(
      {
        id: selected.id,
        data: {
          staffNotes: notes,
          ...(nextStatus ? { status: nextStatus } : {}),
        },
      },
      {
        onSuccess: (updated) => {
          setSelected(updated);
          toast({ title: "Message updated" });
        },
        onError: () => {
          toast({ title: "Couldn't update this message", variant: "destructive" });
        },
      }
    );
  };

  if (!permissionsLoading && !canView) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={Lock}
          title="Access restricted"
          description="Viewing contact messages requires view:contact-messages or review:contact-messages. Ask a super_admin to grant your group one of these."
        />
      </div>
    );
  }

  const hasFilters = Boolean(debouncedQuery || status !== "new");
  const clearFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setStatus("new");
    setPage(1);
  };

  return (
    <TooltipProvider delay={200}>
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            Contact Messages
            <HelpTip content={CONTACT_MESSAGES_PAGE_TIP} label="About contact messages" />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inbox for the public contact form. Replies are sent manually by email.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total" value={stats?.total ?? "—"} icon={Inbox} tone="muted" tip={CONTACT_MESSAGES_METRIC_TIPS.total} />
        <MetricCard label="New" value={stats?.new ?? "—"} icon={Mail} tone="warning" tip={CONTACT_MESSAGES_METRIC_TIPS.new} />
        <MetricCard label="Open" value={stats?.open ?? "—"} icon={Mail} tone="info" tip={CONTACT_MESSAGES_METRIC_TIPS.open} />
        <MetricCard label="Closed" value={stats?.closed ?? "—"} icon={CheckCircle2} tone="success" tip={CONTACT_MESSAGES_METRIC_TIPS.closed} />
      </div>

      <Panel
        title="Inbox"
        titleTip={CONTACT_MESSAGES_PANEL_TIP}
        description="Filter by status or search name, email, subject, and message text."
        icon={Mail}
        tone="info"
      >
        <div className="space-y-4">
          <div className="rounded-xl border bg-muted/30 p-1">
            <div className="flex flex-wrap gap-1" role="tablist" aria-label="Message status">
              {TABS.map((tab) => (
                <div key={tab.key} className="inline-flex items-center gap-0.5">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={status === tab.key}
                    onClick={() => {
                      setStatus(tab.key);
                      setPage(1);
                    }}
                    className={cn(
                      "min-h-9 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm",
                      status === tab.key
                        ? cn("shadow-sm", tabToneClass(tab.tone))
                        : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </button>
                  {status === tab.key ? (
                    <HelpTip content={tab.tip} label={`About ${tab.label}`} />
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="Search name, email, or subject"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 pl-9 pr-10"
                aria-label="Search contact messages"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-0 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters} className="h-10">
                <X className="size-4" />
                Clear filters
              </Button>
            )}

            <div className="flex min-h-5 items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
              {(isSearchPending || (isFetching && !isLoading)) && (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              )}
              <span>
                {isSearchPending ? "Searching" : isFetching && !isLoading ? "Updating" : "Found"}{" "}
                <span className="font-semibold tabular-nums text-foreground">{total}</span>{" "}
                {total === 1 ? "message" : "messages"}
              </span>
            </div>
          </div>
        </div>
      </Panel>

      <div aria-busy={isLoading || isFetching || isSearchPending} className="space-y-4">
        {isError ? (
          <div className="rounded-2xl border bg-card px-4 py-12 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-7" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-base font-semibold">Could not load messages</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Check your connection and try loading the inbox again.
            </p>
            <Button variant="outline" className="mt-5 h-11 sm:h-8" onClick={() => refetch()}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Try again
            </Button>
          </div>
        ) : isLoading ? (
          <>
            <div className="hidden overflow-hidden rounded-2xl border bg-card xl:block">
              <Table>
                <TableBody>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <TableRowSkeleton key={index} cols={5} />
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="grid grid-cols-1 gap-3 xl:hidden">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-40 rounded-xl" />
              ))}
            </div>
          </>
        ) : messages.length === 0 ? (
          <div className="rounded-2xl border bg-card">
            <EmptyState
              icon={Inbox}
              title={hasFilters ? "No matching messages" : "No messages yet"}
              description={
                hasFilters
                  ? "Try a different search term or status filter."
                  : "Public contact-form submissions will appear here."
              }
              action={hasFilters ? { label: "Clear filters", onClick: clearFilters } : undefined}
            />
          </div>
        ) : (
          <>
            <DataTableShell>
              <div className="hidden xl:block">
                <Table>
                  <TableHeader>
                    <TableRow className="h-11 bg-muted/40 text-[11px] uppercase tracking-wide hover:bg-muted/40">
                      <TableHead className="h-11 px-4">From</TableHead>
                      <TableHead className="h-11 px-4">Subject</TableHead>
                      <TableHead className="h-11 px-4">Status</TableHead>
                      <TableHead className="h-11 px-4">Received</TableHead>
                      <TableHead className="h-11 px-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.map((message) => (
                      <TableRow key={message.id} className="hover:bg-muted/30">
                        <TableCell className="max-w-xs px-4 py-3.5">
                          <p className="font-semibold">{message.name}</p>
                          <ContactEmailRow email={message.email} className="mt-1" />
                          {message.phone ? (
                            <ContactPhoneRow phone={message.phone} className="mt-0.5" />
                          ) : null}
                        </TableCell>
                        <TableCell className="max-w-md px-4 py-3.5">
                          <p className="line-clamp-1 text-sm font-medium">{message.subject}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {message.message}
                          </p>
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <StatusBadge status={message.status} />
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-xs text-muted-foreground">
                          {formatDate(message.created_at)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right">
                          <Button variant="ghost" size="sm" onClick={() => openMessage(message)}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </DataTableShell>

            <div className="grid grid-cols-1 gap-3 xl:hidden">
              {messages.map((message) => (
                <article key={message.id} className="space-y-3 rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{message.name}</p>
                      <p className="mt-1 text-sm font-medium">{message.subject}</p>
                      <ContactEmailRow email={message.email} className="mt-1.5" />
                      {message.phone ? (
                        <ContactPhoneRow phone={message.phone} className="mt-0.5" />
                      ) : null}
                    </div>
                    <StatusBadge status={message.status} />
                  </div>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{message.message}</p>
                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(message.created_at)}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => openMessage(message)}>
                      View
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            <Pagination
              page={page}
              totalPages={Math.max(1, totalPages)}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              className="rounded-xl border bg-card px-4 py-3"
            />
          </>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{selected?.subject}</DialogTitle>
            <DialogDescription>Public contact form submission</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="space-y-2 rounded-lg border bg-muted/40 p-4">
                <p className="font-semibold">{selected.name}</p>
                <ContactEmailRow email={selected.email} />
                {selected.phone ? <ContactPhoneRow phone={selected.phone} /> : null}
                <StatusBadge status={selected.status} />
              </div>
              <p className="whitespace-pre-wrap text-sm">{selected.message}</p>
              {canReview && (
                <div>
                  <Label htmlFor="staffNotes" className="flex items-center gap-1.5">
                    Staff notes
                    <HelpTip content={CONTACT_MESSAGES_STAFF_NOTES_TIP} label="About staff notes" />
                  </Label>
                  <Textarea
                    id="staffNotes"
                    className="mt-1.5"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            {selected ? (
              <div className="flex items-center gap-1 sm:mr-auto">
                <a
                  href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
                  className={buttonVariants({ variant: "default" })}
                >
                  <Mail className="size-4 mr-2" />
                  Reply by email
                </a>
                <HelpTip content={CONTACT_MESSAGES_REPLY_TIP} label="About reply by email" />
              </div>
            ) : (
              <span className="hidden sm:block sm:mr-auto" />
            )}
            <div className="flex flex-wrap gap-2 sm:justify-end">
            {canReview && selected?.status !== "closed" && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  disabled={updateMutation.isPending}
                  onClick={() => saveNotesAndStatus("closed")}
                >
                  Close
                </Button>
                <HelpTip content={CONTACT_MESSAGES_CLOSE_TIP} label="About close" />
              </div>
            )}
            {canReview && selected?.status === "closed" && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  disabled={updateMutation.isPending}
                  onClick={() => saveNotesAndStatus("open")}
                >
                  Reopen
                </Button>
                <HelpTip content={CONTACT_MESSAGES_REOPEN_TIP} label="About reopen" />
              </div>
            )}
            {canReview && (
              <Button disabled={updateMutation.isPending} onClick={() => saveNotesAndStatus()}>
                {updateMutation.isPending ? "Saving…" : "Save notes"}
              </Button>
            )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
