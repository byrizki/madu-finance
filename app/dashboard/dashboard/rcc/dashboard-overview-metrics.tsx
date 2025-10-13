"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MaskedValue } from "@/components/dashboard/masked-value";

import type { OverviewMetric } from "./dashboard-types";

interface DashboardOverviewMetricsProps {
  metrics: OverviewMetric[];
  isLoading: boolean;
}

export function DashboardOverviewMetrics({ metrics, isLoading }: DashboardOverviewMetricsProps) {
  return (
    <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card
            key={metric.id}
            className="py-2 rounded-2xl border border-border/50 bg-card/85 shadow-[0_0_10px_rgba(15,23,42,0.06)] dark:shadow-[0_0_10px_rgba(2,6,23,0.32)]"
          >
            <CardHeader className="gap-1 pb-1.5 pt-3">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {metric.title}
              </CardTitle>
              <p className="text-[11px] text-muted-foreground/80">{metric.description}</p>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              <div className="flex items-center gap-2.5">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-muted/70 ${metric.accent}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {isLoading ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <MaskedValue compact className="text-lg font-semibold text-foreground" value={metric.value} />
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
