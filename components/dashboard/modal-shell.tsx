"use client";

import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";

export interface ModalShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  disableAutoFocus?: boolean;
}

export function ModalShell({
  open,
  onOpenChange,
  title,
  description,
  children,
  header,
  footer,
  disableAutoFocus = true,
}: ModalShellProps) {
  const headerContent =
    header ?? (
      <DialogHeader className="space-y-1 text-left">
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </DialogHeader>
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="backdrop-blur-sm" />
        <DialogContent
          className="flex max-h-[95vh] w-[calc(100vw-2rem)] max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border/60 bg-card p-0 shadow-2xl sm:max-w-xl sm:rounded-3xl md:max-w-2xl lg:max-w-3xl"
          onOpenAutoFocus={disableAutoFocus ? (event) => event.preventDefault() : undefined}
        >
          <div className="flex h-full flex-col overflow-hidden">
            <div className="px-6 pb-4 pt-6">{headerContent}</div>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="space-y-4">{children}</div>
            </div>
            {footer ? <div className="px-6 pb-6">{footer}</div> : null}
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

export default ModalShell;
