"use client";

import * as React from "react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComboboxProps<T> {
  items: T[];
  value: string;
  onValueChange: (id: string) => void;
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  /** Defaults to a case-insensitive substring match on getLabel(item). */
  filterFn?: (item: T, query: string) => boolean;
  /** Defaults to a plain label. */
  renderItem?: (item: T) => React.ReactNode;
  /** Static leading icon shown in the input itself (not per-item). */
  renderIcon?: React.ReactNode;
  id?: string;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

/**
 * Generic searchable single-select, built on @base-ui/react's Combobox (the
 * same library the plain Select component already uses) — for any list
 * long enough that scrolling a flat dropdown becomes the bottleneck.
 * Wrap it with entity-specific rendering (see OrganisationCombobox,
 * CategoryCombobox) rather than using it bare for anything user-facing.
 */
export function Combobox<T>({
  items,
  value,
  onValueChange,
  getId,
  getLabel,
  filterFn,
  renderItem,
  renderIcon,
  id,
  placeholder = "Search…",
  emptyMessage = "No results found",
  className,
}: ComboboxProps<T>) {
  const selected = items.find((item) => getId(item) === value) ?? null;

  return (
    <BaseCombobox.Root<T>
      items={items}
      value={selected}
      onValueChange={(item) => onValueChange(item ? getId(item) : "")}
      itemToStringLabel={(item) => getLabel(item)}
      filter={(item, query) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return filterFn ? filterFn(item, q) : getLabel(item).toLowerCase().includes(q);
      }}
    >
      <BaseCombobox.InputGroup
        className={cn(
          "flex h-9 w-full items-center gap-1.5 rounded-lg border border-input bg-transparent pl-3 pr-2 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
          className
        )}
      >
        {renderIcon}
        <BaseCombobox.Input
          id={id}
          placeholder={placeholder}
          className="h-full w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <BaseCombobox.Trigger className="shrink-0 text-muted-foreground" aria-label="Toggle list">
          <ChevronDown className="size-4" />
        </BaseCombobox.Trigger>
      </BaseCombobox.InputGroup>

      <BaseCombobox.Portal>
        <BaseCombobox.Positioner className="isolate z-50" sideOffset={4} align="start">
          <BaseCombobox.Popup className="max-h-72 w-(--anchor-width) min-w-[280px] overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
            <BaseCombobox.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </BaseCombobox.Empty>
            <BaseCombobox.List>
              {(item: T) => (
                <BaseCombobox.Item
                  key={getId(item)}
                  value={item}
                  className="relative flex cursor-default items-center gap-2 rounded-md py-2 pl-2.5 pr-8 text-sm outline-none select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                >
                  {renderItem ? renderItem(item) : <span className="truncate">{getLabel(item)}</span>}
                  <BaseCombobox.ItemIndicator className="absolute right-2 flex items-center justify-center">
                    <Check className="size-4 shrink-0" />
                  </BaseCombobox.ItemIndicator>
                </BaseCombobox.Item>
              )}
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
}
