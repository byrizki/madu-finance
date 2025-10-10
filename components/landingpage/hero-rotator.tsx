"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";

type HeroSequence = {
  tagline: string;
  heading: string;
  description: string;
};

const HOLD_DURATION = 10_000;
const DESCRIPTION_SPEED = 28;

const sequences: HeroSequence[] = [
  {
    tagline: "Ngatur duit nggak ribet",
    heading: "Semua arus kas kamu kumpul rapi di satu app.",
    description:
      "byMADU nemenin kamu catat transaksi, bikin anggaran, dan jaga kebiasaan finansial bareng orang tersayang.",
  },
  {
    tagline: "Langsung paham kondisinya",
    heading: "Visual duit yang bikin kamu ngerasa pegang kendali.",
    description: "Grafik dan insight-nya to the point, jadi kamu nggak perlu pusing baca angka panjang.",
  },
  {
    tagline: "Kerja tim jadi lebih seru",
    heading: "Ngatur anggaran bareng pasangan atau tim tanpa drama.",
    description: "Undang mereka, set tujuan bareng, dan rayakan setiap pencapaian kecil bareng-bareng.",
  },
  {
    tagline: "Tetap aman tiap saat",
    heading: "Keputusan finansial kamu tetap privat.",
    description: "Proteksi multi-faktor dan enkripsi bikin semua data aman dalam genggaman kamu.",
  },
];

function useTypedText(text: string, speed: number, trigger: number, enabled: boolean) {
  const [typed, setTyped] = useState<string>(text);

  useEffect(() => {
    if (!enabled) {
      setTyped(text);
      return;
    }

    setTyped("");
    let index = 0;
    let intervalId: number | undefined;
    if (text.length === 0) {
      setTyped("\u00a0");
      return;
    }

    intervalId = window.setInterval(() => {
      index += 1;
      setTyped(text.slice(0, index));
      if (index >= text.length && intervalId) {
        window.clearInterval(intervalId);
      }
    }, speed);

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [text, speed, trigger, enabled]);

  return typed.length > 0 ? typed : "\u00a0";
}

export function HeroRotator() {
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const currentSequence = useMemo(() => sequences[sequenceIndex], [sequenceIndex]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const typedDescription = useTypedText(currentSequence.description, DESCRIPTION_SPEED, sequenceIndex, isHydrated);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSequenceIndex((prev) => (prev + 1) % sequences.length);
    }, HOLD_DURATION);

    return () => {
      window.clearTimeout(timer);
    };
  }, [sequenceIndex]);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex min-h-[2.5rem] items-center">
        <AnimatePresence mode="wait" initial={isHydrated}>
          <motion.span
            key={`tag-${sequenceIndex}`}
            initial={isHydrated ? { opacity: 0, y: 12 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-sm font-semibold text-primary flex items-center gap-2"
            aria-live="polite"
          >
            <Sparkles className="h-4 w-4" />
            {currentSequence.tagline}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex min-h-[5.5rem] w-full items-center justify-center sm:min-h-[6.5rem]">
        <AnimatePresence mode="wait" initial={isHydrated}>
          <motion.h1
            key={`heading-${sequenceIndex}`}
            initial={isHydrated ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
            aria-live="polite"
          >
            {currentSequence.heading}
          </motion.h1>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex min-h-[4.25rem] w-full items-center justify-center sm:min-h-[4.75rem]">
        <AnimatePresence mode="wait" initial={isHydrated}>
          <motion.p
            key={`description-${sequenceIndex}`}
            initial={isHydrated ? { opacity: 0, y: 14 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="max-w-2xl text-base text-muted-foreground sm:text-lg"
            aria-live="polite"
          >
            <span>{typedDescription}</span>
            {isHydrated && (
              <motion.span
                key={`cursor-${sequenceIndex}-${typedDescription.length}`}
                className="ml-1 inline-block h-5 w-[2px] translate-y-1 bg-muted-foreground sm:h-6"
                initial={{ opacity: 1 }}
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              />
            )}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
