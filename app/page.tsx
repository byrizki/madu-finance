"use client";

import Link from "next/link";

import { useAuthSession } from "@/components/providers/auth-provider";
import { FloatingFinanceIcons } from "../components/landingpage/floating-finance-icons";
import { HeroRotator } from "../components/landingpage/hero-rotator";

export default function LandingPage() {
  const { session } = useAuthSession();

  const primaryCta = session
    ? {
        href: "/dashboard",
        label: "Masuk ke dashboard",
        variant: "primary" as const,
      }
    : {
        href: "/login?mode=signup",
        label: "Cobain gratis yuk",
        variant: "primary" as const,
      };

  const secondaryCta = session
    ? {
        href: "/dashboard#wallets",
        label: "Cek ringkasan",
      }
    : {
        href: "/login",
        label: "Login aja",
      };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-16 text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-40 h-80 w-80 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-indigo-400/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-300/20 blur-[120px]" />
        <div className="absolute top-1/4 left-1/4 h-56 w-56 rounded-full bg-primary/15 blur-[100px]" />
      </div>
      <FloatingFinanceIcons />
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center z-10">
        <HeroRotator />

        <div className="mt-8 flex flex-row items-center gap-3 sm:flex-row">
          <Link
            href={primaryCta.href}
            className="landing-cta rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90"
          >
            <span className="relative z-10">{primaryCta.label}</span>
          </Link>
          <Link
            href={secondaryCta.href}
            className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-border/20"
          >
            {secondaryCta.label}
          </Link>
        </div>
      </div>
    </div>
  );
}
