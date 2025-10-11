"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type FocusEvent,
} from "react";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type BaseInputProps = ComponentPropsWithoutRef<"input">;

export interface CurrencyInputProps
  extends Omit<BaseInputProps, "type" | "value" | "defaultValue" | "onChange" | "onBlur"> {
  value?: string | number;
  onValueChange?: (value: string) => void;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  locale?: string;
  currency?: string;
  showSymbol?: boolean;
  allowNegative?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  isRequired?: boolean;
  inputClassName?: string;
}

const DEFAULT_MIN_FRACTION = 0;
const DEFAULT_MAX_FRACTION = 2;

const getFormatter = (
  locale: string,
  currency: string,
  showSymbol: boolean,
  minimumFractionDigits: number,
  maximumFractionDigits: number,
) => {
  return new Intl.NumberFormat(locale, {
    style: showSymbol ? "currency" : "decimal",
    currency: showSymbol ? currency : undefined,
    minimumFractionDigits,
    maximumFractionDigits,
  });
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const sanitizeValue = (
  input: string,
  allowNegative: boolean,
  maximumFractionDigits: number,
  decimalSymbol: string,
  groupSymbol: string,
) => {
  if (!input) {
    return "";
  }

  let normalized = input;

  if (groupSymbol) {
    const groupRegex = new RegExp(escapeRegex(groupSymbol), "g");
    normalized = normalized.replace(groupRegex, "");
  }

  if (decimalSymbol && decimalSymbol !== ".") {
    const decimalRegex = new RegExp(escapeRegex(decimalSymbol), "g");
    normalized = normalized.replace(decimalRegex, ".");
  }

  normalized = normalized.replace(/[^0-9.-]/g, "");

  const negativeAllowed = allowNegative && normalized.trim().startsWith("-");
  normalized = normalized.replace(/-/g, "");

  const lastDotIndex = normalized.lastIndexOf(".");
  const hasDecimal = lastDotIndex !== -1;
  const hasTrailingDecimal = hasDecimal && lastDotIndex === normalized.length - 1;

  let integerPart = hasDecimal ? normalized.slice(0, lastDotIndex) : normalized;
  let fractionPart = hasDecimal ? normalized.slice(lastDotIndex + 1) : "";

  integerPart = integerPart.replace(/\./g, "");
  if (!integerPart) {
    integerPart = "0";
  }

  fractionPart = fractionPart.replace(/\./g, "").slice(0, Math.max(0, maximumFractionDigits));

  const sign = negativeAllowed ? "-" : "";
  if (fractionPart) {
    return `${sign}${integerPart}.${fractionPart}`;
  }

  if (hasTrailingDecimal && maximumFractionDigits > 0) {
    return `${sign}${integerPart}.`;
  }

  return `${sign}${integerPart}`;
};

const parseToNumber = (value?: string | number) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const numeric = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(numeric) ? numeric : undefined;
};

