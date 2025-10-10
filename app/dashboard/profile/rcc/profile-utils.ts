import type { CSSProperties } from "react";

export interface ChangePasswordFormState {
  newPassword: string;
  confirmPassword: string;
}

export const createDefaultChangePasswordForm = (): ChangePasswordFormState => ({
  newPassword: "",
  confirmPassword: "",
});

export const getMemberInitials = (name: string): string => {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("") || "??"
  );
};

export const createProfileShimmerStyle = (): CSSProperties => ({
  backgroundImage:
    "linear-gradient(128deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 32%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.08) 68%, rgba(255,255,255,0) 100%)",
  backgroundSize: "240% 240%",
  animation: "profile-shimmer 5.4s ease-in-out infinite",
});

export const formatRoleLabel = (role: "owner" | "member") => role;
