import { cn, formatCompactCurrency, formatCurrency } from "@/lib/utils";
import { useShowValues } from "@/components/providers/show-values-provider";

export function MaskedValue({
  className,
  value,
  compact = false,
}: {
  className?: string;
  value: number | string;
  compact?: boolean;
}) {
  const { showValues, toggleShowValues } = useShowValues();

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        toggleShowValues();
      }}
      className={cn(
        "cursor-pointer block",
        {
          "!text-foreground/60 !font-semibold tracking-widest !font-mono !text-sm": !showValues,
        },
        className
      )}
    >
      {showValues
        ? typeof value === "string"
          ? value
          : compact
          ? formatCompactCurrency(value)
          : formatCurrency(value)
        : "*****"}
    </span>
  );
}
