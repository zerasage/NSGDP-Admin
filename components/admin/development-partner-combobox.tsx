"use client";

import { Building2 } from "lucide-react";
import Image from "next/image";
import { Combobox } from "@/components/ui/combobox";
import type { DevelopmentPartner } from "@/lib/api/development-partners";

const ORG_TYPE_LABELS: Record<string, string> = {
  government: "Government",
  ngo: "NGO",
  private: "Private",
  international: "International",
  academic: "Academic",
  community: "Community",
  healthcare: "Healthcare",
  other: "Other",
};

interface DevelopmentPartnerComboboxProps {
  developmentPartners: DevelopmentPartner[];
  value: string;
  onValueChange: (id: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
}

export function DevelopmentPartnerCombobox({
  developmentPartners,
  value,
  onValueChange,
  id,
  placeholder = "Search by name or acronym…",
  className,
}: DevelopmentPartnerComboboxProps) {
  return (
    <Combobox<DevelopmentPartner>
      items={developmentPartners}
      value={value}
      onValueChange={onValueChange}
      getId={(org) => org.id}
      getLabel={(org) => org.name}
      filterFn={(org, q) =>
        org.name.toLowerCase().includes(q) || !!org.acronym?.toLowerCase().includes(q)
      }
      renderIcon={<Building2 className="size-4 shrink-0 text-muted-foreground" />}
      renderItem={(org) => (
        <>
          {org.logo_url ? (
            <Image
              src={org.logo_url}
              alt=""
              width={24}
              height={24}
              className="size-6 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="flex size-6 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary">
              {org.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{org.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {org.acronym ? `${org.acronym} · ` : ""}
              {ORG_TYPE_LABELS[org.type] ?? org.type}
            </p>
          </div>
        </>
      )}
      id={id}
      placeholder={placeholder}
      emptyMessage="No development partners match your search"
      className={className}
    />
  );
}
