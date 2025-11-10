"use client";

import { useEffect } from "react";

import { useForm } from "react-hook-form";

import { ModalShell } from "@/components/dashboard/modal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ChangePasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

interface ProfileChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (newPassword: string) => Promise<void> | void;
  submitting: boolean;
  isMobile: boolean;
}

export function ProfileChangePasswordDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
  isMobile,
}: ProfileChangePasswordDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!open) {
      reset({ newPassword: "", confirmPassword: "" });
    }
  }, [open, reset]);

  const submitHandler = handleSubmit(async ({ newPassword, confirmPassword }) => {
    const trimmedPassword = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (trimmedPassword.length < 8) {
      setError("newPassword", { type: "validate", message: "Minimal 8 karakter untuk keamanan Kas." });
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      setError("confirmPassword", { type: "validate", message: "Konfirmasi kata sandi tidak cocok." });
      return;
    }

    await onSubmit(trimmedPassword);
    reset({ newPassword: "", confirmPassword: "" });
    onOpenChange(false);
  });

  const handleOpenChange = (value: boolean) => {
    onOpenChange(value);
    if (!value) {
      reset({ newPassword: "", confirmPassword: "" });
    }
  };

  const header = (
    <div className="space-y-1 text-left">
      <h2 className="text-lg font-semibold text-foreground">Ubah kata sandi</h2>
      <p className="text-sm text-muted-foreground">Kata sandi baru minimal 8 karakter dan berbeda dari sebelumnya.</p>
    </div>
  );

  const footer = (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <Button type="submit" form="change-password-form" disabled={submitting || isSubmitting} className="w-full sm:w-auto">
        {submitting || isSubmitting ? "Mengubah..." : "Simpan kata sandi"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => onOpenChange(false)}
        disabled={submitting || isSubmitting}
        className="w-full sm:w-auto"
      >
        Batal
      </Button>
    </div>
  );

  return (
    <ModalShell
      open={open}
      onOpenChange={handleOpenChange}
      title="Ubah kata sandi"
      description="Kata sandi baru minimal 8 karakter dan berbeda dari sebelumnya."
      header={header}
      footer={footer}
    >
      <form id="change-password-form" onSubmit={submitHandler} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-password">Kata sandi baru</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
            disabled={submitting || isSubmitting}
            {...register("newPassword", { required: "Kata sandi baru wajib diisi" })}
          />
          {errors.newPassword ? <p className="text-xs text-destructive">{errors.newPassword.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Konfirmasi kata sandi</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="Masukkan ulang kata sandi"
            disabled={submitting || isSubmitting}
            {...register("confirmPassword", { required: "Konfirmasi kata sandi wajib diisi" })}
          />
          {errors.confirmPassword ? <p className="text-xs text-destructive">{errors.confirmPassword.message}</p> : null}
        </div>
      </form>
    </ModalShell>
  );
}
