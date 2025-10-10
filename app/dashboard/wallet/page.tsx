import WalletClient from "./rcc/wallet-client";
import { Suspense } from "react";

export default function WalletPage() {
  return (
    <Suspense fallback={null}>
      <WalletClient />
    </Suspense>
  );
}
