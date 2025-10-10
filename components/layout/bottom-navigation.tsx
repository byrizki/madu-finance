"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Wallet, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, LayoutGroup } from "motion/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMounted } from "@/hooks/use-is-mounted";

const navItems = [
  {
    name: "Dashboard",
    segment: null as string | null,
    icon: Home,
  },
  {
    name: "Anggaran & Transaksi",
    segment: "transactions",
    icon: FileText,
  },
  {
    name: "Dompet & Tagihan",
    segment: "wallet",
    icon: Wallet,
  },
  {
    name: "Profil",
    segment: "profile",
    icon: User,
  },
];

const KEYFRAME_STEPS = 7;

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function shuffle<T>(items: T[]): T[] {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function createNumericSequence(
  steps: number,
  min: number,
  max: number,
  { start, end }: { start?: number; end?: number } = {}
) {
  const sequence: number[] = Array.from({ length: steps }, () => Number(randomBetween(min, max).toFixed(2)));
  if (typeof start === "number") {
    sequence[0] = start;
  }
  if (typeof end === "number") {
    sequence[sequence.length - 1] = end;
  } else {
    sequence.push(sequence[0]);
  }
  return sequence;
}

function createCornerSequences(steps: number) {
  const topLeft: string[] = [];
  const topRight: string[] = [];
  const bottomRight: string[] = [];
  const bottomLeft: string[] = [];

  for (let i = 0; i < steps; i += 1) {
    const base = randomBetween(56, 70);
    const offsets = shuffle([-12, -7, 6, 11]).map((offset) => offset + randomBetween(-2, 2));
    const values = offsets.map((offset) => clamp(base + offset, 32, 80));
    topLeft.push(`${values[0].toFixed(1)}%`);
    topRight.push(`${values[1].toFixed(1)}%`);
    bottomRight.push(`${values[2].toFixed(1)}%`);
    bottomLeft.push(`${values[3].toFixed(1)}%`);
  }

  topLeft.push(topLeft[0]);
  topRight.push(topRight[0]);
  bottomRight.push(bottomRight[0]);
  bottomLeft.push(bottomLeft[0]);

  return { topLeft, topRight, bottomRight, bottomLeft };
}

function createMotionConfig() {
  const positionDuration = randomBetween(7.4, 10.2);
  const borderDuration = randomBetween(9.0, 12.4);
  const glowDuration = randomBetween(4.6, 6.4);
  const spinDuration = randomBetween(10, 12.2);

  return {
    x: createNumericSequence(KEYFRAME_STEPS, -3.2, 3.2, { start: 0, end: 0 }),
    y: createNumericSequence(KEYFRAME_STEPS, -2.1, 2.1, { start: 0, end: 0 }),
    scale: createNumericSequence(KEYFRAME_STEPS, 0.99, 1.03, { start: 1, end: 1 }),
    corners: createCornerSequences(KEYFRAME_STEPS),
    durations: {
      position: positionDuration,
      border: borderDuration,
      glow: glowDuration,
      rotate: spinDuration,
    },
  };
}

export function BottomNavigation() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const staticTargets = new Set(["transactions", "wallet", "profile"]);
  const isMounted = useIsMounted();
  const [animationRun, setAnimationRun] = useState(false);

  useEffect(() => {
    if (isMounted) {
      setAnimationRun(true);
    }
  }, [isMounted]);

  const secondary = segments[1];
  const hasAccountSlug = Boolean(secondary && !staticTargets.has(secondary));
  const accountBase = hasAccountSlug ? `/dashboard/${secondary}` : "/dashboard";
  const motionConfigs = useMemo(() => navItems.map(() => createMotionConfig()), []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 flex justify-center lg:bottom-5">
      <div className="pointer-events-auto w-auto px-4 min-w-[96vw] sm:min-w-[24rem] lg:px-0">
        <LayoutGroup id="bottom-navigation">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-around gap-2.5 rounded-3xl border border-border/50 bg-background/90 px-3.5 py-2.5 shadow-[0_12px_24px_rgba(15,23,42,0.16)] backdrop-blur transition-colors dark:border-white/15 dark:bg-[linear-gradient(140deg,rgba(99,102,241,0.16)_0%,rgba(15,23,42,0.82)_48%,rgba(15,23,42,0.94)_100%)] dark:shadow-[0_26px_58px_rgba(2,6,23,0.6)] dark:ring-1 dark:ring-primary/25 dark:backdrop-blur-xl">
            {navItems.map((item, index) => {
              const href = item.segment ? `${accountBase}/${item.segment}` : accountBase;
              const isRoot = item.segment === null;
              const isActive =
                animationRun && (isRoot ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
              const Icon = item.icon;
              const config = motionConfigs[index];

              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link
                      href={href}
                      className={cn(
                        "relative flex h-11 w-11 items-center justify-center rounded-full transition-colors",
                        isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {isActive ? (
                        <motion.span
                          layoutId="bottom-nav-active"
                          className="absolute inset-0 overflow-hidden bg-primary shadow-[0_3px_8px_rgba(0,0,0,0.08)] dark:bg-primary/85 dark:shadow-[0_10px_24px_rgba(17,24,39,0.45)]"
                          initial={{
                            x: config.x[0],
                            y: config.y[0],
                            scale: config.scale[0],
                            rotate: 0,
                            borderTopLeftRadius: config.corners.topLeft[0],
                            borderTopRightRadius: config.corners.topRight[0],
                            borderBottomRightRadius: config.corners.bottomRight[0],
                            borderBottomLeftRadius: config.corners.bottomLeft[0],
                          }}
                          animate={{
                            x: config.x,
                            y: config.y,
                            scale: config.scale,
                            rotate: [0, 360],
                            borderTopLeftRadius: config.corners.topLeft,
                            borderTopRightRadius: config.corners.topRight,
                            borderBottomRightRadius: config.corners.bottomRight,
                            borderBottomLeftRadius: config.corners.bottomLeft,
                          }}
                          transition={{
                            layout: { type: "spring", stiffness: 380, damping: 28 },
                            x: {
                              repeat: Infinity,
                              repeatType: "loop",
                              duration: config.durations.position,
                              ease: "easeInOut",
                            },
                            y: {
                              repeat: Infinity,
                              repeatType: "loop",
                              duration: config.durations.position * 1.15,
                              ease: "easeInOut",
                            },
                            scale: {
                              repeat: Infinity,
                              repeatType: "loop",
                              duration: config.durations.position * 0.92,
                              ease: "easeInOut",
                            },
                            rotate: {
                              repeat: Infinity,
                              repeatType: "loop",
                              duration: config.durations.rotate,
                              ease: "linear",
                            },
                            borderTopLeftRadius: {
                              repeat: Infinity,
                              repeatType: "loop",
                              duration: config.durations.border,
                              ease: "easeInOut",
                            },
                            borderTopRightRadius: {
                              repeat: Infinity,
                              repeatType: "loop",
                              duration: config.durations.border * 1.08,
                              ease: "easeInOut",
                            },
                            borderBottomRightRadius: {
                              repeat: Infinity,
                              repeatType: "loop",
                              duration: config.durations.border * 0.94,
                              ease: "easeInOut",
                            },
                            borderBottomLeftRadius: {
                              repeat: Infinity,
                              repeatType: "loop",
                              duration: config.durations.border * 1.12,
                              ease: "easeInOut",
                            },
                          }}
                        >
                          <motion.span
                            className="absolute -inset-2 bg-primary/30 blur-lg dark:bg-primary/45"
                            initial={{
                              opacity: 0.35,
                              scale: 1,
                              borderTopLeftRadius: config.corners.topLeft[0],
                              borderTopRightRadius: config.corners.topRight[0],
                              borderBottomRightRadius: config.corners.bottomRight[0],
                              borderBottomLeftRadius: config.corners.bottomLeft[0],
                            }}
                            animate={{
                              opacity: [0.35, 0.18, 0.35],
                              scale: [1, 1.12, 1],
                              borderTopLeftRadius: config.corners.topLeft,
                              borderTopRightRadius: config.corners.topRight,
                              borderBottomRightRadius: config.corners.bottomRight,
                              borderBottomLeftRadius: config.corners.bottomLeft,
                            }}
                            transition={{
                              opacity: { repeat: Infinity, duration: config.durations.glow, ease: "easeInOut" },
                              scale: { repeat: Infinity, duration: config.durations.glow * 1.15, ease: "easeInOut" },
                              borderTopLeftRadius: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: config.durations.border,
                                ease: "easeInOut",
                              },
                              borderTopRightRadius: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: config.durations.border * 1.05,
                                ease: "easeInOut",
                              },
                              borderBottomRightRadius: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: config.durations.border * 0.9,
                                ease: "easeInOut",
                              },
                              borderBottomLeftRadius: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: config.durations.border * 1.17,
                                ease: "easeInOut",
                              },
                            }}
                          />
                          <motion.span
                            className="absolute inset-0 bg-primary/28 dark:bg-primary/40"
                            initial={{
                              borderTopLeftRadius: config.corners.topLeft[0],
                              borderTopRightRadius: config.corners.topRight[0],
                              borderBottomRightRadius: config.corners.bottomRight[0],
                              borderBottomLeftRadius: config.corners.bottomLeft[0],
                            }}
                            animate={{
                              borderTopLeftRadius: config.corners.topLeft,
                              borderTopRightRadius: config.corners.topRight,
                              borderBottomRightRadius: config.corners.bottomRight,
                              borderBottomLeftRadius: config.corners.bottomLeft,
                            }}
                            transition={{
                              borderTopLeftRadius: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: config.durations.border,
                                ease: "easeInOut",
                              },
                              borderTopRightRadius: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: config.durations.border * 1.04,
                                ease: "easeInOut",
                              },
                              borderBottomRightRadius: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: config.durations.border * 0.97,
                                ease: "easeInOut",
                              },
                              borderBottomLeftRadius: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: config.durations.border * 1.12,
                                ease: "easeInOut",
                              },
                            }}
                          />
                        </motion.span>
                      ) : null}
                      <span className="relative z-10 flex h-full w-full items-center justify-center rounded-full">
                        <Icon className="h-4.5 w-4.5" />
                        <span className="sr-only">{item.name}</span>
                      </span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </LayoutGroup>
      </div>
    </div>
  );
}
