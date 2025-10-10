"use client";

import { useEffect, useMemo, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Wallet2, CalendarClock } from "lucide-react";

import { useMember } from "@/components/context/member-context";
import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInstallments, type InstallmentItem } from "@/hooks/use-installments";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { useWallets, type WalletItem } from "@/hooks/use-wallets";
import { cn, formatDate, getDaysUntilDue } from "@/lib/utils";

import { UnauthorizedAccessDialog } from "@/components/unauthorized-access-dialog";
import { isUnauthorizedAccountError } from "@/lib/errors";
import { NoAccountOverlay } from "@/components/no-account-overlay";

import AddInstallmentShell, { type AddInstallmentFormValues } from "./installment-add-shell";
import CloseInstallmentShell from "./installment-close-shell";
import DetailInstallmentShell from "./installment-detail-shell";
import AddBalanceShell, { type AddBalanceFormValues } from "./wallet-add-balance-shell";
import DecreaseBalanceShell, { type DecreaseBalanceFormValues } from "./wallet-dec-balance-shell";
import WalletAccountsTab from "./wallet-accounts-tab";
import WalletInstallmentsTab from "./installments-tab";
import NewWalletShell, { type NewWalletFormValues } from "./wallet-new-shell";
import { submitAddInstallment, submitPayInstallment } from "./installment-service";
import type { ServiceResult } from "./service-types";
import { submitAddWallet, submitDecreaseBalance, submitIncreaseBalance } from "./wallet-service";

export interface WalletClientProps {
  accountSlugOverride?: string;
}