const normalizeSanitizedValue = (value: string) => {
  if (!value) {
    return "";
  }

  if (value === "-") {
    return "";
  }

  if (value.endsWith(".")) {
    return value.slice(0, -1);
  }

  return value;
};

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(function CurrencyInput(
  {
    value,
    onValueChange,
    locale = "id-ID",
    currency = "IDR",
    showSymbol = true,
    allowNegative = false,
    allowClear = false,
    clearLabel = "Hapus nilai",
    minimumFractionDigits = DEFAULT_MIN_FRACTION,
    maximumFractionDigits = DEFAULT_MAX_FRACTION,
    isRequired,
    inputClassName,
    disabled,
    name,
    id,
    placeholder,
    onFocus: onFocusProp,
    onBlur: onBlurProp,
    className,
    ...rest
  },
  ref,
) {
  const [isFocused, setIsFocused] = useState(false);
  const [draftValue, setDraftValue] = useState<string>("");

  const formatter = useMemo(
    () => getFormatter(locale, currency, showSymbol, minimumFractionDigits, maximumFractionDigits),
    [currency, locale, showSymbol, minimumFractionDigits, maximumFractionDigits],
  );

  const integerFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        useGrouping: true,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [locale],
  );

  const decimalSeparator = useMemo(() => {
    const parts = formatter.formatToParts(1.1);
    return parts.find((part) => part.type === "decimal")?.value ?? ",";
  }, [formatter]);

  const groupSeparator = useMemo(() => {
    const parts = formatter.formatToParts(1000);
    return parts.find((part) => part.type === "group")?.value ?? ".";
  }, [formatter]);

  const numericValue = parseToNumber(value);

  useEffect(() => {
    if (!isFocused) {
      const stringValue = value === undefined || value === null ? "" : String(value);
      setDraftValue(
        sanitizeValue(stringValue, allowNegative, maximumFractionDigits, decimalSeparator, groupSeparator),
      );
    }
  }, [value, isFocused, allowNegative, maximumFractionDigits, decimalSeparator, groupSeparator]);

  const formattedValue = useMemo(() => {
    if (numericValue === undefined) {
      return "";
    }
    return formatter.format(numericValue);
  }, [numericValue, formatter]);

  const formatEditableValue = useCallback(
    (raw: string) => {
      if (!raw) {
        return "";
      }

      if (raw === "-") {
        return "-";
      }

      const negative = raw.startsWith("-");
      const unsigned = negative ? raw.slice(1) : raw;
      const [integerPartRaw, fractionPartRaw] = unsigned.split(".");

      const formattedInteger = integerFormatter.format(Number(integerPartRaw || "0"));
      const sign = negative ? "-" : "";

      if (fractionPartRaw === undefined) {
        return `${sign}${formattedInteger}`;
      }

      if (fractionPartRaw.length === 0) {
        return `${sign}${formattedInteger}${decimalSeparator}`;
      }

      return `${sign}${formattedInteger}${decimalSeparator}${fractionPartRaw}`;
    },
    [decimalSeparator, integerFormatter],
  );

  const displayValue = isFocused ? formatEditableValue(draftValue) : formattedValue;
  const showClearButton = allowClear && !disabled && Boolean(value) && !isFocused;

  const emitValueChange = useCallback(
    (nextValue: string) => {
      onValueChange?.(nextValue);
    },
    [onValueChange],
  );

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      setDraftValue((prev) => {
        if (prev) {
          return prev;
        }
        const stringValue = value === undefined || value === null ? "" : String(value);
        return sanitizeValue(
          stringValue,
          allowNegative,
          maximumFractionDigits,
          decimalSeparator,
          groupSeparator,
        );
      });
      onFocusProp?.(event);
    },
    [allowNegative, decimalSeparator, groupSeparator, maximumFractionDigits, onFocusProp, value],
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      const normalized = normalizeSanitizedValue(draftValue);
      const current = value === undefined || value === null ? "" : String(value);
      if (normalized !== current) {
        emitValueChange(normalized);
      }
      onBlurProp?.(event);
    },
    [draftValue, emitValueChange, onBlurProp, value],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      const sanitized = sanitizeValue(raw, allowNegative, maximumFractionDigits, decimalSeparator, groupSeparator);
      setDraftValue(sanitized);
      emitValueChange(sanitized);
    },
    [allowNegative, decimalSeparator, emitValueChange, groupSeparator, maximumFractionDigits],
  );

  const handleClear = useCallback(() => {
    setDraftValue("");
    emitValueChange("");
  }, [emitValueChange]);

  const hiddenValue = normalizeSanitizedValue(value === undefined || value === null ? "" : String(value));

  return (
    <div className={cn("relative w-full", className)}>
      <input type="hidden" name={name} value={hiddenValue} required={isRequired} />
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        id={id}
        value={displayValue}
        placeholder={placeholder}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        disabled={disabled}
        aria-required={isRequired}
        className={cn(
          "w-full rounded-2xl border border-border/60 bg-background/80 px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60",
          inputClassName,
        )}
        {...rest}
      />
      {showClearButton && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-2 flex items-center justify-center rounded-full p-1 text-muted-foreground transition hover:text-foreground"
          aria-label={clearLabel}
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
);

CurrencyInput.displayName = "CurrencyInput";
