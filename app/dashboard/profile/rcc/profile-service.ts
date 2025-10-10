export async function submitChangePassword(newPassword: string) {
  const response = await fetch("/api/profile/password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newPassword }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Gagal memperbarui kata sandi");
  }
}

export async function submitSwitchAccount(accountSlug: string) {
  if (!accountSlug) {
    throw new Error("Slug Kas tidak valid");
  }
}

export async function submitSetDefaultAccount(accountSlug: string) {
  const response = await fetch("/api/accounts/default", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accountSlug }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Gagal mengatur Kas default");
  }
}

export async function submitInviteMemberToAccount(accountSlug: string, email: string) {
  const encodedSlug = encodeURIComponent(accountSlug);
  const response = await fetch(`/api/${encodedSlug}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Gagal mengundang anggota");
  }
}

export async function submitRemoveMemberFromAccount(accountSlug: string, memberId: string) {
  const encodedSlug = encodeURIComponent(accountSlug);
  const encodedMemberId = encodeURIComponent(memberId);
  const response = await fetch(`/api/${encodedSlug}/members/${encodedMemberId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Gagal menghapus anggota");
  }
}

export type SelfExitStatus = "member_removed" | "ownership_transferred" | "account_deleted";

export interface SelfExitResult {
  status: SelfExitStatus;
  newOwnerId?: string;
}

export async function submitSelfExit(accountSlug: string) {
  const encodedSlug = encodeURIComponent(accountSlug);
  const response = await fetch(`/api/${encodedSlug}/members/self`, {
    method: "POST",
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Gagal keluar dari Kas");
  }

  return (await response.json()) as SelfExitResult;
}

export interface CreateAccountResult {
  created: boolean;
  accountId: string;
  accountSlug: string;
}

export async function submitCreateAccount() {
  const response = await fetch("/api/profile/init", {
    method: "POST",
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Gagal membuat Kas baru");
  }

  return (await response.json()) as CreateAccountResult;
}

export async function submitEditAccountDetails(accountSlug: string, values: { name?: string; slug?: string }) {
  const encodedSlug = encodeURIComponent(accountSlug);
  const response = await fetch(`/api/${encodedSlug}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Gagal memperbarui informasi Kas");
  }

  return response.json() as Promise<{ account: { slug: string; name: string } }>;
}

interface CheckAccountSlugOptions {
  excludeSlug?: string;
  signal?: AbortSignal;
}

export async function checkAccountSlugAvailability(slug: string, options?: CheckAccountSlugOptions) {
  const trimmedSlug = slug.trim();
  if (!trimmedSlug) {
    return { available: false };
  }

  const params = new URLSearchParams({ slug: trimmedSlug });
  if (options?.excludeSlug) {
    params.set("excludeSlug", options.excludeSlug.trim());
  }

  const response = await fetch(`/api/accounts/check-slug?${params.toString()}`, {
    method: "GET",
    signal: options?.signal,
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Tidak dapat memeriksa ketersediaan slug saat ini");
  }

  const result = (await response.json()) as { available: boolean };
  return result;
}