function WalletClient({ accountSlugOverride }: WalletClientProps = {}) {
  const { accountSlug: memberAccountSlug } = useMember();
  const { defaultAccount, isDefaultAccountLoading } = useAuth();
  const resolvedAccountSlug = accountSlugOverride ?? memberAccountSlug ?? defaultAccount?.accountSlug ?? "";
  const isAccountResolved = Boolean(resolvedAccountSlug) && !isDefaultAccountLoading;
  const effectiveAccountSlug = isAccountResolved ? resolvedAccountSlug : undefined;
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { data: wallets, isLoading: walletsLoadingRaw, error: walletsError } = useWallets(effectiveAccountSlug);
  const {
    data: installments,
    isLoading: installmentsLoadingRaw,
    error: installmentsError,
  } = useInstallments(effectiveAccountSlug);

  const isMounted = useIsMounted();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"accounts" | "installments">(
    tabParam === "installments" ? "installments" : "accounts"
  );
  const walletsLoading = !isMounted || walletsLoadingRaw || !isAccountResolved;
  const installmentsLoading = !isMounted || installmentsLoadingRaw || !isAccountResolved;

  const unauthorizedError = [walletsError, installmentsError].find(isUnauthorizedAccountError);

  const walletList = wallets ?? [];
  const installmentList = installments ?? [];

  const showAccountPlaceholder = !isAccountResolved && !isDefaultAccountLoading;

  useEffect(() => {
    setActiveTab(tabParam === "installments" ? "installments" : "accounts");
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    const nextTab = value === "installments" ? "installments" : "accounts";
    setActiveTab(nextTab);

    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === "accounts") {
      params.delete("tab");
    } else {
      params.set("tab", nextTab);
    }

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  };

  const ensureAccount = () => {
    if (!isAccountResolved && !resolvedAccountSlug) {
      toast.error("Akun kamu belum ketemu", {
        description: "Yuk pilih atau bikin akun dulu, biar lanjut enak.",
      });
      return false;
    }
    return true;
  };

  const showServiceToast = (result: ServiceResult) => {
    const description = result.success ? result.description : result.errorDescription;

    if (result.success) {
      toast.success(result.message ?? "Sip, beres!", description ? { description } : undefined);
      return true;
    }

    toast.error(result.error ?? "Ups, ada yang salah", description ? { description } : undefined);
    return false;
  };

  const [addWalletOpen, setAddWalletOpen] = useState(false);
  const [addWalletSubmitting, setAddWalletSubmitting] = useState(false);

  const handleAddWalletOpenChange = (open: boolean) => {
    setAddWalletOpen(open);
    if (!open) {
      setAddWalletSubmitting(false);
    }
  };

  const openAddWallet = () => {
    if (!ensureAccount()) {
      return;
    }
    handleAddWalletOpenChange(true);
  };

  const handleAddWalletSubmit = async (values: NewWalletFormValues) => {
    if (!ensureAccount()) {
      return;
    }

    setAddWalletSubmitting(true);

    try {
      const result = await submitAddWallet({ accountSlug: resolvedAccountSlug, queryClient, values });
      if (showServiceToast(result)) {
        handleAddWalletOpenChange(false);
      }
    } finally {
      setAddWalletSubmitting(false);
    }
  };

  const [increaseOpen, setIncreaseOpen] = useState(false);
  const [increaseSubmitting, setIncreaseSubmitting] = useState(false);
  const [selectedIncreaseWalletId, setSelectedIncreaseWalletId] = useState<string | null>(null);

  const handleIncreaseOpenChange = (open: boolean) => {
    setIncreaseOpen(open);
    if (!open) {
      setIncreaseSubmitting(false);
      setSelectedIncreaseWalletId(null);
    }
  };

  const openIncreaseModal = (wallet: WalletItem) => {
    if (!ensureAccount()) {
      return;
    }
    setSelectedIncreaseWalletId(wallet.id);
    handleIncreaseOpenChange(true);
  };

  const handleIncreaseSubmit = async (values: AddBalanceFormValues) => {
    if (!ensureAccount()) {
      return;
    }

    setIncreaseSubmitting(true);

    try {
      const result = await submitIncreaseBalance({
        accountSlug: resolvedAccountSlug,
        queryClient,
        walletList,
        values,
      });
      if (showServiceToast(result)) {
        handleIncreaseOpenChange(false);
      }
    } finally {
      setIncreaseSubmitting(false);
    }
  };

  const [decreaseOpen, setDecreaseOpen] = useState(false);
  const [decreaseSubmitting, setDecreaseSubmitting] = useState(false);
  const [selectedDecreaseWalletId, setSelectedDecreaseWalletId] = useState<string | null>(null);

  const handleDecreaseOpenChange = (open: boolean) => {
    setDecreaseOpen(open);
    if (!open) {
      setDecreaseSubmitting(false);
      setSelectedDecreaseWalletId(null);
    }
  };

  const openDecreaseModal = (wallet: WalletItem) => {
    if (!ensureAccount()) {
      return;
    }
    setSelectedDecreaseWalletId(wallet.id);
    handleDecreaseOpenChange(true);
  };

  const handleDecreaseSubmit = async (values: DecreaseBalanceFormValues) => {
    if (!ensureAccount()) {
      return;
    }

    setDecreaseSubmitting(true);

    try {
      const result = await submitDecreaseBalance({
        accountSlug: resolvedAccountSlug,
        queryClient,
        walletList,
        values,
      });
      if (showServiceToast(result)) {
        handleDecreaseOpenChange(false);
      }
    } finally {
      setDecreaseSubmitting(false);
    }
  };

  const [addInstallmentOpen, setAddInstallmentOpen] = useState(false);
  const [addInstallmentSubmitting, setAddInstallmentSubmitting] = useState(false);

  const handleAddInstallmentOpenChange = (open: boolean) => {
    setAddInstallmentOpen(open);
    if (!open) {
      setAddInstallmentSubmitting(false);
    }
  };

  const openAddInstallment = () => {
    if (!ensureAccount()) {
      return;
    }
    handleAddInstallmentOpenChange(true);
  };

  const handleAddInstallmentSubmit = async (values: AddInstallmentFormValues) => {
    if (!ensureAccount()) {
      return;
    }

    setAddInstallmentSubmitting(true);

    try {
      const result = await submitAddInstallment({ accountSlug: resolvedAccountSlug, queryClient, values });
      if (showServiceToast(result)) {
        handleAddInstallmentOpenChange(false);
      }
    } finally {
      setAddInstallmentSubmitting(false);
    }
  };

  const [payInstallmentOpen, setPayInstallmentOpen] = useState(false);
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [pendingInstallment, setPendingInstallment] = useState<InstallmentItem | null>(null);

  const handlePayOpenChange = (open: boolean) => {
    setPayInstallmentOpen(open);
    if (!open) {
      setPaySubmitting(false);
      setPendingInstallment(null);
    }
  };

  const openPayInstallment = (installment: InstallmentItem) => {
    if (!ensureAccount()) {
      return;
    }
    setPendingInstallment(installment);
    handlePayOpenChange(true);
  };

  const handlePayInstallmentSubmit = async () => {
    if (!ensureAccount()) {
      return;
    }

    if (!pendingInstallment) {
      toast.error("Cicilan kamu nggak ketemu");
      return;
    }

    setPaySubmitting(true);

    try {
      const result = await submitPayInstallment({
        accountSlug: resolvedAccountSlug,
        queryClient,
        installmentId: pendingInstallment.id,
        installmentName: pendingInstallment.name,
      });

      if (showServiceToast(result)) {
        handlePayOpenChange(false);
      }
    } finally {
      setPaySubmitting(false);
    }
  };

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailInstallment, setDetailInstallment] = useState<InstallmentItem | null>(null);

  const handleDetailOpenChange = (open: boolean) => {
    setDetailOpen(open);
    if (!open) {
      setDetailInstallment(null);
    }
  };

  const openInstallmentDetail = (installment: InstallmentItem) => {
    if (!ensureAccount()) {
      return;
    }
    setDetailInstallment(installment);
    handleDetailOpenChange(true);
  };

  const headerConfig =
    activeTab === "accounts"
      ? {
          badge: { label: "Dompet", icon: <Wallet2 className="h-3.5 w-3.5" /> },
          title: "Dompet kamu aman terkendali",
          description: "Cek saldo terkini, tambah dompet baru, dan beresin semuanya santai aja.",
          quickActionLabel: "Tambah dompet baru",
          quickActionHandler: openAddWallet,
          quickActionDisabled: walletsLoading,
          quickActionIcon: Wallet2,
        }
      : {
          badge: { label: "Cicilan", icon: <CalendarClock className="h-3.5 w-3.5" /> },
          title: "Cicilan & tagihan biar nggak lupa",
          description: "Pantau jadwal bayar, tandai yang udah lunas, dan catat cicilan baru kapan pun.",
          quickActionLabel: "Tambah cicilan baru",
          quickActionHandler: openAddInstallment,
          quickActionDisabled: installmentsLoading,
          quickActionIcon: CalendarClock,
        };

  return (
    <div className="relative">
      <div
        className={cn(
          "space-y-6 px-4 pb-24 lg:px-8 transition",
          showAccountPlaceholder ? "pointer-events-none blur-sm max-h-[calc(100vh-12rem)]" : undefined
        )}
      >
        {unauthorizedError && <UnauthorizedAccessDialog open onRedirect={() => router.replace("/dashboard/wallet")} />}
        <PageHeader
          badge={headerConfig.badge}
          title={headerConfig.title}
          description={headerConfig.description}
          subContent={
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <Button
                size="lg"
                disabled={headerConfig.quickActionDisabled}
                onClick={headerConfig.quickActionHandler}
                className="h-auto w-full justify-start gap-2.5 rounded-lg bg-primary/10 px-3.5 py-2.5 text-left text-primary shadow-sm transition hover:bg-primary/15 disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
              >
                <span className="flex shrink-0 items-center justify-center rounded-full bg-primary/15 p-2 text-primary sm:p-2.5">
                  <headerConfig.quickActionIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold">{headerConfig.quickActionLabel}</span>
              </Button>
            </div>
          }
        />
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList>
            <TabsTrigger value="accounts" className="px-6">
              Dompet kamu
            </TabsTrigger>
            <TabsTrigger value="installments" className="px-6">
              Cicilan & tagihan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="mt-6">
            <WalletAccountsTab
              walletsLoading={walletsLoading}
              walletList={walletList}
              onAddWallet={openAddWallet}
              onIncrease={openIncreaseModal}
              onDecrease={openDecreaseModal}
            />
          </TabsContent>

          <TabsContent value="installments" className="mt-6">
            <WalletInstallmentsTab
              installmentsLoading={installmentsLoading}
              installmentList={installmentList}
              onAddInstallment={openAddInstallment}
              onPayInstallment={openPayInstallment}
              onShowDetail={openInstallmentDetail}
              formatDate={formatDate}
              getDaysUntilDue={getDaysUntilDue}
            />
          </TabsContent>
        </Tabs>

        <NewWalletShell
          open={addWalletOpen}
          submitting={addWalletSubmitting}
          onOpenChange={handleAddWalletOpenChange}
          onSubmit={handleAddWalletSubmit}
        />
        <AddBalanceShell
          open={increaseOpen}
          submitting={increaseSubmitting}
          walletList={walletList}
          selectedWalletId={selectedIncreaseWalletId}
          onOpenChange={handleIncreaseOpenChange}
          onSubmit={handleIncreaseSubmit}
        />
        <DecreaseBalanceShell
          open={decreaseOpen}
          submitting={decreaseSubmitting}
          walletList={walletList}
          selectedWalletId={selectedDecreaseWalletId}
          onOpenChange={handleDecreaseOpenChange}
          onSubmit={handleDecreaseSubmit}
        />
        <AddInstallmentShell
          open={addInstallmentOpen}
          submitting={addInstallmentSubmitting}
          onOpenChange={handleAddInstallmentOpenChange}
          onSubmit={handleAddInstallmentSubmit}
        />
        <CloseInstallmentShell
          open={payInstallmentOpen}
          submitting={paySubmitting}
          installment={pendingInstallment}
          onOpenChange={handlePayOpenChange}
          onConfirm={handlePayInstallmentSubmit}
        />
        <DetailInstallmentShell
          open={detailOpen}
          installment={detailInstallment}
          onOpenChange={handleDetailOpenChange}
        />
      </div>
      {showAccountPlaceholder ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-36 z-20 flex items-center justify-center px-4 lg:px-8">
          <NoAccountOverlay className="pointer-events-auto max-w-lg shadow-lg" />
        </div>
      ) : null}
    </div>
  );
}

export default WalletClient;
