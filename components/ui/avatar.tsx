"use client";

import * as React from "react";
import Image from "next/image";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn("relative flex size-8 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  );
}

type AvatarImageProps = Omit<React.ComponentProps<typeof Image>, "fill"> & {
  fill?: boolean;
};

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, fill, onLoadingComplete, onError, ...props }, ref) => {
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [hasError, setHasError] = React.useState(false);

    React.useEffect(() => {
      setIsLoaded(false);
      setHasError(false);
    }, [props.src]);

    const shouldFill = fill ?? (props.width === undefined && props.height === undefined);
    const showSkeleton = !isLoaded && !hasError;

    const handleLoadingComplete = React.useCallback(
      (img: HTMLImageElement) => {
        setIsLoaded(true);
        onLoadingComplete?.(img);
      },
      [onLoadingComplete]
    );

    const handleError = React.useCallback(
      (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        setHasError(true);
        onError?.(event);
      },
      [onError]
    );

    return (
      <>
        {showSkeleton ? (
          <Skeleton
            aria-hidden
            className="pointer-events-none absolute inset-0 size-full rounded-full"
          />
        ) : null}
        <Image
          ref={ref}
          data-slot="avatar-image"
          className={cn("size-full object-cover", className)}
          {...props}
          {...(shouldFill ? { fill: true } : {})}
          onLoadingComplete={handleLoadingComplete}
          onError={handleError}
          alt={props.alt || "Avatar"}
        />
      </>
    );
  }
);

AvatarImage.displayName = "AvatarImage";

function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn("bg-muted flex size-full items-center justify-center rounded-full", className)}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
