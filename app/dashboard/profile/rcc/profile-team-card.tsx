"use client";

import { useEffect, useMemo, useState } from "react";

import { AlertTriangle, Check, Crown, Edit3, Loader2, MoreVertical, Trash2, UserPlus, Users, X } from "lucide-react";
import { useForm } from "react-hook-form";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

import { ModalShell } from "@/components/dashboard/modal-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { censorEmail } from "@/utils/censor-email";
import { checkAccountSlugAvailability } from "./profile-service";

export interface ProfileTeamAccountMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "member";
}

export interface InviteFormValues {
  email: string;
}

export interface EditAccountFormValues {
  name: string;
  slug: string;
}

export interface ProfileTeamAccount {
  id: string;
  slug: string;
  name: string;
  role: "owner" | "member";
  isOwner: boolean;
  isDefault: boolean;
  isCurrent: boolean;
  quickInsight: string;
  monthlyIncome: number;
  monthlyExpense: number;
  members: ProfileTeamAccountMember[];
}

export interface ProfileTeamActionState {
  openingSlug: string | null;
  defaultingSlug: string | null;
  invitingSlug: string | null;
  editingSlug: string | null;
  removingKey: string | null;
}

interface AccountDeletionState {
  memberId: string;
  memberName: string;
  memberEmail: string;
  requiresOwnerTransfer?: boolean;
  isOwnerSelfExit?: boolean;
}

export interface ProfileTeamCardProps {
  isLoading: boolean;
  isRefreshing?: boolean;
  accounts: ProfileTeamAccount[];
  actionState: ProfileTeamActionState;
  onOpenAccount: (slug: string) => void;
  onSetDefaultAccount: (slug: string) => void;
  onInviteMember: (slug: string, email: string) => Promise<void> | void;
  onRemoveMember: (slug: string, memberId: string) => Promise<void> | void;
  onEditAccount: (slug: string, values: { name: string; slug: string }) => Promise<void> | void;
  onSelfExit: (slug: string, memberId: string) => Promise<unknown>;
}

export function ProfileTeamCard({
  isLoading,
  isRefreshing = false,
  accounts,
  actionState,
  onOpenAccount,
  onSetDefaultAccount,
  onInviteMember,
  onRemoveMember,
  onEditAccount,
  onSelfExit,
}: ProfileTeamCardProps) {
  const skeletonCards = useMemo(() => Array.from({ length: 2 }), []);

  return (
    <section className="space-y-5">
      {isLoading && accounts.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {skeletonCards.map((_, index) => (
            <Card key={`account-card-skeleton-${index}`} className="rounded-3xl border border-border/60 p-6">
              <div className="flex flex-col gap-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </Card>
          ))}
        </div>
      ) : accounts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              actionState={actionState}
              onOpenAccount={onOpenAccount}
              onSetDefaultAccount={onSetDefaultAccount}
              onInviteMember={onInviteMember}
              onRemoveMember={onRemoveMember}
              onEditAccount={onEditAccount}
              onSelfExit={onSelfExit}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-3xl border border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">
          <AlertTriangle className="mr-2 h-4 w-4" />
          Tidak ada Kas lain yang tersedia untuk akun Anda.
        </div>
      )}
      {isRefreshing && accounts.length > 0 ? (
        <div className="flex items-center justify-center text-xs text-muted-foreground">
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Memperbarui daftar Kas...
        </div>
      ) : null}
    </section>
  );
}

interface AccountCardProps {
  account: ProfileTeamAccount;
  actionState: ProfileTeamActionState;
  onOpenAccount: (slug: string) => void;
  onSetDefaultAccount: (slug: string) => void;
  onInviteMember: (slug: string, email: string) => Promise<void> | void;
  onRemoveMember: (slug: string, memberId: string) => Promise<void> | void;
  onEditAccount: (slug: string, values: { name: string; slug: string }) => Promise<void> | void;
  onSelfExit: (slug: string, memberId: string) => Promise<unknown>;
}

