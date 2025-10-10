"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function WalletLoading() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <Card key={`wallet-skeleton-${index}`} className="border border-border/60 bg-card/60 shadow-none">
          <CardContent className="flex flex-col gap-4 p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20 rounded-full" />
                </div>
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-32" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-9 w-full rounded-full" />
                <Skeleton className="h-9 w-full rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
