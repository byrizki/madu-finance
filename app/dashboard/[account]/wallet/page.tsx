import { Suspense } from "react";
import WalletClient from "../../wallet/rcc/wallet-client";

interface WalletPageProps {
  params: Promise<{ account: string }>;
}

export default async function WalletPage({ params }: WalletPageProps) {
  const { account } = await params;
  return (
    <Suspense fallback={null}>
      <WalletClient accountSlugOverride={account} />
    </Suspense>
  );
}
