export function censorEmail(email: string): string {
  if (!email || typeof email !== "string") {
    return "";
  }

  const trimmed = email.trim();
  const [local, domain] = trimmed.split("@");

  if (!local || !domain) {
    return "***";
  }

  if (local.length <= 2) {
    return `${local[0] ?? "*"}***@${domain}`;
  }

  const visiblePrefix = local.slice(0, 2);
  return `${visiblePrefix}${"*".repeat(Math.max(3, local.length - 2))}@${domain}`;
}
