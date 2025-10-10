import TransactionsClient from "../../transactions/rcc/transactions-client";
import { Suspense } from "react";

interface TransactionsPageProps {
  params: Promise<{ account: string }>;
}

export default async function TransactionsPage({ params }: TransactionsPageProps) {
  const { account } = await params;
  return (
    <Suspense fallback={null}>
      <TransactionsClient accountSlugOverride={account} />
    </Suspense>
  );
}
