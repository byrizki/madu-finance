"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import { submitCreateAccount, submitEditAccountDetails } from "@/app/dashboard/profile/rcc/profile-service";

const createAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nama Kas minimal 3 karakter")
    .max(40, "Nama Kas maksimal 40 karakter"),
});

type CreateAccountFormValues = z.infer<typeof createAccountSchema>;

interface NoAccountOverlayProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void | Promise<void>;
  actionLoading?: boolean;
  className?: string;
}

export function NoAccountOverlay({
  title = "Belum ada Kas",
  description = "Buat atau pilih Kas dari halaman Profil sebelum mengelola dompet dan cicilan.",
  actionLabel = "Buat Kas",
  actionHref,
  onAction,
  actionLoading = false,
  className,
}: NoAccountOverlayProps) {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultAction = !actionHref && !onAction;
  const effectiveActionLoading = defaultAction ? isSubmitting : actionLoading;

  const form = useForm<CreateAccountFormValues>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: { name: "Kas Pertamaku" },
  });

  const isLinkAction = Boolean(actionHref);

  const resetForm = () => {
    form.reset({ name: "Kas Pertamaku" });
    form.clearErrors();
  };

  const handleDefaultAction = () => {
    setDialogOpen(true);
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitCreateAccount();
      const accountName = values.name.trim();

      if (result.created && result.accountSlug && accountName) {
        try {
          await submitEditAccountDetails(result.accountSlug, { name: accountName });
        } catch (renameError) {
          console.error("Failed to update default account name", renameError);
        }
      }

      await Promise.all([
        refreshSession(),
        queryClient.invalidateQueries({ queryKey: ["member-accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["account-details"] }),
        queryClient.invalidateQueries({ queryKey: ["account-members"] }),
        result.accountSlug
          ? queryClient.invalidateQueries({ queryKey: ["account-details", result.accountSlug] })
          : Promise.resolve(),
      ]);

      toast.success(result.created ? "Kas baru siap dipakai" : "Kas sudah tersedia", {
        description: result.created && accountName ? `${accountName} sudah aktif.` : undefined,
      });

      setDialogOpen(false);
      resetForm();

      router.push(result.accountSlug ? `/dashboard/${result.accountSlug}` : "/dashboard");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal membuat Kas baru.";
      toast.error("Kesalahan", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <>
      <div
        className={cn(
          "flex w-full flex-col items-center gap-6 rounded-3xl border border-border/70 bg-gradient-to-br from-background/95 via-card to-muted/60 px-6 py-10 text-center shadow-[0_20px_45px_-35px_rgba(15,23,42,0.35)] sm:max-w-lg sm:px-9",
          className,
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">{title}</h2>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        {isLinkAction ? (
          <Button asChild size="lg" className="h-auto rounded-full px-6 py-2.5 text-sm font-semibold shadow-sm">
            <Link href={actionHref ?? "#"}>{actionLabel}</Link>
          </Button>
        ) : (
          <Button
            size="lg"
            className="h-auto rounded-full px-6 py-2.5 text-sm font-semibold shadow-sm transition-shadow hover:shadow-md"
            onClick={defaultAction ? handleDefaultAction : onAction}
            disabled={effectiveActionLoading}
          >
            {effectiveActionLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Membuat Kas...
              </>
            ) : (
              actionLabel
            )}
          </Button>
        )}
      </div>

      {defaultAction ? (
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setIsSubmitting(false);
              resetForm();
            }
          }}
        >
          <DialogContent className="rounded-3xl border border-border/60 p-8">
            <DialogHeader className="space-y-3 text-center">
              <DialogTitle className="text-xl font-semibold">Beri nama Kas pertamamu</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Kas akan dibuat otomatis dengan data awal. Kamu bisa ganti namanya kapan pun dari halaman profil.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="text-left">
                      <FormLabel>Nama Kas</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Contoh: Kas Rumah Tangga" autoFocus disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="gap-3">
                  <Button type="submit" className="rounded-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Membuat...
                      </>
                    ) : (
                      "Buat Kas"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Batal
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
