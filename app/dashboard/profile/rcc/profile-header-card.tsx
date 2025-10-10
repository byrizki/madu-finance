"use client";

import { type CSSProperties } from "react";

import { type LucideIcon, Crown, Link2, Loader2, Sparkles, User, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { ProfileMember, ProfileSharedAccount } from "./profile-types";

interface ProfileHeaderCardProps {
  isLoading: boolean;
  isRefreshing?: boolean;
  currentMember: ProfileMember | null;
  sharedAccount: ProfileSharedAccount | null;
  shimmerStyle: CSSProperties;
  getInitials: (name: string) => string;
}

function renderBadges(member: ProfileMember | null, account: ProfileSharedAccount | null) {
  if (!member || !account) {
    return (
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Skeleton className="h-6 w-24 rounded-full bg-muted/30" />
        <Skeleton className="h-6 w-32 rounded-full bg-muted/30" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge
        variant="secondary"
        className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
      >
        {member.role === "owner" ? <Crown className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
        {member.role}
      </Badge>
      <Badge
        variant="outline"
        className="flex items-center gap-1.5 rounded-full border-dashed px-3 py-1 text-xs font-medium text-muted-foreground"
      >
        <Users className="h-3.5 w-3.5" />
        {account.name || "Kas bersama"}
      </Badge>
    </div>
  );
}

export function ProfileHeaderCard({
  isLoading,
  isRefreshing = false,
  currentMember,
  sharedAccount,
  shimmerStyle,
  getInitials,
}: ProfileHeaderCardProps) {
  const isOwner = currentMember?.role === "owner";
  const roleLabel = currentMember?.role ? (currentMember.role === "owner" ? "Owner" : "Anggota") : "-";
  const accountDisplay = sharedAccount?.name || "Belum memilih Kas";
  const accountSlug = sharedAccount?.slug ? `/dashboard/${sharedAccount.slug}` : "Belum ditentukan";

  const statusChip = (() => {
    if (isLoading) {
      return (
        <Badge
          variant="secondary"
          className="flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Memuat profil
        </Badge>
      );
    }

    if (isRefreshing && currentMember) {
      return (
        <Badge
          variant="outline"
          className="flex w-fit items-center gap-2 rounded-full border-dashed px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Memperbarui data
        </Badge>
      );
    }

    return null;
  })();

  return (
    <Card className="relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-lg">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-32 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-28 bottom-[-40px] h-48 w-48 rounded-full bg-accent/15 blur-3xl"
      />
      {isLoading ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-4 hidden h-24 rounded-3xl opacity-35 sm:block"
          style={shimmerStyle}
        />
      ) : null}
      <CardContent className="relative flex flex-col gap-6 p-5 sm:p-6 lg:p-7">
        <div className="flex flex-1 items-start gap-4">
          {isLoading || !currentMember ? (
            <Skeleton className="h-20 w-20 rounded-full border border-border/60 bg-muted/30" />
          ) : (
            <div className="relative h-20 w-20">
              {isRefreshing ? (
                <span
                  className="pointer-events-none absolute -inset-3 rounded-full border border-primary/30 opacity-70 animate-pulse"
                  aria-hidden
                />
              ) : null}
              <Avatar className="relative h-full w-full rounded-full border border-border/60 bg-background shadow-lg ring-4 ring-primary/10">
                <AvatarImage
                  src={currentMember.id ? `/api/profile/avatar?id=${currentMember.id}` : ""}
                  alt={currentMember.name}
                />
                <AvatarFallback className="text-lg font-semibold text-primary">
                  {getInitials(currentMember.name)}
                </AvatarFallback>
              </Avatar>
              {isOwner ? (
                <span className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-primary px-1.5 py-1 text-primary-foreground shadow-lg">
                  <Crown className="h-3 w-3" />
                </span>
              ) : null}
            </div>
          )}

          <div className="flex flex-1 flex-col gap-3">
            {statusChip}
            {isLoading || !currentMember ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-48 max-w-full" />
                <Skeleton className="h-4 w-56 max-w-full" />
              </div>
            ) : (
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground sm:text-2xl lg:text-3xl">{currentMember.name}</h2>
                <p className="text-sm text-muted-foreground">{currentMember.email}</p>
              </div>
            )}
            {renderBadges(isLoading ? null : currentMember, isLoading ? null : sharedAccount)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  isLoading,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 sm:px-5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      {isLoading ? (
        <Skeleton className="mt-2 h-4 w-28" />
      ) : (
        <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
      )}
    </div>
  );
}
