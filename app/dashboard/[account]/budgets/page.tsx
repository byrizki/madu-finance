import BudgetsClient from "../../budgets/rcc/budgets-client";

interface BudgetsPageProps {
  params: Promise<{ account: string }>;
}

export default async function BudgetsPage({ params }: BudgetsPageProps) {
  const { account } = await params;
  return <BudgetsClient accountSlugOverride={account} />;
}
