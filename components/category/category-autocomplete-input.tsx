"use client";

import { useEffect, useMemo, useState, type ComponentProps } from "react";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCategorySuggestions } from "@/hooks/use-category-suggestions";

interface CategoryAutocompleteInputProps
  extends Omit<ComponentProps<typeof Input>, "value" | "onChange" | "defaultValue"> {
  value: string;
  onChange: (value: string) => void;
  accountSlug?: string;
  fallback?: ReadonlyArray<string>;
  suggestionsLimit?: number;
  emptyMessage?: string;
  loadingMessage?: string;
}

export function CategoryAutocompleteInput({
  value,
  onChange,
  accountSlug,
  fallback = [],
  suggestionsLimit,
  className,
  disabled,
  placeholder = "Ketik kategori",
  emptyMessage = "Tidak ada kategori.",
  loadingMessage = "Memuat...",
  ...inputProps
}: CategoryAutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value ?? "");

  useEffect(() => {
    setSearch(value ?? "");
  }, [value]);

  const { suggestions, isLoading } = useCategorySuggestions({
    accountSlug,
    search,
    limit: suggestionsLimit,
    fallback: Array.from(new Set(fallback)).filter(Boolean),
  });

  const displaySuggestions = useMemo(() => {
    if (!search.trim()) {
      return suggestions;
    }

    const lowered = search.trim().toLowerCase();
    const combined = new Set<string>();
    suggestions.forEach((item) => combined.add(item));
    if (!combined.has(search.trim())) {
      combined.add(search.trim());
    }
    return Array.from(combined).filter((item) => item.toLowerCase().startsWith(lowered));
  }, [suggestions, search]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Input
          value={value}
          onChange={(event) => {
            const nextValue = event.target.value;
            setSearch(nextValue);
            onChange(nextValue);
          }}
          onFocus={() => setOpen(true)}
          disabled={disabled}
          placeholder={placeholder}
          className={cn("rounded-2xl", className)}
          autoComplete="off"
          {...inputProps}
        />
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start" sideOffset={4} collisionPadding={8}>
        <Command>
          <CommandInput
            value={search}
            onValueChange={(next) => {
              setSearch(next);
              if (value !== next) {
                onChange(next);
              }
            }}
            placeholder="Cari kategori..."
          />
          <CommandList>
            <CommandEmpty>{isLoading ? loadingMessage : emptyMessage}</CommandEmpty>
            <CommandGroup heading="Kategori tersedia">
              {displaySuggestions.map((item) => (
                <CommandItem
                  key={item}
                  onSelect={(selected) => {
                    onChange(selected);
                    setSearch(selected);
                    setOpen(false);
                  }}
                >
                  {item}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
