"use client";

import { ArrowDownRight, ArrowUpRight, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MaskedValue } from "@/components/dashboard/masked-value";
import type { StatCardValue } from "./custom-stat-types";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";

interface CustomStatCardProps {
  statCard: StatCardValue;
  onDelete?: (cardId: string) => void;
  onEdit?: (cardId: string) => void;
  showDeleteButton?: boolean;
  showEditButton?: boolean;
  isDeleting?: boolean;
}

export function CustomStatCard({ 
  statCard, 
  onDelete, 
  onEdit,
  showDeleteButton = false,
  showEditButton = false,
  isDeleting = false
}: CustomStatCardProps) {
  const iconColor = statCard.type === "income" ? "text-emerald-500" : "text-rose-500";
  const valueColor = statCard.type === "income" 
    ? "text-emerald-600 dark:text-emerald-400" 
    : "text-rose-600 dark:text-rose-400";

  return (
    <Card className="py-2 gap-2 border-border/50 hover:shadow-sm transition-all duration-200 flex flex-col">
      <CardContent className="p-3 flex-1">
        <div className="flex items-start justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground line-clamp-1 pr-2">{statCard.name}</span>
          {statCard.type === "income" ? (
            <ArrowUpRight className={`h-3 w-3 ${iconColor} flex-shrink-0`} />
          ) : (
            <ArrowDownRight className={`h-3 w-3 ${iconColor} flex-shrink-0`} />
          )}
        </div>
        <div className="mb-2">
          <MaskedValue
            value={statCard.value}
            className={`text-base font-bold ${valueColor}`}
            compact
          />
        </div>
        
        {/* Categories display */}
        {statCard.categories.length > 0 && (
          <div className="flex flex-wrap gap-0.5">
            {statCard.categories.slice(0, 1).map((category) => (
              <span
                key={category}
                className="text-xs px-1 py-0.5 rounded bg-muted/50 text-muted-foreground truncate max-w-20"
              >
                {category}
              </span>
            ))}
            {statCard.categories.length > 1 && (
              <span className="text-xs px-1 py-0.5 rounded bg-muted/50 text-muted-foreground">
                +{statCard.categories.length - 1}
              </span>
            )}
          </div>
        )}
      </CardContent>
      
      {/* Footer with actions - always visible */}
      {(showEditButton || showDeleteButton) && (
        <div className="px-3 py-1.5 border-t border-border/50 flex items-center justify-end gap-0.5 bg-muted/20">
          {showEditButton && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-xs hover:bg-background flex-1"
              onClick={() => onEdit(statCard.id)}
            >
              <Edit2 className="h-2.5 w-2.5" />
              Ubah
            </Button>
          )}
          {showDeleteButton && onDelete && (
            <DeleteConfirmationDialog
              onConfirm={() => onDelete(statCard.id)}
              title="Hapus Card"
              description={`Apakah Anda yakin ingin menghapus card "${statCard.name}"? Tindakan ini tidak dapat dibatalkan.`}
              isLoading={isDeleting}
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-xs text-destructive hover:bg-destructive/20 hover:text-destructive border-destructive/20 flex-1"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <div className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-current" />
                  ) : (
                    <Trash2 className="h-2.5 w-2.5" />
                  )}
                  Hapus
                </Button>
              }
            />
          )}
        </div>
      )}
    </Card>
  );
}
