"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UnauthorizedAccessDialogProps {
  open: boolean;
  onRedirect: () => void;
  description?: string;
  acknowledgeLabel?: string;
}

export function UnauthorizedAccessDialog({
  open,
  onRedirect,
  description = "Anda tidak memiliki akses ke Kas ini. Kembali ke akun utama untuk melanjutkan.",
  acknowledgeLabel = "Kembali ke akun saya",
}: UnauthorizedAccessDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-sm sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Akses akun terbatas</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onRedirect}>{acknowledgeLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
