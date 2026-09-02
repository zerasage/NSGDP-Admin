import { Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function MailtoLink({
  email,
  className,
  subject,
}: {
  email: string;
  className?: string;
  subject?: string;
}) {
  const href = subject
    ? `mailto:${email}?subject=${encodeURIComponent(subject)}`
    : `mailto:${email}`;

  return (
    <a href={href} className={cn("hover:underline", className)}>
      {email}
    </a>
  );
}

export function TelLink({
  phone,
  className,
}: {
  phone: string;
  className?: string;
}) {
  return (
    <a href={telHref(phone)} className={cn("hover:underline", className)}>
      {phone}
    </a>
  );
}

export function ContactEmailRow({
  email,
  className,
}: {
  email: string;
  className?: string;
}) {
  return (
    <p className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <Mail className="size-3 shrink-0" aria-hidden />
      <MailtoLink email={email} className="truncate" />
    </p>
  );
}

export function ContactPhoneRow({
  phone,
  className,
}: {
  phone: string;
  className?: string;
}) {
  return (
    <p className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <Phone className="size-3 shrink-0" aria-hidden />
      <TelLink phone={phone} />
    </p>
  );
}
