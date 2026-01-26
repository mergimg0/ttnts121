"use client";

import { motion } from "motion/react";
import { ReactNode } from "react";

interface FloatingElementProps {
  children?: ReactNode;
  className?: string;
  duration?: number;
  distance?: number;
}

export function FloatingElement({
  children,
  className,
  duration = 3,
  distance = 10
}: FloatingElementProps) {
  return (
    <motion.div
      animate={{
        y: [0, -distance, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={className}
    >
      {children ?? null}
    </motion.div>
  );
}

export function BreathingElement({
  children,
  className,
  duration = 4
}: FloatingElementProps) {
  return (
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
        opacity: [0.7, 1, 0.7]
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={className}
    >
      {children ?? null}
    </motion.div>
  );
}

export function RotatingElement({
  children,
  className,
  duration = 20
}: FloatingElementProps) {
  return (
    <motion.div
      animate={{
        rotate: [0, 360]
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "linear"
      }}
      className={className}
    >
      {children ?? null}
    </motion.div>
  );
}
