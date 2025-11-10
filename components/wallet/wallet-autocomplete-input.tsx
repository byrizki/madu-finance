"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WalletType } from "@/lib/db/types";
import { Search, Wallet, X } from "lucide-react";

interface WalletOption {
  id: string;
  name: string;
  type: WalletType;
  color?: string | null;
  provider?: string | null;
}

interface WalletAutocompleteInputProps {
  wallets: WalletOption[];
  value: string | null;
  onChange: (walletId: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  emptyMessage?: string;
}

export function WalletAutocompleteInput({
  wallets,
  value,
  onChange,
  disabled,
  placeholder = "Pilih dompet",
  emptyMessage = "Tidak ada dompet yang cocok.",
}: WalletAutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
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

  const selectedWallet = useMemo(() => wallets.find((wallet) => wallet.id === value) ?? null, [wallets, value]);

  useEffect(() => {
    setSearch(selectedWallet?.name ?? "");
  }, [selectedWallet]);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredWallets = useMemo(() => {
    if (!normalizedSearch) {
      return wallets;
    }

    return wallets.filter((wallet) => wallet.name.toLowerCase().includes(normalizedSearch));
  }, [wallets, normalizedSearch]);

  const handleSelect = (walletId: string) => {
    onChange(walletId);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearch("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverAnchor asChild>
        <div ref={anchorRef} className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              const nextValue = event.target.value;
              setSearch(nextValue);
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
            )}
            autoComplete="off"
            readOnly={disabled}
          />
          <div className="absolute inset-y-0 right-3 flex items-center gap-2">
            {selectedWallet && !disabled ? (
              <button
                type="button"
                aria-label="Hapus pilihan dompet"
                className="rounded-full bg-transparent p-1 text-muted-foreground transition-colors hover:text-foreground"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleClear();
                }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
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
        <Command loop>
          <CommandInput
            placeholder="Cari dompet..."
            value={search}
            onValueChange={(value) => {
              setSearch(value);
            }}
          />
          <CommandList>
            <CommandEmpty>
              <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
                <Wallet className="h-5 w-5" />
                <span>{emptyMessage}</span>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredWallets.map((wallet) => (
                <CommandItem
                  key={wallet.id}
                  value={wallet.id}
                  onSelect={() => handleSelect(wallet.id)}
                  className="flex items-center gap-3 px-3 py-2"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-muted/40">
                    <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                      {wallet.name.slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground/90">{wallet.name}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="rounded-full border-border/60 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                        {wallet.type.replace(/_/g, " ")}
                      </Badge>
                      {wallet.provider ? <span>{wallet.provider}</span> : null}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
