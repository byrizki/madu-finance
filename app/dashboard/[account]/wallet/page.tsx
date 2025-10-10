import WalletClient from "../../wallet/rcc/wallet-client";

interface WalletPageProps {
  params: Promise<{ account: string }>;
}

export default async function WalletPage({ params }: WalletPageProps) {
  const { account } = await params;
  return <WalletClient accountSlugOverride={account} />;
}
