"use client";

import {
  forwardRef,
  useCallback,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
  type FocusEvent,
} from "react";
import { Calendar as CalendarIcon, X as XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type NativeInputProps = ComponentPropsWithoutRef<"input">;

type DatePickerProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  allowClear?: boolean;
  clearLabel?: string;
  locale?: string;
  disabled?: boolean;
  isRequired?: boolean;
  triggerClassName?: string;
  contentClassName?: string;
} & Omit<NativeInputProps, "value" | "defaultValue" | "type" | "onChange" | "required" | "disabled">;

const formatDateLabel = (date: Date, locale: string) => {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const toDateOrUndefined = (value?: string): Date | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const toISODateString = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const normalizeDate = (value?: string) => {
  const date = toDateOrUndefined(value);
  if (!date) {
    return undefined;
  }

  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return normalized;
};

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  {
    value,
    onChange,
    placeholder = "Pilih tanggal",
    min,
    max,
    allowClear = false,
    clearLabel = "Hapus tanggal",
    locale = "id-ID",
    disabled,
    isRequired,
    triggerClassName,
    contentClassName,
    id,
    name,
    onBlur,
    className,
    ...rest
  },
  ref,
) {
  const [open, setOpen] = useState(false);

  const selectedDate = useMemo(() => normalizeDate(value), [value]);
  const minDate = useMemo(() => normalizeDate(min), [min]);
  const maxDate = useMemo(() => normalizeDate(max), [max]);

  const displayLabel = selectedDate ? formatDateLabel(selectedDate, locale) : placeholder;
  const showClear = allowClear && Boolean(value) && !disabled;

  const handleSelect = useCallback(
    (nextDate?: Date) => {
      if (!nextDate) {
        if (allowClear) {
          onChange?.("");
        }
        return;
      }

      const normalized = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());
      onChange?.(toISODateString(normalized));
      setOpen(false);
    },
    [allowClear, onChange],
  );

  const handleClear = useCallback(() => {
    onChange?.("");
  }, [onChange]);

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      onBlur?.(event);
    },
    [onBlur],
  );

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={ref}
        id={id}
        name={name}
        type="hidden"
        value={value ?? ""}
        onChange={() => {
          /* noop to satisfy React */
        }}
        onBlur={handleBlur}
        required={isRequired}
        disabled={disabled}
        {...rest}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/80 px-4 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60",
              triggerClassName,
            )}
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={open}
          >
            <span className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className={cn(!selectedDate && "text-muted-foreground")}>{displayLabel}</span>
            </span>
            <span className="flex items-center gap-2">
              {showClear && (
                <button
                  type="button"
                  className="rounded-full p-1 text-muted-foreground transition hover:text-foreground"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleClear();
                  }}
                  aria-label={clearLabel}
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          className={cn(
            "w-auto rounded-2xl border border-border/70 bg-background/95 p-3 shadow-xl backdrop-blur",
            contentClassName,
          )}
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            defaultMonth={selectedDate ?? minDate ?? new Date()}
            disabled={(date) =>
              Boolean(
                (minDate && date < minDate) ||
                (maxDate && date > maxDate),
              )
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
});

DatePicker.displayName = "DatePicker";
