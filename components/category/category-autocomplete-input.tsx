"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentProps } from "react";

import { Check, Loader2, Plus, Search, Tag, X } from "lucide-react";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCategorySuggestions } from "@/hooks/use-category-suggestions";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const highlightMatch = (text: string, query: string) => {
  if (!query.trim()) {
    return text;
  }

  const pattern = new RegExp(`(${escapeRegExp(query)})`, "gi");
  const segments = text.split(pattern);

  return segments.map((segment, index) => {
    const isHighlight = segment.toLowerCase() === query.toLowerCase();

    if (!segment) {
      return null;
    }

    return isHighlight ? (
      <span key={`highlight-${segment}-${index}`} className="font-semibold text-foreground">
        {segment}
      </span>
    ) : (
      <span key={`text-${segment}-${index}`}>{segment}</span>
    );
  });
};

interface CategoryAutocompleteInputProps
  extends Omit<ComponentProps<typeof Input>, "value" | "onChange" | "defaultValue"> {
  value: string;
  onChange: (value: string) => void;
  accountSlug?: string;
  transactionType?: "income" | "expense";
  fallback?: ReadonlyArray<string>;
  suggestionsLimit?: number;
  emptyMessage?: string;
  loadingMessage?: string;
}

export function CategoryAutocompleteInput({
  value,
  onChange,
  accountSlug,
  transactionType,
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
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [anchorWidth, setAnchorWidth] = useState<number>();

  useLayoutEffect(() => {
    const element = anchorRef.current;
    if (!element) {
      return;
    }

    const updateWidth = () => setAnchorWidth(element.offsetWidth);
    updateWidth();

    const resizeObserver = new ResizeObserver(() => updateWidth());
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    setSearch(value ?? "");
  }, [value]);

  const { suggestions, isLoading } = useCategorySuggestions({
    accountSlug,
    search,
    transactionType,
    limit: suggestionsLimit,
    fallback: Array.from(new Set(fallback)).filter(Boolean),
  });

  const normalizedSearch = search.trim();
  const normalizedLower = normalizedSearch.toLowerCase();

  const uniqueSuggestions = useMemo(() => {
    const unique = new Set<string>();

    suggestions.forEach((item) => {
      const trimmed = item.trim();
      if (trimmed) {
        unique.add(trimmed);
      }
    });

    if (normalizedSearch && !unique.has(normalizedSearch)) {
      unique.add(normalizedSearch);
    }

    return Array.from(unique);
  }, [suggestions, normalizedSearch]);

  const filteredSuggestions = useMemo(() => {
    if (!normalizedSearch) {
      return uniqueSuggestions;
    }

    return uniqueSuggestions.filter((item) => item.toLowerCase().includes(normalizedLower));
  }, [uniqueSuggestions, normalizedLower]);

  const hasExactMatch = normalizedSearch
    ? uniqueSuggestions.some((item) => item.toLowerCase() === normalizedLower)
    : false;

  const handleSelect = (selected: string) => {
    onChange(selected);
    setSearch(selected);
    setOpen(false);
  };

  const normalizedCurrentValue = value.trim().toLowerCase();

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverAnchor asChild>
        <div ref={anchorRef} className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value}
            onChange={(event) => {
              const nextValue = event.target.value;
              setSearch(nextValue);
              onChange(nextValue);
              if (!open) {
                setOpen(true);
              }
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setOpen(true);
              }

              if (event.key === "Escape") {
                setOpen(false);
              }
            }}
            disabled={disabled}
            placeholder={placeholder}
            className={cn(
              "rounded-2xl border border-border/60 bg-background/70 pl-11 pr-12 py-2 text-sm shadow-sm transition-shadow focus-visible:border-primary/40 focus-visible:ring-primary/30",
              disabled && "opacity-70",
              className
            )}
            autoComplete="off"
            {...inputProps}
          />
          <div className="absolute inset-y-0 right-3 flex items-center gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {Boolean(value) && !disabled && (
              <button
                type="button"
                aria-label="Hapus kategori"
                className="rounded-full bg-transparent p-1 text-muted-foreground transition-colors hover:text-foreground"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setSearch("");
                  onChange("");
                  setOpen(true);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="rounded-2xl border border-border/70 bg-background/95 p-2 shadow-xl backdrop-blur"
        align="start"
        sideOffset={8}
        collisionPadding={8}
        style={{ width: anchorWidth ? `${anchorWidth}px` : undefined }}
      >
        <Command shouldFilter={false} className="max-h-64">
          <CommandInput
            value={search}
            onValueChange={(next) => {
              setSearch(next);
              if (value !== next) {
                onChange(next);
              }
            }}
            placeholder="Cari kategori..."
            className="h-10 text-sm"
          />
          <CommandList className="max-h-48 overflow-y-auto">
            <CommandEmpty>
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>{loadingMessage}</span>
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    <span>{emptyMessage}</span>
                  </>
                )}
              </div>
            </CommandEmpty>

            {filteredSuggestions.length > 0 && (
              <CommandGroup heading="Kategori tersedia" className="mt-1">
                {filteredSuggestions.map((item) => (
                  <CommandItem
                    key={item}
                    value={item}
                    onSelect={() => handleSelect(item)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm data-[selected=true]:bg-primary/10 data-[selected=true]:text-foreground"
                  >
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-left">{highlightMatch(item, normalizedSearch)}</span>
                    {normalizedCurrentValue === item.toLowerCase() && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {normalizedSearch && !hasExactMatch && (
              <CommandGroup heading="Tindakan cepat" className="mt-2 border-t border-border/60 pt-2">
                <CommandItem
                  value={normalizedSearch}
                  onSelect={() => handleSelect(normalizedSearch)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-primary hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4" />
                  <span className="flex-1 text-left">
                    Tambah kategori
                    <span className="ml-1 font-semibold">“{normalizedSearch}”</span>
                  </span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
