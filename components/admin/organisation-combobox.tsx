"use client";

import { Building2 } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import type { Organisation } from "@/lib/api/organisations";

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

interface OrganisationComboboxProps {
  organisations: Organisation[];
  value: string;
  onValueChange: (id: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
}

export function OrganisationCombobox({
  organisations,
  value,
  onValueChange,
  id,
  placeholder = "Search by name or acronym…",
  className,
}: OrganisationComboboxProps) {
  return (
    <Combobox<Organisation>
      items={organisations}
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
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.logo_url} alt="" className="size-6 shrink-0 rounded object-cover" />
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
      emptyMessage="No organisations match your search"
      className={className}
    />
  );
}
