"use client";

import { Children, type ComponentProps, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PageHeaderBadge {
  label: string;
  icon?: ReactNode;
  variant?: ComponentProps<typeof Badge>["variant"];
  className?: string;
}

interface PageHeaderInsight {
  text: string;
  onToggle: () => void;
  active?: boolean;
  srLabel?: string;
  className?: string;
}

interface PageHeaderProps {
  badge?: PageHeaderBadge;
  title: ReactNode;
  description?: ReactNode;
  insight?: PageHeaderInsight;
  actions?: ReactNode;
  subContent?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({
  badge,
  title,
  description,
  insight,
  actions,
  subContent,
  children,
  className,
}: PageHeaderProps) {
  const actionItems = actions ? Children.toArray(actions) : [];
  const srLabel = insight?.srLabel ?? (insight ? `${insight.active ? "Sembunyikan" : "Tampilkan"} detail` : undefined);

  return (
    <section
      className={cn(
        "space-y-5 rounded-2xl border border-border/50 overflow-hidden bg-card/95 p-5 shadow-[0_0_10px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-colors dark:shadow-[0_0_10px_rgba(2,6,23,0.32)]",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-32 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-28 bottom-[-40px] h-48 w-48 rounded-full bg-accent/15 blur-3xl"
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          {badge ? (
            <Badge
              variant={badge.variant ?? "outline"}
              className={cn(
                "inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary",
                badge.className
              )}
            >
              {badge.icon ? <span className="flex h-4 w-4 items-center justify-center">{badge.icon}</span> : null}
              <span>{badge.label}</span>
            </Badge>
          ) : null}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{title}</h1>
            {description ? <p className="text-sm text-muted-foreground sm:text-base">{description}</p> : null}
          </div>
          {insight ? (
            <button
              type="button"
              onClick={insight.onToggle}
              aria-pressed={insight.active ?? false}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border border-transparent bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                insight.className
              )}
            >
              {srLabel ? <span className="sr-only">{srLabel}</span> : null}
              <span aria-hidden="true">{insight.text}</span>
            </button>
          ) : null}
        </div>
        {(actionItems.length || subContent) ? (
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[280px] sm:items-end">
            {subContent ? <div className="w-full sm:w-auto">{subContent}</div> : null}
            {actionItems.length ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                {actionItems.map((action, index) => (
                  <div key={index} className="w-full sm:w-auto">
                    {action}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  );
}
