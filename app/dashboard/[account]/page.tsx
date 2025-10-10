import DashboardClient from "../dashboard/rcc/dashboard-client";

interface DashboardPageProps {
  params: Promise<{ account: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { account } = await params;
  return <DashboardClient accountSlugOverride={account} />;
}
