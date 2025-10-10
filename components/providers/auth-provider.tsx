"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createAuthClient } from "better-auth/react";

import type { Auth } from "@/lib/auth";
import { useDefaultAccount, type DefaultAccount } from "@/hooks/use-default-account";

const authClient = createAuthClient({
  
});

type AuthSession = Auth["$Infer"]["Session"];
type AuthUser = AuthSession extends { user: infer U } ? U : never;

interface AuthContextValue {
  client: typeof authClient;
  session: AuthSession | null;
  user: AuthUser | null;
  isReady: boolean;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
  defaultAccount: DefaultAccount | null;
  isDefaultAccountLoading: boolean;
  refreshDefaultAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending, refetch } = authClient.useSession();
  const hasUser = useMemo(() => Boolean((data as AuthSession | null)?.user?.id), [data]);
  const {
    defaultAccount,
    isPending: isDefaultAccountPending,
    refetch: refetchDefaultAccount,
  } = useDefaultAccount({ enabled: hasUser });

  const value = useMemo<AuthContextValue>(
    () => {
      const session = (data ?? null) as AuthSession | null;
      const user = session?.user ?? null;

      return {
        client: authClient,
        session,
        user,
        isReady: !isPending,
        refreshSession: async () => {
          await Promise.all([refetch(), refetchDefaultAccount()]);
        },
        signOut: async () => {
          await authClient.signOut();
          await Promise.all([refetch(), refetchDefaultAccount()]);
        },
        defaultAccount: defaultAccount ?? null,
        isDefaultAccountLoading: isDefaultAccountPending,
        refreshDefaultAccount: async () => {
          await refetchDefaultAccount();
        },
      } satisfies AuthContextValue;
    },
    [data, defaultAccount, isDefaultAccountPending, isPending, refetch, refetchDefaultAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function useAuthClient() {
  return useAuth().client;
}

export function useAuthSession() {
  const { session, isReady, refreshSession } = useAuth();
  return { session, isReady, refreshSession };
}

export function useAuthUser() {
  const { session, isReady } = useAuth();
  const user = (session as { user?: unknown } | null)?.user ?? null;
  return { user, session, isReady };
}
