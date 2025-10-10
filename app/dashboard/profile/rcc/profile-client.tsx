"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMember } from "@/components/context/member-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { useMemberAccounts } from "@/hooks/use-member-accounts";
import { useAuth } from "@/components/providers/auth-provider";
import { ProfileTeamCard, type ProfileTeamAccount, type ProfileTeamActionState } from "./profile-team-card";
import { ProfileChangePasswordDialog } from "./profile-change-password-dialog";
import { ProfileDetailsCard } from "./profile-details-card";
import { createProfileShimmerStyle, getMemberInitials } from "./profile-utils";
import type { ProfileMember, ProfileSharedAccount } from "./profile-types";
import {
  submitChangePassword,
  submitSwitchAccount,
  submitSetDefaultAccount,
  submitInviteMemberToAccount,
  submitRemoveMemberFromAccount,
  submitEditAccountDetails,
  submitSelfExit,
  submitCreateAccount,
} from "./profile-service";
import { useQueryClient } from "@tanstack/react-query";
import { ProfileHeaderCard } from "./profile-header-card";
import { ProfileEditDialog } from "./profile-edit-dialog";
import { NoAccountOverlay } from "@/components/no-account-overlay";

function mapSharedAccount(account: { id: string; slug: string; name: string }): ProfileSharedAccount {
  return {
    id: account.id,
    slug: account.slug,
    name: account.name,
  };
}

function mapMember(member: {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "owner" | "member";
}): ProfileMember {
  return {
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
  };
}

