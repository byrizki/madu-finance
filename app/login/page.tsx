"use client";

import type React from "react";

import { ArrowRight, Eye, EyeOff, Loader2, Wallet } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Script from "next/script";
import { AppLogo } from "@/components/branding/app-logo";
import { FloatingFinanceIcons } from "@/components/landingpage/floating-finance-icons";
import { toast } from "sonner";
import { useIsMounted } from "@/hooks/use-is-mounted";

type GoogleCredentialResponse = {
  credential: string;
  clientId?: string;
  select_by?: string;
};

declare global {
  interface Window {
    handleSignInWithGoogle?: (response: GoogleCredentialResponse) => Promise<void>;
    google?: {
      accounts?: {
        id?: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (parent: HTMLElement, options?: Record<string, unknown>) => void;
          prompt: () => void;
          cancel?: () => void;
        };
      };
    };
  }
}

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

const GOOGLE_ICON = (
  <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" className="text-foreground">
    <path
      fill="currentColor"
      d="M21.35 11.1h-9.17v2.92h5.27c-.23 1.42-1.56 4.17-5.27 4.17-3.17 0-5.76-2.63-5.76-5.86s2.59-5.86 5.76-5.86c1.8 0 3.01.77 3.7 1.43l2.52-2.43C16.47 3.62 14.42 2.7 11.94 2.7 6.99 2.7 2.99 6.7 2.99 11.65s4 8.95 8.95 8.95c5.16 0 8.57-3.63 8.57-8.74 0-.59-.06-1.04-.16-1.76Z"
    />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { client, refreshSession } = useAuth();

  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [isInitializingAccount, setIsInitializingAccount] = useState(false);
  const [nonce, setNonce] = useState<string | null>(null);
  const [nonceHash, setNonceHash] = useState<string | null>(null);
  const isMounted = useIsMounted();

  const googleInitializedRef = useRef(false);

  const redirectTo = searchParams?.get("redirectTo") ?? "/dashboard";
  const origin = useMemo(() => (typeof window !== "undefined" ? window.location.origin : undefined), []);

  const initializeDefaultAccount = async () => {
    try {
      setIsInitializingAccount(true);
      const response = await fetch("/api/profile/init", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Nggak bisa nyiapin data awal Kas nih.");
      }

      const payload = (await response.json()) as {
        created?: boolean;
        accountId?: string;
      };
      if (payload.created) {
        await refreshSession();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Setting Kas-nya lagi bermasalah";
      toast.error("Inisialisasi Kas lagi seret", {
        description: message,
      });
    } finally {
      setIsInitializingAccount(false);
    }
  };

  const completeLogin = async () => {
    await initializeDefaultAccount();
    router.replace(redirectTo);
    router.refresh();
  };

  useEffect(() => {
    if (typeof window === "undefined" || !window.crypto?.subtle) {
      return;
    }

    let cancelled = false;

    const generateNoncePair = async () => {
      const randomBytes = new Uint8Array(32);
      window.crypto.getRandomValues(randomBytes);
      const plain = Array.from(randomBytes)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

      const encoded = new TextEncoder().encode(plain);
      const digest = await window.crypto.subtle.digest("SHA-256", encoded);
      const hashArray = Array.from(new Uint8Array(digest));
      const hashed = hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");

      if (!cancelled) {
        setNonce(plain);
        setNonceHash(hashed);
      }
    };

    void generateNoncePair();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!googleClientId || !nonce || authMode !== "signin") {
      return;
    }

    const handler = async (response: GoogleCredentialResponse) => {
      if (!response?.credential) {
        toast.error("Google Sign-In lagi bingung", {
          description: "Token Google-nya nggak kebaca nih.",
        });
        return;
      }

      setIsGoogleLoading(true);

      try {
        await client.signIn.social({
          provider: "google",
          idToken: {
            token: response.credential,
            nonce,
          },
        });

        await completeLogin();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Belum bisa proses respons dari Google.";
        toast.error("Google Sign-In belum berhasil", {
          description: message,
        });
      } finally {
        setIsGoogleLoading(false);
      }
    };

    window.handleSignInWithGoogle = handler;

    return () => {
      if (window.handleSignInWithGoogle === handler) {
        delete window.handleSignInWithGoogle;
      }
    };
  }, [authMode, client, completeLogin, nonce, redirectTo, router]);

  useEffect(() => {
    if (typeof window === "undefined" || authMode !== "signin" || !googleClientId || !nonceHash) {
      return;
    }

    let cancelled = false;

    const initializeOneTap = () => {
      if (cancelled) {
        return true;
      }

      const googleId = window.google?.accounts?.id;

      if (!googleId) {
        return false;
      }

      if (!googleInitializedRef.current) {
        googleId.initialize({
          client_id: googleClientId,
          callback: (response: unknown) => {
            void window.handleSignInWithGoogle?.(response as GoogleCredentialResponse);
          },
          ux_mode: "popup",
          context: "signin",
          nonce: nonceHash,
          auto_select: true,
          itp_support: true,
          use_fedcm_for_prompt: true,
        });
        googleInitializedRef.current = true;
      }

      googleId.prompt();
      return true;
    };

    if (initializeOneTap()) {
      return () => {
        cancelled = true;
        window.google?.accounts?.id?.cancel?.();
      };
    }

    const timer = window.setInterval(() => {
      if (initializeOneTap()) {
        window.clearInterval(timer);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.google?.accounts?.id?.cancel?.();
    };
  }, [authMode, googleClientId, nonceHash]);

  const handleGoogleSignInFallback = async () => {
    if (isGoogleLoading || authMode !== "signin") return;
    setIsGoogleLoading(true);
    try {
      const redirectUrl = origin ? `${origin}${redirectTo.startsWith("/") ? redirectTo : `/${redirectTo}`}` : undefined;

      await client.signIn.social(
        redirectUrl
          ? {
              provider: "google",
              callbackURL: redirectUrl,
            }
          : {
              provider: "google",
            }
      );
      if (!redirectUrl) {
        setIsGoogleLoading(false);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Belum bisa nyambung ke Google.";
      toast.error("Google Sign-In lagi nyoba lagi", {
        description: message,
      });
      setIsGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsEmailSubmitting(true);

    try {
      if (authMode === "signin") {
        await client.signIn.email({
          email,
          password,
        });
      } else {
        await client.signUp.email({
          email,
          password,
          name: email.split("@")[0] ?? email,
        });

        await client.signIn.email({
          email,
          password,
        });

        toast.success("Akun berhasil dibuat", {
          description: "Selamat datang di byMADU. Kami menyiapkan akun Anda sekarang.",
        });
      }

      await completeLogin();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ada error mendadak. Coba lagi bentar ya.";
      toast.error(authMode === "signin" ? "Masuknya belum sukses" : "Daftarnya belum kelar", {
        description: message,
      });
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  return (
    <div className="relative overflow-hidden min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-40 h-80 w-80 rounded-full bg-primary/25 blur-3xl dark:bg-primary/20" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-indigo-400/25 blur-3xl dark:bg-indigo-500/20" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-300/20 blur-[120px] dark:bg-emerald-400/15" />
        <div className="absolute top-1/4 left-1/4 h-56 w-56 rounded-full bg-primary/15 blur-[100px] dark:bg-primary/15" />
      </div>

      <FloatingFinanceIcons />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-4 py-12">
        <Card className="border border-white/60 bg-white/80 shadow-xl shadow-primary/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:shadow-emerald-500/10">
          <CardHeader className="space-y-6">
            <div className="space-y-2 text-center">
              <div className="mx-auto flex items-center justify-center gap-2">
                <AppLogo width={48} height={48} alt="Logo" />
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">byMADU</h1>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Hey, mari ngatur dompet, anggaran, dan transaksi kamu di satu tempat yang asik!
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs
              value={authMode}
              onValueChange={(value) => setAuthMode(value as "signin" | "signup")}
              className="space-y-6"
            >
              <TabsList className="w-full">
                <TabsTrigger className="flex-1" value="signin">
                  Masuk
                </TabsTrigger>
                <TabsTrigger className="flex-1" value="signup">
                  Daftar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-6">
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Email kamu
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      className="h-12"
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signin-password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Kata sandi
                    </Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimal 6 karakter ya"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        className="h-12 pr-12"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-3 inline-flex items-center text-muted-foreground transition-colors hover:text-primary"
                        aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isEmailSubmitting}>
                    {isEmailSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Lagi proses...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Masuk sekarang
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>

                <div className="flex items-center gap-4">
                  <Separator className="flex-1" />
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">atau</span>
                  <Separator className="flex-1" />
                </div>

                <div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 text-base font-medium dark:text-slate-200 dark:border-white/10"
                    onClick={handleGoogleSignInFallback}
                    disabled={isGoogleLoading || !googleClientId}
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin dark:text-slate-200" />
                    ) : (
                      <span className="dark:text-slate-200">{GOOGLE_ICON}</span>
                    )}
                    <span className="dark:text-slate-200">
                      {isGoogleLoading ? "Lagi nyambung..." : "Masuk lewat Google"}
                    </span>
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-5">
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Email kamu
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      className="h-12"
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Kata sandi
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimal 6 karakter"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        className="h-12 pr-12"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-3 inline-flex items-center text-muted-foreground transition-colors hover:text-primary"
                        aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isEmailSubmitting}>
                    {isEmailSubmitting ? "Lagi bikin Kas..." : "Daftar & langsung pakai"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {(isGoogleLoading || isEmailSubmitting || isInitializingAccount) && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm dark:bg-slate-950/70">
          <div className="flex items-center gap-3 rounded-full bg-white px-6 py-3 shadow-lg dark:bg-slate-900 dark:text-slate-100">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {isInitializingAccount ? "Menyiapkan data Kas..." : "Memproses permintaan Anda..."}
            </span>
          </div>
        </div>
      )}

      <Script src="https://accounts.google.com/gsi/client" async defer />
    </div>
  );
}
