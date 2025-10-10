"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

import { cn } from "@/lib/utils";

const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  const composedToastOptions: ToasterProps["toastOptions"] = {
    ...toastOptions,
    classNames: {
      toast: cn(
        "group pointer-events-auto flex w-full gap-4 rounded-[30px] border border-white/40 bg-card/70 px-6 py-5 text-foreground shadow-[0_28px_60px_-24px_rgba(15,23,42,0.35)] backdrop-blur-2xl saturate-150 transition-all duration-300 ease-out",
        "dark:border-white/15 dark:bg-slate-950/60",
        "data-[type=success]:border-emerald-300/60 data-[type=success]:shadow-[0_18px_45px_rgba(16,185,129,0.25)] data-[type=success]:backdrop-saturate-200",
        "data-[type=error]:border-destructive/50 data-[type=error]:shadow-[0_18px_45px_rgba(248,113,113,0.3)]",
        "data-[type=warning]:border-amber-300/60 data-[type=warning]:shadow-[0_18px_45px_rgba(251,191,36,0.28)]",
        "data-[type=info]:border-sky-300/60 data-[type=info]:shadow-[0_18px_45px_rgba(56,189,248,0.25)]",
        "data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100 data-[visible=false]:translate-y-3 data-[visible=false]:opacity-0",
        toastOptions?.classNames?.toast
      ),
      title: cn("text-sm font-semibold leading-tight", toastOptions?.classNames?.title),
      description: cn("text-xs text-muted-foreground/90", toastOptions?.classNames?.description),
      icon: cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-[20px] bg-white/70 text-foreground shadow-inner shadow-black/10 backdrop-blur-md",
        "dark:bg-slate-900/70",
        "group-data-[type=success]:text-emerald-500",
        "group-data-[type=error]:text-destructive",
        "group-data-[type=warning]:text-amber-500",
        "group-data-[type=info]:text-sky-500",
        toastOptions?.classNames?.icon
      ),
      actionButton: cn(
        "rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90",
        toastOptions?.classNames?.actionButton
      ),
      cancelButton: cn(
        "rounded-full border border-border/70 px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-border/10",
        toastOptions?.classNames?.cancelButton
      ),
      closeButton: cn(
        "rounded-full bg-transparent p-1 text-muted-foreground transition hover:text-foreground",
        toastOptions?.classNames?.closeButton
      ),
    },
  };

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      toastOptions={composedToastOptions}
      {...props}
    />
  );
};

export { Toaster };
