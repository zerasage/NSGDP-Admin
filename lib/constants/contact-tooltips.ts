export const CONTACT_MESSAGES_PAGE_TIP =
  "Inbox for messages sent through the public contact form. Opening a new message marks it Open. Replies are sent manually by email — the platform does not auto-respond.";

export const CONTACT_MESSAGES_PANEL_TIP =
  "Filter by status or search sender name, email, subject, or message body. New messages need a first look; close when handled.";

export const CONTACT_MESSAGES_TAB_TIPS = {
  new: "Unread submissions — open one to mark it Open and start working it.",
  open: "In progress — add staff notes and reply by email when ready.",
  closed: "Handled — reopen if the conversation continues.",
  all: "Every message regardless of status.",
} as const;

export const CONTACT_MESSAGES_METRIC_TIPS = {
  total: "All contact form submissions received.",
  new: "Not yet opened by staff — highest priority.",
  open: "Someone started working the thread; reply may still be pending.",
  closed: "Resolved — no further action expected.",
} as const;

export const CONTACT_MESSAGES_STAFF_NOTES_TIP =
  "Internal only — not shown to the sender. Record what you did, who replied, or follow-up needed.";

export const CONTACT_MESSAGES_REPLY_TIP =
  "Opens your email app with the sender's address and a Re: subject line. Write and send the reply from your mail client.";

export const CONTACT_MESSAGES_CLOSE_TIP =
  "Marks the message closed after you have replied or no response is needed.";

export const CONTACT_MESSAGES_REOPEN_TIP =
  "Returns a closed message to Open if the sender writes back or you need to continue the thread.";
