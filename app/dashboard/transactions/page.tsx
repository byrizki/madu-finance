import TransactionsClient from "./rcc/transactions-client";
import { Suspense } from "react";

export default function TransactionsPage() {
  return (
    <Suspense fallback={null}>
      <TransactionsClient />
    </Suspense>
  );
}
