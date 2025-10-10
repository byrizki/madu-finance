import BudgetsClient from "./rcc/budgets-client";
import { Suspense } from "react";

export default function BudgetsPage() {
  return (
    <Suspense fallback={null}>
      <BudgetsClient />
    </Suspense>
  );
}