function AccountCard({
  account,
  actionState,
  onOpenAccount,
  onSetDefaultAccount,
  onInviteMember,
  onRemoveMember,
  onEditAccount,
  onSelfExit,
}: AccountCardProps) {
  const { user } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [focusedMemberId, setFocusedMemberId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<AccountDeletionState | null>(null);
  const [selfExitState, setSelfExitState] = useState<AccountDeletionState | null>(null);
  const [defaultConfirmOpen, setDefaultConfirmOpen] = useState(false);
  const [slugStatus, setSlugStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string | null;
  }>({ checking: false, available: null, message: null });
  const isMobile = useIsMobile();

  const {
    register: registerInvite,
    handleSubmit: handleInviteSubmit,
    reset: resetInvite,
    formState: { errors: inviteErrors, isSubmitting: inviteSubmitting },
  } = useForm<InviteFormValues>({
    defaultValues: { email: "" },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    watch,
    formState: { errors: editErrors, isSubmitting: editSubmitting },
  } = useForm<EditAccountFormValues>({
    defaultValues: { name: account.name, slug: account.slug },
  });

  const watchedSlug = watch("slug");

  const inviteLoading = actionState.invitingSlug === account.slug || inviteSubmitting;
  const editing = actionState.editingSlug === account.slug || editSubmitting;
  const opening = actionState.openingSlug === account.slug;
  const defaulting = actionState.defaultingSlug === account.slug;
  const confirmOpen = Boolean(confirmState);
  const isRemovingSelected = confirmState
    ? actionState.removingKey === `${account.slug}:${confirmState.memberId}`
    : false;

  const submitInvite = handleInviteSubmit(async (values) => {
    const email = values.email.trim();
    if (!email) {
      return;
    }
    try {
      await onInviteMember(account.slug, email);
      resetInvite({ email: "" });
      setInviteOpen(false);
    } catch (error) {
      // allow parent to surface error via toast, keep dialog open
    }
  });

  const submitEdit = handleEditSubmit(async (values) => {
    const payload = {
      name: values.name.trim(),
      slug: values.slug.trim(),
    };
    if (!payload.name) {
      return;
    }

    if (!payload.slug) {
      return;
    }

    if (payload.slug !== account.slug && slugStatus.available === false) {
      return;
    }

    try {
      await onEditAccount(account.slug, payload);
      resetEdit({ name: payload.name, slug: payload.slug });
      setEditOpen(false);
      setSlugStatus({ checking: false, available: null, message: null });
    } catch (error) {
      // parent handles error presentation
    }
  });

  const members = useMemo(
    () =>
      account.members.map((member) => ({
        ...member,
        initials:
          member.name
            .split(" ")
            .map((part) => part.charAt(0).toUpperCase())
            .filter(Boolean)
            .slice(0, 2)
            .join("") || member.name.charAt(0).toUpperCase(),
        censoredEmail: censorEmail(member.email),
      })),
    [account.members]
  );
  const canManageMembers = account.isOwner;
  const currentUserId = user?.id ?? null;

  const focusedMember = focusedMemberId ? members.find((member) => member.id === focusedMemberId) ?? null : null;

  const handleToggleMember = (memberId: string) => {
    setFocusedMemberId((prev) => (prev === memberId ? null : memberId));
  };

  const handleRemoveMember = (memberId: string) => {
    setFocusedMemberId((prev) => (prev === memberId ? null : prev));
    const member = members.find((item) => item.id === memberId);
    if (member) {
      setConfirmState({ memberId, memberName: member.name, memberEmail: member.censoredEmail });
    } else {
      onRemoveMember(account.slug, memberId);
    }
  };

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const evaluateSlug = async () => {
      const candidate = String(watchedSlug ?? "").trim();
      if (!candidate) {
        if (active) {
          setSlugStatus({ checking: false, available: null, message: null });
        }
        return;
      }

      if (candidate === account.slug) {
        if (active) {
          setSlugStatus({ checking: false, available: true, message: "Tautan saat ini sudah digunakan oleh Kas ini." });
        }
        return;
      }

      setSlugStatus((prev) => ({ ...prev, checking: true }));
      try {
        const result = await checkAccountSlugAvailability(candidate, {
          excludeSlug: account.slug,
          signal: controller.signal,
        });
        if (!active) return;
        setSlugStatus({
          checking: false,
          available: result.available,
          message: result.available ? "Tautan tersedia." : null,
        });
      } catch (error) {
        if (!active) return;
        setSlugStatus({ checking: false, available: null, message: null });
      }
    };

    const debounce = setTimeout(evaluateSlug, 350);

    return () => {
      active = false;
      controller.abort();
      clearTimeout(debounce);
    };
  }, [watchedSlug, account.slug]);

  const handleEditOpenChange = (nextOpen: boolean) => {
    setEditOpen(nextOpen);
    if (nextOpen) {
      resetEdit({ name: account.name, slug: account.slug });
    } else {
      setSlugStatus({ checking: false, available: null, message: null });
    }
  };

  const handleInviteOpenChange = (nextOpen: boolean) => {
    setInviteOpen(nextOpen);
    if (!nextOpen) {
      resetInvite({ email: "" });
    }
  };

  const handleConfirmOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setConfirmState(null);
    }
  };

  return (
    <>
      <Card className="flex h-full flex-col gap-5 rounded-3xl border border-border/60 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row flex-1">
          <div className="space-y-2 flex-1">
            <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between flex-1">
              <div className="flex-1">{account.name}</div>
              {canManageMembers && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="ml-auto rounded-full border border-border/60 sm:ml-0"
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Opsi Kas</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        setEditOpen(true);
                      }}
                    >
                      <Edit3 className="mr-2 h-4 w-4" /> Edit informasi
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        setInviteOpen(true);
                      }}
                    >
                      <UserPlus className="mr-2 h-4 w-4" /> Tambah anggota
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{account.quickInsight}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Anggota</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {account.isDefault ? (
                <Badge variant="default" className="flex items-center gap-1">
                  Default
                </Badge>
              ) : null}
              <Badge variant="outline" className="capitalize">
                <Users className="mr-1 h-3.5 w-3.5" /> {account.role}
              </Badge>
            </div>
          </div>
          {members.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border/60 p-3 text-sm text-muted-foreground">
              Belum ada anggota terdaftar.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {members.map((member) => {
                const isSelected = focusedMemberId === member.id;
                const removing = actionState.removingKey === `${account.slug}:${member.id}`;
                const isCurrentUser = member.id === currentUserId;
                const otherMembers = members.filter((item) => item.id !== member.id);
                const otherMembersCount = otherMembers.length;
                return (
                  <div key={member.id} className="flex">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "flex items-center gap-2 relative rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border/60 bg-muted/10 hover:border-primary/60",
                            removing ? "opacity-60" : ""
                          )}
                          aria-pressed={isSelected}
                          aria-label={`${member.name} (${member.censoredEmail})`}
                          disabled={removing}
                        >
                          <Avatar className="h-10 w-10 border border-border/60 bg-background shadow-sm">
                            <AvatarImage src={`/api/profile/avatar?id=${member.id}`} alt={member.name} />
                            <AvatarFallback className="text-xs font-semibold">{member.initials}</AvatarFallback>
                          </Avatar>
                          {member.role === "owner" ? (
                            <div className="absolute -bottom-2 -left-1 flex items-center justify-center rounded-full bg-gradient-to-tr from-amber-300 via-amber-400 to-amber-500 p-1 shadow-[0_6px_18px_rgba(251,191,36,0.45)] ring ring-amber-200/70">
                              <Crown className="h-3 w-3 text-amber-900 drop-shadow-[0_1px_4px_rgba(0,0,0,0.25)]" />
                            </div>
                          ) : null}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 rounded-xl border border-border/60 bg-background/95 p-3 shadow-lg backdrop-blur">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-10 w-10 border border-border/60 bg-background">
                            <AvatarImage src={`/api/profile/avatar?id=${member.id}`} alt={member.name} />
                            <AvatarFallback className="text-sm font-semibold">{member.initials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 space-y-1">
                            <p className="text-sm font-semibold text-foreground">{member.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{member.censoredEmail}</p>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <Badge
                              variant={member.role === "owner" ? "default" : "outline"}
                              className="px-2 py-0 text-[11px] capitalize"
                            >
                              {member.role}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={
                                isCurrentUser
                                  ? "h-7 w-7 rounded-full border border-border/60 p-0 text-muted-foreground hover:bg-muted/10"
                                  : "h-7 w-7 rounded-full border border-border/60 p-0 text-destructive hover:bg-destructive/10"
                              }
                              aria-label={isCurrentUser ? "Keluar dari Kas ini" : `Hapus akses ${member.name}`}
                              onClick={() =>
                                isCurrentUser
                                  ? setSelfExitState({
                                      memberId: member.id,
                                      memberName: member.name,
                                      memberEmail: member.censoredEmail,
                                      isOwnerSelfExit: member.role === "owner",
                                      requiresOwnerTransfer:
                                        member.role === "owner" && otherMembersCount === 0,
                                    })
                                  : setConfirmState({
                                      memberId: member.id,
                                      memberName: member.name,
                                      memberEmail: member.censoredEmail,
                                    })
                              }
                              disabled={
                                (!canManageMembers && !isCurrentUser) ||
                                (!isCurrentUser && member.role === "owner") ||
                                actionState.removingKey === `${account.slug}:${member.id}`
                              }
                            >
                              {actionState.removingKey === `${account.slug}:${member.id}` ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : isCurrentUser ? (
                                <X className="h-3.5 w-3.5" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-auto flex flex-row gap-2 pt-2">
          <Button
            size="sm"
            className="justify-center flex-1"
            onClick={() => onOpenAccount(account.slug)}
            disabled={account.isCurrent || opening}
          >
            {opening ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {account.isCurrent ? "Aktif" : "Buka Kas"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="justify-center flex-1"
            onClick={() => {
              if (account.isDefault) {
                return;
              }
              setDefaultConfirmOpen(true);
            }}
            disabled={defaulting || account.isDefault}
          >
            {defaulting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {defaulting ? "Mengatur..." : account.isDefault ? "Kas Default" : "Jadikan Kas default"}
          </Button>
        </div>
      </Card>

      <ModalShell
        open={defaultConfirmOpen}
        onOpenChange={setDefaultConfirmOpen}
        title="Jadikan Kas ini sebagai default?"
        description="Kas default akan dibuka otomatis setiap kali Anda masuk. Anda masih dapat mengganti Kas kapan saja setelah masuk."
      >
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={async () => {
              try {
                await onSetDefaultAccount(account.slug);
                setDefaultConfirmOpen(false);
              } catch (error) {
                // Parent handler displays feedback, keep dialog open for retry
              }
            }}
            disabled={defaulting}
          >
            {defaulting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengatur...
              </>
            ) : (
              "Jadikan default"
            )}
          </Button>
          <Button variant="outline" onClick={() => setDefaultConfirmOpen(false)} disabled={defaulting}>
            Batal
          </Button>
        </div>
      </ModalShell>

      <ModalShell
        open={editOpen}
        onOpenChange={handleEditOpenChange}
        title="Edit informasi Kas"
        description="Perbarui nama dan tautan Kas. Tautan digunakan pada URL dashboard."
      >
        <form className="space-y-4" onSubmit={submitEdit}>
            <div className="space-y-2">
              <Label htmlFor={`account-name-${account.id}`}>Nama Kas</Label>
              <Input
                id={`account-name-${account.id}`}
                placeholder="Nama Kas"
                {...registerEdit("name", {
                  required: "Nama wajib diisi",
                })}
                disabled={editing}
              />
              {editErrors.name ? <p className="text-xs text-destructive">{editErrors.name.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`account-slug-${account.id}`}>Tautan Kas</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  @
                </span>
                <Input
                  id={`account-slug-${account.id}`}
                  placeholder="contoh-kas"
                  className={cn(
                    "pl-7 pr-10",
                    slugStatus.available === false ? "border-destructive focus-visible:ring-destructive" : "",
                    slugStatus.available && !slugStatus.checking
                      ? "border-emerald-500 focus-visible:ring-emerald-500"
                      : ""
                  )}
                  {...registerEdit("slug", {
                    required: "Tautan wajib diisi",
                    pattern: {
                      value: /^[a-z0-9-]+$/,
                      message: "Tautan hanya boleh berisi huruf kecil, angka, dan tanda hubung",
                    },
                  })}
                  disabled={editing}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {slugStatus.checking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : slugStatus.available === false ? (
                    <X className="h-4 w-4 text-destructive" />
                  ) : slugStatus.available ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : null}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Gunakan huruf kecil, angka, dan tanda hubung. Tautan ini menentukan URL Kas Anda.
              </p>
              {slugStatus.checking ? (
                <p className="text-xs text-muted-foreground">Memeriksa ketersediaan tautan…</p>
              ) : null}
              {slugStatus.available === false ? (
                <p className="text-xs text-destructive">Tautan sudah digunakan. Silakan pilih tautan lain.</p>
              ) : null}
              {slugStatus.available && slugStatus.message ? (
                <p className="text-xs text-emerald-600">{slugStatus.message}</p>
              ) : null}
              {editErrors.slug ? <p className="text-xs text-destructive">{editErrors.slug.message}</p> : null}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={
                editing ||
                slugStatus.checking ||
                (!!watchedSlug && watchedSlug.trim() !== account.slug && slugStatus.available === false)
              }
            >
              {editing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan perubahan...
                </>
              ) : (
                "Simpan"
              )}
            </Button>
        </form>
      </ModalShell>

      {canManageMembers ? (
        <>
          <ModalShell
            open={inviteOpen}
            onOpenChange={handleInviteOpenChange}
            title="Undang anggota baru"
            description="Tambah anggota baru agar mereka dapat mengakses Kas ini."
          >
            <form className="space-y-4" onSubmit={submitInvite}>
              <div className="space-y-2">
                <Label htmlFor={`invite-email-${account.id}`}>Email</Label>
                <Input
                  id={`invite-email-${account.id}`}
                  type="email"
                  placeholder="nama@perusahaan.com"
                  {...registerInvite("email", {
                    required: "Email wajib diisi",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Format email tidak valid",
                    },
                  })}
                  disabled={inviteLoading}
                />
                {inviteErrors.email ? <p className="text-xs text-destructive">{inviteErrors.email.message}</p> : null}
              </div>
              <Button type="submit" className="w-full" disabled={inviteLoading}>
                {inviteLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menambahkan...
                  </>
                ) : (
                  "Tambahkan anggota"
                )}
              </Button>
            </form>
          </ModalShell>

          <ModalShell
            open={confirmOpen}
            onOpenChange={handleConfirmOpenChange}
            title="Hapus anggota dari Kas?"
            description="Konfirmasi penghapusan akses anggota."
          >
            {confirmState ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Setelah dihapus, {confirmState.memberName} tidak lagi dapat mengakses Kas {account.name}. Anda dapat
                  mengundang kembali anggota ini kapan saja.
                </p>
                <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
                  <p className="text-sm font-semibold text-foreground">{confirmState.memberName}</p>
                  <p className="text-xs text-muted-foreground">{confirmState.memberEmail}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Pilih anggota yang ingin Anda cabut aksesnya.</p>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirmState) {
                    onRemoveMember(account.slug, confirmState.memberId);
                    setConfirmState(null);
                  }
                }}
                disabled={isRemovingSelected || !confirmState}
              >
                {isRemovingSelected ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  "Hapus anggota"
                )}
              </Button>
              <Button variant="outline" onClick={() => setConfirmState(null)}>
                Batal
              </Button>
            </div>
          </ModalShell>
        </>
      ) : null}

      <ModalShell
        open={Boolean(selfExitState)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelfExitState(null);
          }
        }}
        title="Keluar dari Kas ini?"
        description="Kalau keluar sekarang, kamu nggak bakal bisa akses Kas ini lagi kecuali diundang ulang."
      >
        {selfExitState ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {selfExitState.isOwnerSelfExit ? (
                selfExitState.requiresOwnerTransfer
                  ? "Kamu owner terakhir di Kas ini. Kalau lanjut, Kas bakal dihapus bareng semua data di dalamnya."
                  : "Kami bakal oper hak owner ke anggota lain yang paling siap. Kamu bisa diundang lagi kapan aja nanti."
              ) : (
                `Kamu akan meninggalkan Kas ${account.name}. Semua catatan dan data tetap aman buat anggota lain.`
              )}
            </p>
            <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
              <p className="text-sm font-semibold text-foreground">{selfExitState.memberName}</p>
              <p className="text-xs text-muted-foreground">{selfExitState.memberEmail}</p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="destructive"
                type="button"
                onClick={async () => {
                  if (!selfExitState) {
                    return;
                  }

                  try {
                    await onSelfExit(account.slug, selfExitState.memberId);
                    setSelfExitState(null);
                  } catch (error) {
                    // Error handled via toast in parent handler; keep dialog open for retry
                  }
                }}
                disabled={actionState.removingKey === `${account.slug}:${selfExitState.memberId}`}
              >
                {actionState.removingKey === `${account.slug}:${selfExitState.memberId}` ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Lagi keluar...
                  </>
                ) : (
                  "Ya, keluar sekarang"
                )}
              </Button>
              <Button variant="outline" onClick={() => setSelfExitState(null)}>
                Batal
              </Button>
            </div>
          </div>
        ) : null}
      </ModalShell>
    </>
  );
}
