"use client";

import { useEffect } from "react";

import { useForm } from "react-hook-form";

import { ModalShell } from "@/components/dashboard/modal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditProfileFormValues {
  name: string;
  email: string;
}

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues: EditProfileFormValues;
  onSubmit: (values: EditProfileFormValues) => Promise<void> | void;
  submitting: boolean;
  isMobile: boolean;
}

export function ProfileEditDialog({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  submitting,
  isMobile,
}: ProfileEditDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditProfileFormValues>({
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset, open]);

  const submitHandler = handleSubmit(async (values) => {
    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
    };
    await onSubmit(payload);
  });

  const handleOpenChange = (value: boolean) => {
    onOpenChange(value);
    if (!value) {
      reset(defaultValues);
    }
  };

  const header = (
    <div className="space-y-1 text-left">
      <h2 className="text-lg font-semibold text-foreground">Edit profil</h2>
      <p className="text-sm text-muted-foreground">Perbarui detail profil Anda untuk menjaga informasi tetap akurat.</p>
    </div>
  );

  const footer = (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <Button type="submit" form="profile-edit-form" disabled={submitting || isSubmitting} className="w-full sm:w-auto">
        {submitting || isSubmitting ? "Menyimpan..." : "Simpan perubahan"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => handleOpenChange(false)}
        disabled={submitting || isSubmitting}
        className="w-full sm:w-auto"
      >
        Batal
      </Button>
    </div>
  );

  const formContent = (
    <form id="profile-edit-form" onSubmit={submitHandler} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="profile-name">Nama lengkap</Label>
        <Input
          id="profile-name"
          placeholder="Nama Anda"
          autoComplete="name"
          {...register("name", {
            required: "Nama wajib diisi",
            minLength: { value: 2, message: "Nama terlalu pendek" },
          })}
          disabled={submitting || isSubmitting}
        />
        {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-email">Email utama</Label>
        <Input
          id="profile-email"
          type="email"
          placeholder="email@contoh.com"
          autoComplete="email"
          {...register("email", {
            required: "Email wajib diisi",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Format email tidak valid",
            },
          })}
          disabled={submitting || isSubmitting}
        />
        {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
      </div>
    </form>
  );

  return (
    <ModalShell
      open={open}
      onOpenChange={handleOpenChange}
      title="Edit profil"
      description="Perbarui detail profil Anda. Perubahan akan diterapkan pada sesi berikutnya."
      header={header}
      footer={footer}
    >
      {formContent}
    </ModalShell>
  );
}