export default function ProfileClient() {
  const {
    currentMember,
    sharedAccount,
    isLoading: fetchLoading,
    removeMember,
    addMember,
    updateMemberProfile,
  } = useMember();
  const isMounted = useIsMounted();
  const isMobile = useIsMobile();
  const shimmerStyle = createProfileShimmerStyle();
  const router = useRouter();
  const { refreshSession, signOut } = useAuth();
  const {
    accounts: memberAccounts,
    isLoading: accountsLoading,
    isFetching: accountsFetching,
    isRefetching: accountsRefetching,
  } = useMemberAccounts();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changePasswordSubmitting, setChangePasswordSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [actionState, setActionState] = useState<ProfileTeamActionState>({
    openingSlug: null,
    defaultingSlug: null,
    invitingSlug: null,
    editingSlug: null,
    removingKey: null,
  });

  const isLoading = !isMounted || fetchLoading || !currentMember;
  const isHydratingAccounts = accountsLoading && (!memberAccounts || memberAccounts.length === 0);
  const accountsBusy = accountsFetching || accountsRefetching;
  const mappedMember = currentMember?.name ? mapMember(currentMember) : null;
  const mappedAccount = sharedAccount?.name ? mapSharedAccount(sharedAccount) : null;
  const teamAccounts: ProfileTeamAccount[] = useMemo(() => {
    if (!memberAccounts) {
      return [];
    }

    return memberAccounts
      .filter((account) => account.slug)
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
      .map((account) => ({
        id: account.id,
        slug: account.slug,
        name: account.name,
        role: account.role,
        isOwner: account.isOwner,
        isDefault: account.isDefault,
        isCurrent: mappedAccount ? account.slug === mappedAccount.slug : false,
        quickInsight: account.quickInsight,
        monthlyIncome: account.monthlyIncome,
        monthlyExpense: account.monthlyExpense,
        members: account.members ?? [],
      }));
  }, [memberAccounts, mappedAccount]);

  const handleEditSubmit = async (values: { name: string; email: string }) => {
    if (!currentMember) {
      return;
    }

    setEditSubmitting(true);
    try {
      await updateMemberProfile(currentMember.id, {
        name: values.name,
        email: values.email,
      });
      toast.success("Profil diperbarui", { description: "Perubahan profil berhasil disimpan." });
      setEditOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memperbarui profil.";
      toast.error("Kesalahan", { description: message });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleChangePassword = async (newPassword: string) => {
    setChangePasswordSubmitting(true);
    try {
      await submitChangePassword(newPassword);
      toast.success("Kata sandi diperbarui", {
        description: "Silakan gunakan kata sandi baru saat login berikutnya.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memperbarui kata sandi.";
      toast.error("Kesalahan", { description: message });
    } finally {
      setChangePasswordSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await signOut();

      toast.success("Berhasil keluar", {
        description: "Mengarahkan ke halaman login.",
      });

      router.replace("/login");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal keluar. Coba lagi.";
      toast.error("Kesalahan", { description: message });
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSwitchAccount = async (slug: string) => {
    if (!slug) {
      return;
    }
    setActionState((prev) => ({ ...prev, openingSlug: slug }));
    try {
      if (!mappedAccount || mappedAccount.slug !== slug) {
        await submitSwitchAccount(slug);
        await refreshSession();
        toast.success("Berhasil mengganti Kas", {
          description: "Kami memuat ulang data Kas yang dipilih.",
        });
      }
      const targetAccount = teamAccounts.find((account) => account.slug === slug);
      const redirectHref = targetAccount?.isDefault ? "/dashboard" : `/dashboard/${slug}`;
      router.push(redirectHref);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tidak dapat mengganti Kas saat ini.";
      toast.error("Gagal mengganti Kas", { description: message });
    } finally {
      setActionState((prev) => ({ ...prev, openingSlug: null }));
    }
  };

  const handleSetDefaultAccount = async (slug: string) => {
    if (!slug || actionState.defaultingSlug === slug) {
      return;
    }

    setActionState((prev) => ({ ...prev, defaultingSlug: slug }));
    try {
      await submitSetDefaultAccount(slug);
      await refreshSession();
      toast.success("Kas default diperbarui", {
        description: "Kas terpilih kini menjadi default Anda.",
      });
      await queryClient.invalidateQueries({ queryKey: ["member-accounts"] });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mengatur Kas default.";
      toast.error("Kesalahan", { description: message });
      throw error;
    } finally {
      setActionState((prev) => ({ ...prev, defaultingSlug: null }));
    }
  };

  const handleInviteMember = async (slug: string, email: string) => {
    const trimmedEmail = email.trim();
    if (!slug || !trimmedEmail) {
      return;
    }

    setActionState((prev) => ({ ...prev, invitingSlug: slug }));
    try {
      if (mappedAccount && slug === mappedAccount.slug) {
        await addMember(trimmedEmail);
      } else {
        await submitInviteMemberToAccount(slug, trimmedEmail);
      }
      await queryClient.invalidateQueries({ queryKey: ["member-accounts"] });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mengundang anggota.";
      toast.error("Kesalahan", { description: message });
      throw error;
    } finally {
      setActionState((prev) => ({ ...prev, invitingSlug: null }));
    }
  };

  const handleRemoveMember = async (slug: string, memberId: string) => {
    if (!slug || !memberId) {
      return;
    }

    const removingKey = `${slug}:${memberId}`;
    setActionState((prev) => ({ ...prev, removingKey }));
    try {
      if (mappedAccount && slug === mappedAccount.slug) {
        await removeMember(memberId);
      } else {
        await submitRemoveMemberFromAccount(slug, memberId);
      }
      toast.success("Anggota dihapus", {
        description: "Akses anggota telah dicabut.",
      });
      await queryClient.invalidateQueries({ queryKey: ["member-accounts"] });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus anggota.";
      toast.error("Kesalahan", { description: message });
      throw error;
    } finally {
      setActionState((prev) => ({ ...prev, removingKey: prev.removingKey === removingKey ? null : prev.removingKey }));
    }
  };

  const handleSelfExit = async (slug: string, memberId: string) => {
    if (!slug || !memberId) {
      return;
    }

    const removingKey = `${slug}:${memberId}`;
    setActionState((prev) => ({ ...prev, removingKey }));

    try {
      const result = await submitSelfExit(slug);

      await Promise.all([
        refreshSession(),
        queryClient.invalidateQueries({ queryKey: ["member-accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["account-members", slug] }),
        queryClient.invalidateQueries({ queryKey: ["account-details", slug] }),
      ]);

      switch (result.status) {
        case "member_removed":
          toast.success("Berhasil keluar", {
            description: "Akses kamu ke Kas ini udah dicabut.",
          });
          break;
        case "ownership_transferred":
          toast.success("Owner baru udah siap", {
            description: "Hak owner langsung kami oper ke anggota lain.",
          });
          break;
        case "account_deleted":
          toast.success("Kas ikut dihapus", {
            description: "Karena kamu owner terakhir, Kas ini udah kami hapus juga.",
          });
          break;
        default:
          break;
      }

      if (mappedAccount && slug === mappedAccount.slug) {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal keluar dari Kas.";
      toast.error("Kesalahan", { description: message });
      throw error;
    } finally {
      setActionState((prev) => ({
        ...prev,
        removingKey: prev.removingKey === removingKey ? null : prev.removingKey,
      }));
    }
  };

  const handleEditAccount = async (slug: string, values: { name: string; slug: string }) => {
    if (!slug) {
      return;
    }

    const payload = {
      name: values.name.trim(),
      slug: values.slug.trim(),
    };

    if (!payload.name || !payload.slug) {
      toast.error("Kesalahan", { description: "Nama dan slug wajib diisi." });
      return;
    }

    setActionState((prev) => ({ ...prev, editingSlug: slug }));
    try {
      const result = await submitEditAccountDetails(slug, payload);
      toast.success("Kas diperbarui", {
        description: "Perubahan nama dan tautan Kas berhasil disimpan.",
      });
      await queryClient.invalidateQueries({ queryKey: ["member-accounts"] });

      if (mappedAccount && slug === mappedAccount.slug && result.account.slug && result.account.slug !== slug) {
        router.push(`/dashboard/${result.account.slug}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memperbarui informasi Kas.";
      toast.error("Kesalahan", { description: message });
      throw error;
    } finally {
      setActionState((prev) => ({ ...prev, editingSlug: null }));
    }
  };

  const teamLoading = isLoading || isHydratingAccounts;
  const showCreateAccountOverlay = !teamLoading && teamAccounts.length === 0;

  return (
    <div className="px-4 pb-24 lg:px-8">
      <div className="space-y-8">
        <ProfileHeaderCard
          isLoading={isLoading}
          isRefreshing={accountsBusy && !isHydratingAccounts}
          currentMember={mappedMember}
          sharedAccount={mappedAccount}
          getInitials={getMemberInitials}
          shimmerStyle={shimmerStyle}
        />

        <section className="space-y-4" aria-labelledby="profile-details-heading">
          <header className="space-y-1" id="profile-details-heading">
            <h2 className="text-lg font-semibold text-foreground">Detail Profil</h2>
            <p className="text-sm text-muted-foreground">Kelola informasi login dan keamanan akun Anda.</p>
          </header>
          <ProfileDetailsCard
            isLoading={isLoading}
            currentMember={mappedMember}
            onEdit={() => setEditOpen(true)}
            onChangePassword={() => setChangePasswordOpen(true)}
            onSignOut={handleSignOut}
            isSigningOut={isSigningOut}
          />
        </section>

        <section className="space-y-4" aria-labelledby="profile-manage-heading">
          <header className="space-y-1" id="profile-manage-heading">
            <h2 className="text-lg font-semibold text-foreground">Kelola Kas</h2>
            <p className="text-sm text-muted-foreground">Atur akses Kas bersama, anggota, dan preferensi akun.</p>
          </header>
          {showCreateAccountOverlay ? (
            <NoAccountOverlay />
          ) : (
            <ProfileTeamCard
              isLoading={isLoading || isHydratingAccounts}
              isRefreshing={accountsBusy && !isHydratingAccounts}
              accounts={teamAccounts}
              actionState={actionState}
              onOpenAccount={handleSwitchAccount}
              onSetDefaultAccount={handleSetDefaultAccount}
              onInviteMember={handleInviteMember}
              onRemoveMember={handleRemoveMember}
              onEditAccount={handleEditAccount}
              onSelfExit={handleSelfExit}
            />
          )}
        </section>
      </div>

      <ProfileEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        defaultValues={{ name: mappedMember?.name ?? "", email: mappedMember?.email ?? "" }}
        onSubmit={handleEditSubmit}
        submitting={editSubmitting}
        isMobile={isMobile}
      />

      <ProfileChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
        onSubmit={handleChangePassword}
        submitting={changePasswordSubmitting}
        isMobile={isMobile}
      />

      <style jsx>{`
        @keyframes profile-shimmer {
          0% {
            background-position: -200% 50%;
          }
          50% {
            background-position: 50% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
      `}</style>
    </div>
  );
}
