"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, useAuthUser, useAuthSession } from "@/components/providers/auth-provider";
import { useAccountDetails, useAccountMembers } from "@/hooks/use-account-overview";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

type MemberRole = "owner" | "member";

interface Member {
  id: string;
  name: string;
  role: MemberRole;
  email: string;
}

interface SharedAccount {
  id: string;
  slug: string;
  name: string;
  members: Member[];
  createdBy: string;
}

interface MemberContextType {
  accountId: string;
  accountSlug: string;
  isLoading: boolean;
  currentMember: Member;
  members: Member[];
  sharedAccount: SharedAccount;
  switchMember: (memberId: string) => void;
  addMember: (email: string, name?: string, role?: MemberRole) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  updateMemberProfile: (
    memberId: string,
    data: {
      name?: string;
      email?: string;
      phone?: string | null;
      address?: string | null;
    }
  ) => Promise<void>;
}

interface MemberProviderProps {
  children: ReactNode;
  accountSlug?: string;
}

const fallbackMember: Member = {
  id: "",
  name: "",
  role: "member",
  email: "",
};

const fallbackSharedAccount: SharedAccount = {
  id: "",
  slug: "",
  name: "",
  members: [fallbackMember],
  createdBy: "",
};

const MemberContext = createContext<MemberContextType | undefined>(undefined);

