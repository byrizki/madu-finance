"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { MaskedValue } from "@/components/dashboard/masked-value";
import type { WalletItem } from "@/hooks/use-wallets";
import { Minus, Plus, Wallet } from "lucide-react";

import WalletEmpty from "./wallet-empty";
import WalletLoading from "./wallet-loading";
import { getWalletColor, walletIcon, walletTypeLabel } from "./wallet-utils";

interface WalletAccountsTabProps {
  walletsLoading: boolean;
  walletList: WalletItem[];
  onAddWallet: () => void;
  onIncrease: (wallet: WalletItem) => void;
  onDecrease: (wallet: WalletItem) => void;
}

function WalletAccountsTab({ walletsLoading, walletList, onAddWallet, onIncrease, onDecrease }: WalletAccountsTabProps) {
  const groupedWallets = useMemo(() => {
    const groups = new Map<string, WalletItem[]>();
    walletList.forEach((wallet) => {
      const list = groups.get(wallet.type) ?? [];
      list.push(wallet);
      groups.set(wallet.type, list);
    });
    return Array.from(groups.entries());
  }, [walletList]);

  const isWalletsEmpty = !walletsLoading && walletList.length === 0;

  if (walletsLoading) {
    return <WalletLoading />;
  }

  if (isWalletsEmpty) {
    return <WalletEmpty openAddWallet={onAddWallet} walletsLoading={walletsLoading} />;
  }

  return (
    <div className="space-y-4">
      {groupedWallets.map(([type, list]) => {
        const label = walletTypeLabel[type] ?? type;
        const Icon = walletIcon[type] ?? Wallet;

        return (
          <section key={type} className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Icon className="h-4.5 w-4.5 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">{label}</h2>
              </div>
              <span className="text-[11px] text-muted-foreground">{list.length} akun siap dipakai</span>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {list.map((wallet, index) => {
                const AccentIcon = walletIcon[wallet.type] ?? Wallet;
                const accentColor = getWalletColor(wallet.color, index);
                const displayProvider = wallet.provider ?? "";
                const displayAccount = wallet.accountNumber ?? "";
                const balanceColor = wallet.balance >= 0 ? "text-emerald-600" : "text-red-600";

                return (
                  <Card
                    key={wallet.id}
                    className="border border-border/60 bg-card/80 shadow-none transition-transform hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <CardContent className="flex flex-col gap-3 p-3.5">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-full ${accentColor} text-white`}>
                          <AccentIcon className="h-4.5 w-4.5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">{wallet.name}</p>
                            <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[11px]">
                              {walletTypeLabel[wallet.type] ?? wallet.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {[displayProvider, displayAccount].filter(Boolean).join(" • ") || "Belum ada info tambahan"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Saldo sekarang</span>
                        <MaskedValue className={`text-xl font-semibold ${balanceColor}`} value={wallet.balance} />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full px-2.5"
                          onClick={() => onIncrease(wallet)}
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          Tambah
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full px-2.5"
                          onClick={() => onDecrease(wallet)}
                        >
                          <Minus className="mr-1 h-3.5 w-3.5" />
                          Kurangi
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default WalletAccountsTab;
