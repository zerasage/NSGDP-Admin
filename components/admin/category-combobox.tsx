"use client";

import { Combobox } from "@/components/ui/combobox";
import type { Category } from "@/lib/api/categories";

interface CategoryComboboxProps {
  categories: Category[];
  value: string;
  onValueChange: (id: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
}

export function CategoryCombobox({
  categories,
  value,
  onValueChange,
  id,
  placeholder = "Search categories…",
  className,
}: CategoryComboboxProps) {
  return (
    <Combobox<Category>
      items={categories}
      value={value}
      onValueChange={onValueChange}
      getId={(cat) => cat.id}
      getLabel={(cat) => cat.name}
      renderItem={(cat) => (
        <>
          {cat.icon && <span className="shrink-0 text-base leading-none">{cat.icon}</span>}
          <span className="truncate flex-1">{cat.name}</span>
        </>
      )}
      id={id}
      placeholder={placeholder}
      emptyMessage="No categories match your search"
      className={className}
    />
  );
}
