"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Wallet } from "lucide-react";

export default function WalletEmpty({ openAddWallet, walletsLoading }: { openAddWallet: () => void; walletsLoading: boolean }) {
  return (
    <Card className="border border-dashed border-border/60 bg-card/60 shadow-none">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
          <Wallet className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Belum ada dompet yang nyangkut</p>
          <p className="text-sm">Bikin dompet pertama kamu biar saldo langsung kepantau.</p>
        </div>
        <Button disabled={walletsLoading} size="sm" className="rounded-full" onClick={openAddWallet}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah dompet sekarang
        </Button>
      </CardContent>
    </Card>
  );
}