export function MemberProvider({ children, accountSlug }: MemberProviderProps) {
  const queryClient = useQueryClient();
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const { user } = useAuthUser();
  const { refreshSession } = useAuthSession();
  const { defaultAccount, isDefaultAccountLoading } = useAuth();
  const [derivedAccountSlug, setDerivedAccountSlug] = useState<string | null>(null);
  const pathname = usePathname();

  const slugFromPath = useMemo(() => {
    if (!pathname) return null;
    const segments = pathname.split("/").filter(Boolean);
    if (segments[0] === "dashboard" && segments.length > 2) {
      return segments[1];
    }
    return null;
  }, [pathname]);

  useEffect(() => {
    refreshSession();
  }, []);

  useEffect(() => {
    const metadata = (user as { metadata?: Record<string, unknown> } | null)?.metadata;
    const metadataSlug = typeof metadata?.account_slug === "string" ? metadata.account_slug : null;
    const fallbackSlug = metadataSlug ?? derivedAccountSlug;

    if (defaultAccount?.accountSlug) {
      setDerivedAccountSlug(defaultAccount.accountSlug);
      return;
    }

    if (fallbackSlug) {
      setDerivedAccountSlug(fallbackSlug);
    }
  }, [defaultAccount?.accountSlug, derivedAccountSlug, user]);

  const resolvedAccountSlug = accountSlug ?? slugFromPath ?? derivedAccountSlug ?? "";
  const isAccountReady = resolvedAccountSlug.length > 0 && !isDefaultAccountLoading;

  const { data: accountDetails, isLoading: accountDetailsLoading } = useAccountDetails(resolvedAccountSlug);
  const { data: memberData, isLoading: membersLoading } = useAccountMembers(resolvedAccountSlug);

  useEffect(() => {
    if (memberData?.members?.length && !activeMemberId) {
      setActiveMemberId(memberData.members[0].id);
    }
  }, [memberData?.members, activeMemberId]);

  const membersList = useMemo<Member[]>(() => {
    if (!memberData?.members) return [];
    return memberData.members.map((member) => ({
      id: member.id,
      name: member.name,
      role: member.role,
      email: member.email,
    }));
  }, [memberData?.members]);
  const resolvedMembers = membersList.length > 0 ? membersList : [fallbackMember];

  const currentMember = useMemo(() => {
    const found = resolvedMembers.find((member) => member.id === activeMemberId);
    return found ?? resolvedMembers[0];
  }, [resolvedMembers, activeMemberId]);

  const sharedAccount = useMemo<SharedAccount>(() => {
    if (!accountDetails?.account) {
      return {
        ...fallbackSharedAccount,
        slug: resolvedAccountSlug,
        members: resolvedMembers,
      };
    }

    return {
      id: accountDetails.account.id,
      slug: accountDetails.account.slug,
      name: accountDetails.account.name,
      createdBy: accountDetails.account.ownerId,
      members: resolvedMembers,
    };
  }, [resolvedMembers, resolvedAccountSlug, accountDetails?.account]);

  const invalidateAccountQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["account-members", resolvedAccountSlug],
      }),
      queryClient.invalidateQueries({
        queryKey: ["account-details", resolvedAccountSlug],
      }),
    ]);
  };

  const addMemberMutation = useMutation({
    mutationFn: async (payload: { email: string; name?: string; role?: MemberRole }) => {
      if (!isAccountReady) {
        throw new Error("Account slug is not configured");
      }

      const res = await fetch(`/api/${resolvedAccountSlug}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Failed to add member");
      }

      return res.json() as Promise<Member>;
    },
    onSuccess: async (newMember) => {
      if (!activeMemberId) {
        setActiveMemberId(newMember.id);
      }
      toast.info("Anggota ditambahkan", {
        description: `${newMember.name} kini memiliki akses Kas.`,
      });
      await invalidateAccountQueries();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Gagal menambahkan anggota";
      toast.error("Kesalahan", {
        description: message,
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      if (!isAccountReady) {
        throw new Error("Account slug is not configured");
      }

      const res = await fetch(`/api/${resolvedAccountSlug}/members/${memberId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Failed to remove member");
      }

      return res.json() as Promise<{ success: boolean }>;
    },
    onSuccess: async (_result, memberId) => {
      if (activeMemberId === memberId) {
        setActiveMemberId(null);
      }
      toast.info("Anggota dihapus", {
        description: "Akses anggota telah dicabut.",
      });
      await invalidateAccountQueries();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Gagal menghapus anggota";
      toast.error("Kesalahan", {
        description: message,
      });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({
      memberId,
      data,
    }: {
      memberId: string;
      data: {
        name?: string;
        email?: string;
        phone?: string | null;
        address?: string | null;
      };
    }) => {
      if (!isAccountReady) {
        throw new Error("Account slug is not configured");
      }

      const res = await fetch(`/api/${resolvedAccountSlug}/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to update member");
      }

      return res.json() as Promise<{ member?: Member }>;
    },
    onSuccess: async () => {
      toast.success("Profil diperbarui", {
        description: "Perubahan profil berhasil disimpan.",
      });
      await invalidateAccountQueries();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Gagal memperbarui profil";
      toast.error("Kesalahan", {
        description: message,
      });
    },
  });

  const switchMember = (memberId: string) => {
    setActiveMemberId(memberId);
    const selectedMember = resolvedMembers.find((member) => member.id === memberId);
    if (selectedMember) {
      toast.info("Anggota berhasil diubah", {
        description: `Sekarang Anda login sebagai ${selectedMember.name}`,
      });
    }
  };

  const addMember = async (email: string, name?: string, role: MemberRole = "member") => {
    await addMemberMutation.mutateAsync({ email, name, role });
  };

  const removeMember = async (memberId: string) => {
    await removeMemberMutation.mutateAsync(memberId);
  };

  const updateMemberProfile = async (
    memberId: string,
    data: {
      name?: string;
      email?: string;
      phone?: string | null;
      address?: string | null;
    }
  ) => {
    await updateMemberMutation.mutateAsync({ memberId, data });
  };

  const isLoading = isAccountReady ? accountDetailsLoading || membersLoading : false;

  const value: MemberContextType = {
    accountId: sharedAccount.id,
    accountSlug: resolvedAccountSlug,
    isLoading,
    currentMember,
    members: resolvedMembers,
    sharedAccount,
    switchMember,
    addMember,
    removeMember,
    updateMemberProfile,
  };

  return <MemberContext.Provider value={value}>{children}</MemberContext.Provider>;
}

export function useMember() {
  const context = useContext(MemberContext);
  if (context === undefined) {
    throw new Error("useMember must be used within a MemberProvider");
  }
  return context;
}
