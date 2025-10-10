import { cn, formatCompactCurrency } from "@/lib/utils";
import { useShowValues } from "@/components/providers/show-values-provider";

export function MaskedValue({ className, value }: { className?: string; value: number | string }) {
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
      {showValues ? (typeof value === "string" ? value : formatCompactCurrency(value)) : "*****"}
    </span>
  );
}
