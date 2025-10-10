"use client";

import { motion, type Variants } from "motion/react";
import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  BriefcaseBusiness,
  Calculator,
  CircleDollarSign,
  Coins,
  CreditCard,
  Landmark,
  PiggyBank,
  ReceiptText,
  Vault,
  TrendingUp,
  Wallet,
} from "lucide-react";

interface IconConfig {
  Icon: LucideIcon;
  x: number;
  y: number;
  delay: number;
  duration: number;
}

const icons: IconConfig[] = [
  { Icon: Wallet, x: 12, y: 15, delay: 0, duration: 12 },
  { Icon: PiggyBank, x: 22, y: 72, delay: 1.4, duration: 14 },
  { Icon: TrendingUp, x: 8, y: 40, delay: 0.9, duration: 11 },
  { Icon: CreditCard, x: 86, y: 22, delay: 1.9, duration: 13 },
  { Icon: Coins, x: 90, y: 68, delay: 2.3, duration: 15 },
  { Icon: ReceiptText, x: 78, y: 10, delay: 0.5, duration: 10 },
  { Icon: Banknote, x: 15, y: 5, delay: 2.8, duration: 16 },
  { Icon: CircleDollarSign, x: 95, y: 48, delay: 1.1, duration: 12 },
  { Icon: Calculator, x: 5, y: 82, delay: 1.6, duration: 14 },
  { Icon: BriefcaseBusiness, x: 82, y: 90, delay: 2.5, duration: 13 },
  { Icon: Vault, x: 10, y: 90, delay: 0.7, duration: 12 },
  { Icon: Landmark, x: 88, y: 5, delay: 3.1, duration: 16 },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.18,
      delayChildren: 0.25,
    },
  },
};

const iconVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function FloatingFinanceIcons() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-0"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {icons.map(({ Icon, x, y, delay, duration }, index) => (
        <motion.div
          key={`${Icon.displayName ?? Icon.name}-${x}-${y}-${delay}`}
          variants={iconVariants}
          className="absolute"
          style={{
            top: `${y}%`,
            left: `${x}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <motion.div
            className="rounded-full bg-primary/10 p-4 text-primary shadow-[0_12px_28px_rgba(59,130,246,0.18)] backdrop-blur-xl"
            animate={{
              opacity: [0.6, 1, 0.6],
              scale: [0.9, 1.08, 0.9],
              y: [6, -6, 6],
              rotate: [-5, 5, -5],
            }}
            transition={{
              duration,
              delay: delay + index * 0.15,
              repeat: Infinity,
              repeatType: "loop",
              ease: [0.42, 0, 0.58, 1],
            }}
            aria-hidden="true"
          >
            <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  );
}
