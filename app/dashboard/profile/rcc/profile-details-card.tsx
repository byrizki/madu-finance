"use client";

import { useState } from "react";

import { Loader2, LogOut, Pencil, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProfileMember } from "./profile-types";
interface ProfileDetailsCardProps {
  isLoading: boolean;
  currentMember: ProfileMember | null;
  onEdit: () => void;
  onChangePassword: () => void;
  onSignOut: () => Promise<void> | void;
  isSigningOut: boolean;
}

export function ProfileDetailsCard({
  isLoading: loading,
  currentMember,
  onEdit,
  onChangePassword,
  onSignOut,
  isSigningOut,
}: ProfileDetailsCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isLoading = loading || !currentMember?.name;

  const handleConfirmLogout = async () => {
    await onSignOut();
    setConfirmOpen(false);
  };

  return (
    <Card className="rounded-3xl border border-border/60">
      <CardContent className="space-y-6">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <DetailsTile
            label="Nama lengkap"
            value={currentMember?.name ?? "-"}
            isLoading={isLoading}
            loadingWidth="w-32"
          />
          <DetailsTile
            label="Email utama"
            value={currentMember?.email ?? "-"}
            isLoading={isLoading}
            loadingWidth="w-48"
            isEmail
          />
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            size="sm"
            className="flex items-center justify-center gap-2 rounded-full border border-border/70 px-4 py-2.5 text-sm font-semibold"
            onClick={onEdit}
            disabled={isLoading}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit profil
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="flex items-center justify-center gap-2 rounded-full border border-border/70 px-4 py-2.5 text-sm font-semibold"
            onClick={onChangePassword}
            disabled={isLoading}
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Ubah kata sandi
          </Button>
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="flex items-center justify-center gap-2 rounded-full border border-border/70 px-4 py-2.5 text-sm font-semibold"
                disabled={isSigningOut || isLoading}
              >
                {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                {isSigningOut ? "Tunggu ya..." : "Logout"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl border border-border/60">
              <AlertDialogHeader>
                <AlertDialogTitle>Konfirmasi keluar</AlertDialogTitle>
                <AlertDialogDescription>
                  Anda akan keluar dari Kas dan perlu masuk kembali untuk mengakses dashboard.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction className="rounded-full" onClick={handleConfirmLogout} disabled={isSigningOut}>
                  {isSigningOut ? "Tunggu ya..." : "Ya, logout"}
                </AlertDialogAction>
                <AlertDialogCancel className="rounded-full">Batal</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

interface DetailsTileProps {
  label: string;
  value: string;
  isLoading: boolean;
  loadingWidth: string;
  isEmail?: boolean;
}

function DetailsTile({ label, value, isLoading, loadingWidth, isEmail }: DetailsTileProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {isLoading ? (
        <Skeleton className={`mt-1 h-4 ${loadingWidth}`} />
      ) : (
        <p className={`mt-1 text-sm font-semibold text-foreground ${isEmail ? "break-all" : ""}`}>{value}</p>
      )}
    </div>
  );
}
