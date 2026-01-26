# Implementation Plan: Award-Winning "Playground Energy" Redesign

**Generated:** 2026-01-24
**Project:** /Users/mghome/projects/ttnts121
**Stack:** Next.js 16.1.4, React 19, Tailwind CSS 4, Radix UI

---

## Goal

Transform the Take The Next Step 121 website from a corporate, generic design into an award-winning "Playground Energy" aesthetic that feels like recess - energetic, joyful, and dynamic. The site should immediately communicate "kids football fun" while maintaining professional credibility for parents.

---

## Current State Analysis

### Typography
- **Issue:** Using Inter font (generic, AI-default)
- **Impact:** No distinctive personality, blends with generic sites

### Color Palette
- **Issue:** Black/white/corporate blue (#2E3192, #00AEEF)
- **Impact:** Sterile, no warmth, no "kids" feeling

### Layout
- **Issue:** Every section follows identical pattern (centered heading, grid of 3)
- **Impact:** Predictable, monotonous, forgettable

### Motion
- **Issue:** Only basic hover states (.hover-lift class)
- **Impact:** Static, lifeless, no energy

### Visual Identity
- **Issue:** Zero photos of kids playing football
- **Impact:** Abstract, disconnected from actual experience

### Performance
- **Issue:** No dynamic imports, Suspense, barrel import issues with lucide-react
- **Impact:** Larger bundle size, slower initial load

---

## Implementation Phases

---

## Phase 1: Typography & Color Foundation

**Estimated Time:** 30 minutes
**Risk Level:** Low

### 1.1 Install Google Fonts

**File:** `src/app/layout.tsx`

**Steps:**
1. Import Archivo_Black and DM_Sans from next/font/google
2. Remove Inter font configuration
3. Set CSS variables for both fonts
4. Apply font-display: swap for performance

**Code Changes:**
```typescript
// Replace
import { Inter } from "next/font/google";
const inter = Inter({ ... });

// With
import { Archivo_Black, DM_Sans } from "next/font/google";
const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});
```

### 1.2 Update CSS Color Variables

**File:** `src/app/globals.css`

**Current Colors:**
```css
--background: #ffffff;
--foreground: #0a0a0a;
--brand-navy: #2E3192;
--brand-blue: #00AEEF;
--gold: #F5A623;
```

**New Color System:**
```css
/* Warm background - cream tint */
--background: #FEFCF8;
--background-alt: #FFF9F0;

/* Text colors */
--foreground: #1A1A1A;
--foreground-muted: #4A4A4A;

/* Energy colors */
--grass-green: #2ECC71;
--grass-dark: #27AE60;
--energy-orange: #FF6B35;
--energy-yellow: #FFD93D;
--sky-blue: #3498DB;

/* Accent - keep brand colors but add vibrancy */
--brand-navy: #2E3192;
--brand-blue: #00AEEF;
--gold: #F5A623;

/* Gradients */
--gradient-energy: linear-gradient(135deg, var(--energy-orange), var(--energy-yellow));
--gradient-grass: linear-gradient(180deg, var(--grass-green), var(--grass-dark));
```

### 1.3 Update Tailwind Theme

**File:** `src/app/globals.css`

**Add to @theme inline:**
```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-body);
  --font-display: var(--font-display);

  /* New color utilities */
  --color-grass: var(--grass-green);
  --color-energy: var(--energy-orange);
  --color-sunshine: var(--energy-yellow);
}
```

### 1.4 Add Display Font Utility Classes

**File:** `src/app/globals.css`

```css
/* Display headings */
.font-display {
  font-family: var(--font-display), system-ui, sans-serif;
  font-weight: 900;
  letter-spacing: -0.02em;
}

/* Replace .text-bold-display */
.heading-display {
  font-family: var(--font-display), system-ui, sans-serif;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  line-height: 0.95;
}
```

### Verification - Phase 1:
- [ ] Run `npm run build` - no TypeScript errors
- [ ] Check fonts load in browser DevTools Network tab
- [ ] Verify warm background is visible
- [ ] Check heading font is Archivo Black (thick, bold)
- [ ] Check body text is DM Sans (clean, readable)

---

## Phase 2: Motion & Animation System

**Estimated Time:** 1 hour
**Risk Level:** Low

### 2.1 Install Motion Library

```bash
npm install motion
```

### 2.2 Create Animation Components

**New File:** `src/lib/motion.tsx`

```typescript
"use client";

import { motion, type Variants } from "motion/react";
import { ReactNode } from "react";

// Fade in from bottom
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

// Fade in from left
export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

// Scale up
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

// Stagger children
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

// Reusable components
interface AnimatedProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FadeInUp({ children, className, delay = 0 }: AnimatedProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={fadeInUp}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInLeft({ children, className, delay = 0 }: AnimatedProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={fadeInLeft}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({ children, className, delay = 0 }: AnimatedProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={scaleIn}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerChildren({ children, className }: AnimatedProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// For grid items that stagger
export function StaggerItem({ children, className }: AnimatedProps) {
  return (
    <motion.div variants={fadeInUp} className={className}>
      {children}
    </motion.div>
  );
}
```

### 2.3 Create Floating Element Component

**New File:** `src/components/ui/floating-element.tsx`

```typescript
"use client";

import { motion } from "motion/react";
import { ReactNode } from "react";

interface FloatingElementProps {
  children: ReactNode;
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
      {children}
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
      {children}
    </motion.div>
  );
}
```

### 2.4 Create Animated Counter

**New File:** `src/components/ui/animated-counter.tsx`

```typescript
"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "motion/react";

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
  duration = 2,
  className
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;

    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      className={className}
    >
      {prefix}{count.toLocaleString()}{suffix}
    </motion.span>
  );
}
```

### 2.5 Add CSS Animation Utilities

**File:** `src/app/globals.css`

```css
/* Keyframe animations */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.4); }
  50% { box-shadow: 0 0 20px 10px rgba(255, 107, 53, 0); }
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Utility classes */
.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient-shift 4s ease infinite;
}
```

### Verification - Phase 2:
- [ ] Run `npm run build` - no errors
- [ ] Test FadeInUp component renders and animates
- [ ] Test FloatingElement has smooth infinite animation
- [ ] Test AnimatedCounter counts up on scroll into view

---

## Phase 3: Hero Section Redesign

**Estimated Time:** 2 hours
**Risk Level:** Medium

### 3.1 Create Hero Background Component

**New File:** `src/components/sections/hero-background.tsx`

```typescript
"use client";

import { motion } from "motion/react";
import { FloatingElement, BreathingElement } from "@/components/ui/floating-element";

export function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient orbs */}
      <BreathingElement
        className="absolute -right-20 top-20 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-energy-orange/20 to-energy-yellow/10 blur-3xl"
        duration={6}
      />
      <BreathingElement
        className="absolute -left-40 bottom-0 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-grass-green/15 to-sky-blue/10 blur-3xl"
        duration={5}
      />

      {/* Floating footballs - positioned for visual interest */}
      <FloatingElement
        className="absolute right-[15%] top-[20%] opacity-10"
        duration={4}
        distance={15}
      >
        <FootballIcon className="h-16 w-16 text-foreground" />
      </FloatingElement>

      <FloatingElement
        className="absolute left-[10%] bottom-[30%] opacity-5"
        duration={5}
        distance={12}
      >
        <FootballIcon className="h-24 w-24 text-foreground" />
      </FloatingElement>

      <FloatingElement
        className="absolute right-[25%] bottom-[20%] opacity-8"
        duration={3.5}
        distance={8}
      >
        <FootballIcon className="h-12 w-12 text-foreground" />
      </FloatingElement>

      {/* Geometric decorations */}
      <div className="absolute left-0 top-1/4 h-px w-32 bg-gradient-to-r from-transparent via-energy-orange/30 to-transparent" />
      <div className="absolute right-0 bottom-1/3 h-px w-48 bg-gradient-to-l from-transparent via-grass-green/30 to-transparent" />
    </div>
  );
}

function FootballIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" className={className}>
      <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M50 2 L50 98 M2 50 L98 50 M15 15 L85 85 M85 15 L15 85" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
    </svg>
  );
}
```

### 3.2 Redesign Hero Component

**File:** `src/components/sections/hero.tsx`

**Key Changes:**
1. Change from centered to asymmetric 2-column layout on desktop
2. Add animated entrance for all elements
3. Integrate HeroBackground component
4. Add floating testimonial card
5. Animate headline with staggered reveal
6. Add urgency badge
7. Make stats animate with counters

**New Structure:**
```typescript
"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { HeroBackground } from "@/components/sections/hero-background";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { FadeInUp, FadeInLeft, StaggerChildren, StaggerItem } from "@/lib/motion";
import { Shield, Award, FileCheck, ArrowRight, Star, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background py-16 sm:py-24 lg:py-32">
      <HeroBackground />

      <Container className="relative">
        {/* Two-column layout on desktop */}
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">

          {/* Left column - Content */}
          <div className="max-w-xl">
            {/* Urgency badge */}
            <FadeInUp>
              <span className="inline-flex items-center gap-2 rounded-full bg-energy-orange/10 px-4 py-2 text-sm font-semibold text-energy-orange">
                <Sparkles className="h-4 w-4" />
                Limited spots for February term
              </span>
            </FadeInUp>

            {/* Main heading with staggered animation */}
            <motion.h1
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.1 } }
              }}
              className="mt-6 font-display text-5xl tracking-tight text-foreground sm:text-6xl lg:text-7xl"
            >
              <motion.span
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className="block"
              >
                Where Shy Kids
              </motion.span>
              <motion.span
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className="block text-brand-navy"
              >
                Become
              </motion.span>
              <motion.span
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className="block relative"
              >
                Team Players
                {/* Animated underline */}
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
                  className="absolute bottom-2 left-0 h-3 w-full bg-energy-yellow/40 -z-10 origin-left"
                />
              </motion.span>
            </motion.h1>

            {/* Subheading */}
            <FadeInUp delay={0.3}>
              <p className="mt-6 text-lg text-foreground-muted leading-relaxed">
                Fun football coaching that builds confidence, not pressure.{" "}
                <span className="font-semibold text-foreground">Ages 4-11</span> in{" "}
                <span className="font-semibold text-foreground">Luton</span>,{" "}
                <span className="font-semibold text-foreground">Barton Le Clay</span> &{" "}
                <span className="font-semibold text-foreground">Silsoe</span>.
              </p>
            </FadeInUp>

            {/* Trust badges */}
            <FadeInUp delay={0.4}>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground-muted">
                  <Shield className="h-4 w-4 text-grass-green" />
                  FA Qualified
                </span>
                <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground-muted">
                  <Award className="h-4 w-4 text-grass-green" />
                  DBS Checked
                </span>
                <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground-muted">
                  <FileCheck className="h-4 w-4 text-grass-green" />
                  Fully Insured
                </span>
              </div>
            </FadeInUp>

            {/* CTA buttons */}
            <FadeInUp delay={0.5}>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button size="lg" className="group" asChild>
                  <Link href="/book">
                    Book Your Free Trial
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/sessions">See Session Times</Link>
                </Button>
              </div>
              <p className="mt-3 text-sm text-foreground-muted">
                No commitment required. Full refund if your child doesn't love it.
              </p>
            </FadeInUp>
          </div>

          {/* Right column - Image placeholder + testimonial card */}
          <div className="relative lg:pl-8">
            {/* Image placeholder - for real photos later */}
            <FadeInLeft delay={0.3}>
              <div className="relative aspect-[4/5] rounded-2xl bg-gradient-to-br from-grass-green/10 to-sky-blue/10 overflow-hidden">
                {/* Placeholder pattern */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="mx-auto h-24 w-24 rounded-full bg-grass-green/20 flex items-center justify-center mb-4">
                      <span className="text-4xl">⚽</span>
                    </div>
                    <p className="text-sm text-foreground-muted">
                      Photo coming soon
                    </p>
                  </div>
                </div>

                {/* Floating testimonial card overlay */}
                <motion.div
                  initial={{ opacity: 0, y: 20, x: 20 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="absolute -bottom-6 -left-6 max-w-xs bg-white rounded-xl shadow-xl p-4 border border-neutral-100"
                >
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground-muted italic">
                    "My son went from hiding behind my legs to running in shouting hello!"
                  </p>
                  <p className="mt-2 text-xs font-semibold text-foreground">
                    Sarah M. - Barton Le Clay
                  </p>
                </motion.div>
              </div>
            </FadeInLeft>
          </div>
        </div>

        {/* Stats section */}
        <div className="mt-20 grid grid-cols-3 gap-8 border-t border-neutral-200 pt-12">
          <FadeInUp delay={0.6} className="text-center">
            <p className="text-4xl font-display text-foreground sm:text-5xl">
              <AnimatedCounter target={1000} suffix="+" />
            </p>
            <p className="mt-2 text-xs font-medium uppercase tracking-widest text-foreground-muted">
              Sessions Since 2022
            </p>
          </FadeInUp>
          <FadeInUp delay={0.7} className="text-center">
            <div className="flex items-center justify-center gap-1">
              <p className="text-4xl font-display sm:text-5xl text-gold">4.9</p>
              <Star className="h-6 w-6 fill-gold text-gold" />
            </div>
            <p className="mt-2 text-xs font-medium uppercase tracking-widest text-foreground-muted">
              Google Reviews
            </p>
          </FadeInUp>
          <FadeInUp delay={0.8} className="text-center">
            <p className="text-4xl font-display text-foreground sm:text-5xl">
              <AnimatedCounter target={100} suffix="%" />
            </p>
            <p className="mt-2 text-xs font-medium uppercase tracking-widest text-foreground-muted">
              Would Recommend
            </p>
          </FadeInUp>
        </div>
      </Container>
    </section>
  );
}
```

### Verification - Phase 3:
- [ ] Hero renders without errors
- [ ] Staggered headline animation plays on load
- [ ] Floating background elements animate smoothly
- [ ] Testimonial card fades in with delay
- [ ] Counters animate when scrolling to stats
- [ ] Two-column layout works on desktop (lg breakpoint)
- [ ] Falls back to single column on mobile
- [ ] CTA buttons are prominent and clickable

---

## Phase 4: Component-by-Component Enhancement

**Estimated Time:** 3 hours
**Risk Level:** Medium

### 4.1 Sessions Overview Enhancement

**File:** `src/components/sections/sessions-overview.tsx`

**Changes:**
1. Add "use client" directive
2. Wrap section header with FadeInUp
3. Use StaggerChildren + StaggerItem for card grid
4. Add entrance animations to cards
5. Enhance hover states with motion

```typescript
"use client";

import { motion } from "motion/react";
import { FadeInUp, StaggerChildren, StaggerItem } from "@/lib/motion";
// ... rest of imports

export function SessionsOverview() {
  return (
    <section className="py-20 sm:py-28 bg-background-alt">
      <Container>
        <FadeInUp>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Choose Your
              <br />
              <span className="text-foreground-muted">Game Plan</span>
            </h2>
            {/* ... */}
          </div>
        </FadeInUp>

        <StaggerChildren className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
          {sessionTypes.map((session, index) => (
            <StaggerItem key={session.id}>
              <motion.div
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group relative bg-white p-8 shadow-sm hover:shadow-xl transition-shadow"
              >
                {/* Card content */}
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerChildren>

        {/* ... CTA */}
      </Container>
    </section>
  );
}
```

### 4.2 Why Us Enhancement

**File:** `src/components/sections/why-us.tsx`

**Changes:**
1. Add "use client"
2. Break the grid pattern - use asymmetric layout
3. Add icon animations on hover
4. Staggered reveal for items

```typescript
"use client";

import { motion } from "motion/react";
import { FadeInUp, StaggerChildren, StaggerItem } from "@/lib/motion";
// ... imports

export function WhyUs() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <FadeInUp>
          <div className="mx-auto max-w-2xl text-center">
            {/* Heading */}
          </div>
        </FadeInUp>

        {/* Asymmetric grid - 2 large + 4 small */}
        <div className="mx-auto mt-16 max-w-5xl">
          <StaggerChildren className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reasons.map((reason, index) => (
              <StaggerItem
                key={reason.title}
                className={index < 2 ? "lg:col-span-1 lg:row-span-2" : ""}
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`group h-full bg-white p-8 border border-neutral-100 hover:border-grass-green/30 transition-colors ${
                    index < 2 ? "lg:p-10" : ""
                  }`}
                >
                  {/* Icon with animation */}
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
                    className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-grass-green/10"
                  >
                    <reason.icon className="h-6 w-6 text-grass-green" />
                  </motion.div>

                  <h3 className="text-lg font-bold text-foreground">
                    {reason.title}
                  </h3>
                  <p className="mt-3 text-sm text-foreground-muted leading-relaxed">
                    {reason.description}
                  </p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </Container>
    </section>
  );
}
```

### 4.3 Testimonials Enhancement

**File:** `src/components/sections/testimonials.tsx`

**Changes:**
1. Add swipe gesture support
2. Smoother transitions between testimonials
3. Auto-play option (pauses on hover)
4. Better entrance animation

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "motion/react";
import { FadeInUp } from "@/lib/motion";
// ... imports

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Swipe handling
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 50) {
      prev();
    } else if (info.offset.x < -50) {
      next();
    }
  };

  return (
    <section
      className="py-20 sm:py-28 bg-foreground text-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Container>
        <FadeInUp>
          {/* Header */}
        </FadeInUp>

        <div className="relative mx-auto mt-16 max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              className="cursor-grab active:cursor-grabbing"
            >
              {/* Testimonial card */}
            </motion.div>
          </AnimatePresence>

          {/* Navigation with progress indicator */}
        </div>
      </Container>
    </section>
  );
}
```

### 4.4 FAQ Enhancement

**File:** `src/components/sections/faq.tsx`

**Changes:**
1. Animate accordion open/close with motion
2. Staggered reveal of items
3. Add search functionality (optional)

```typescript
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FadeInUp, StaggerChildren, StaggerItem } from "@/lib/motion";
// ... imports

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 sm:py-28 bg-background-alt">
      <Container>
        <FadeInUp>
          {/* Header */}
        </FadeInUp>

        <StaggerChildren className="mx-auto mt-16 max-w-3xl divide-y divide-neutral-200">
          {faqs.map((faq, index) => (
            <StaggerItem key={index} className="bg-white">
              <button
                onClick={() => toggleFaq(index)}
                className="flex w-full items-center justify-between gap-4 p-6 text-left"
              >
                <span className="font-bold text-foreground">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-5 w-5 text-foreground-muted" />
                </motion.div>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6">
                      <p className="text-foreground-muted leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </Container>
    </section>
  );
}
```

### 4.5 CTA Section Enhancement

**File:** `src/components/sections/cta.tsx`

**Changes:**
1. Add pulsing animation to primary button
2. Animated background mesh
3. Entrance animation

```typescript
"use client";

import { motion } from "motion/react";
import { FadeInUp } from "@/lib/motion";
// ... imports

export function CTA() {
  return (
    <section className="py-20 sm:py-28 bg-background-alt">
      <Container>
        <FadeInUp>
          <div className="relative bg-foreground px-6 py-16 sm:px-12 sm:py-24 lg:px-20 overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 opacity-20">
              <motion.div
                animate={{
                  background: [
                    "radial-gradient(circle at 20% 50%, #FF6B35 0%, transparent 50%)",
                    "radial-gradient(circle at 80% 50%, #2ECC71 0%, transparent 50%)",
                    "radial-gradient(circle at 50% 80%, #FFD93D 0%, transparent 50%)",
                    "radial-gradient(circle at 20% 50%, #FF6B35 0%, transparent 50%)",
                  ]
                }}
                transition={{ duration: 10, repeat: Infinity }}
                className="absolute inset-0"
              />
            </div>

            <div className="relative mx-auto max-w-2xl text-center">
              {/* Content */}

              {/* Pulsing CTA button */}
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block"
              >
                <Button
                  size="lg"
                  className="bg-white text-foreground hover:bg-neutral-100 animate-pulse-glow"
                  asChild
                >
                  <Link href="/book">
                    Book Your First Session
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </FadeInUp>
      </Container>
    </section>
  );
}
```

### 4.6 Header Enhancement

**File:** `src/components/layout/header.tsx`

**Changes:**
1. Add scroll-aware background (transparent -> solid)
2. Smoother mobile menu animation

```typescript
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
// ... imports

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-sm"
          : "bg-transparent"
      )}
    >
      {/* ... content */}

      {/* Mobile Menu with animation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden"
          >
            {/* Menu content */}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
```

### 4.7 Locations Preview Enhancement

**File:** `src/components/sections/locations-preview.tsx`

**Changes:**
1. Add "use client"
2. Staggered card entrance
3. Hover animations

### 4.8 Footer Enhancement

**File:** `src/components/layout/footer.tsx`

**Changes:**
1. Add "use client"
2. Subtle fade-in animation

### Verification - Phase 4:
- [ ] All sections render without errors
- [ ] Stagger animations work on scroll into view
- [ ] Hover states are smooth and responsive
- [ ] FAQ accordion animates smoothly
- [ ] Testimonial carousel swipes work on touch
- [ ] Header background transitions on scroll
- [ ] Mobile menu opens/closes smoothly

---

## Phase 5: Performance Optimization

**Estimated Time:** 1 hour
**Risk Level:** Medium

### 5.1 Dynamic Imports for Below-Fold Sections

**File:** `src/app/page.tsx`

```typescript
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Hero } from "@/components/sections/hero";

// Dynamic imports for below-fold sections
const SessionsOverview = dynamic(
  () => import("@/components/sections/sessions-overview").then(mod => mod.SessionsOverview),
  { loading: () => <SectionSkeleton /> }
);

const WhyUs = dynamic(
  () => import("@/components/sections/why-us").then(mod => mod.WhyUs),
  { loading: () => <SectionSkeleton /> }
);

const Testimonials = dynamic(
  () => import("@/components/sections/testimonials").then(mod => mod.Testimonials),
  { loading: () => <SectionSkeleton /> }
);

const LocationsPreview = dynamic(
  () => import("@/components/sections/locations-preview").then(mod => mod.LocationsPreview),
  { loading: () => <SectionSkeleton /> }
);

const FAQ = dynamic(
  () => import("@/components/sections/faq").then(mod => mod.FAQ),
  { loading: () => <SectionSkeleton /> }
);

const CTA = dynamic(
  () => import("@/components/sections/cta").then(mod => mod.CTA),
  { loading: () => <SectionSkeleton /> }
);

// Loading skeleton
function SectionSkeleton() {
  return (
    <div className="py-20 animate-pulse">
      <div className="mx-auto max-w-7xl px-4">
        <div className="h-12 bg-neutral-200 rounded w-1/3 mx-auto mb-8" />
        <div className="h-64 bg-neutral-100 rounded" />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Suspense fallback={<SectionSkeleton />}>
        <SessionsOverview />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <WhyUs />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <Testimonials />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <LocationsPreview />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <FAQ />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <CTA />
      </Suspense>
    </>
  );
}
```

### 5.2 Fix Lucide-React Barrel Imports

**All component files using lucide-react:**

Replace barrel imports with specific imports:

```typescript
// Before (barrel import - pulls entire library)
import { Shield, Award, FileCheck, Heart, ArrowRight, Star } from "lucide-react";

// After (specific imports - tree-shakeable)
import Shield from "lucide-react/dist/esm/icons/shield";
import Award from "lucide-react/dist/esm/icons/award";
import FileCheck from "lucide-react/dist/esm/icons/file-check";
import Heart from "lucide-react/dist/esm/icons/heart";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Star from "lucide-react/dist/esm/icons/star";
```

**Files to update:**
- `src/components/sections/hero.tsx`
- `src/components/sections/why-us.tsx`
- `src/components/sections/sessions-overview.tsx`
- `src/components/sections/testimonials.tsx`
- `src/components/sections/faq.tsx`
- `src/components/sections/cta.tsx`
- `src/components/sections/locations-preview.tsx`
- `src/components/layout/header.tsx`
- `src/components/layout/footer.tsx`

### 5.3 Add Content-Visibility for FAQ

**File:** `src/components/sections/faq.tsx`

```css
/* Add to globals.css */
.content-auto {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px;
}
```

### Verification - Phase 5:
- [ ] Run `npm run build` - check bundle size report
- [ ] First contentful paint should be faster
- [ ] Below-fold sections load lazily
- [ ] No console warnings about large bundle
- [ ] Lighthouse performance score improves

---

## Phase 6: Visual Polish

**Estimated Time:** 30 minutes
**Risk Level:** Low

### 6.1 Update Scrollbar

**File:** `src/app/globals.css`

```css
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--background);
}

::-webkit-scrollbar-thumb {
  background: var(--grass-green);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--grass-dark);
}
```

### 6.2 Update Selection Color

```css
::selection {
  background-color: var(--energy-yellow);
  color: var(--foreground);
}
```

### 6.3 Focus States with Brand Colors

```css
*:focus-visible {
  outline: 2px solid var(--grass-green);
  outline-offset: 2px;
}
```

### 6.4 Button Enhancements

**File:** `src/components/ui/button.tsx`

Add new variants:
```typescript
const buttonVariants = cva(
  "...",
  {
    variants: {
      variant: {
        primary:
          "bg-grass-green text-white hover:bg-grass-dark focus-visible:ring-grass-green rounded-lg uppercase tracking-wider font-semibold",
        secondary:
          "bg-white text-foreground border-2 border-foreground hover:bg-foreground hover:text-white focus-visible:ring-foreground rounded-lg uppercase tracking-wider font-semibold",
        energy:
          "bg-gradient-to-r from-energy-orange to-energy-yellow text-white hover:opacity-90 rounded-lg uppercase tracking-wider font-semibold shadow-lg",
        // ... other variants
      },
    },
  }
);
```

### Verification - Phase 6:
- [ ] Scrollbar has brand color
- [ ] Text selection uses yellow highlight
- [ ] Focus rings use green
- [ ] Buttons have new gradient variant

---

## Testing Strategy

### Manual Testing Checklist

1. **Desktop (1920x1080)**
   - [ ] Hero two-column layout correct
   - [ ] All animations play smoothly (60fps)
   - [ ] Hover states work on all interactive elements
   - [ ] Scroll-triggered animations fire at right time

2. **Tablet (768px)**
   - [ ] Hero collapses to single column
   - [ ] Cards stack appropriately
   - [ ] Touch interactions work

3. **Mobile (375px)**
   - [ ] All text readable
   - [ ] Buttons full-width and tappable
   - [ ] No horizontal scroll
   - [ ] Menu works correctly

4. **Animation Testing**
   - [ ] Reduce motion preference respected
   - [ ] No animation jank on low-end devices
   - [ ] Floating elements don't cause layout shift

5. **Performance Testing**
   - [ ] Lighthouse score > 90
   - [ ] First contentful paint < 1.5s
   - [ ] Time to interactive < 3s

### Accessibility Testing

- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] Color contrast passes WCAG AA
- [ ] Animations respect prefers-reduced-motion

---

## Risks & Considerations

### High Risk
1. **Motion library bundle size** - Mitigation: Use specific imports, tree-shake
2. **Animation performance on mobile** - Mitigation: Test on real devices, reduce complexity if needed

### Medium Risk
1. **Font loading flash** - Mitigation: Use font-display: swap, preload critical fonts
2. **Breaking existing functionality** - Mitigation: Test each component before moving to next

### Low Risk
1. **Color accessibility** - Mitigation: Test contrast ratios with WebAIM checker
2. **Browser compatibility** - Mitigation: Test in Safari, Firefox, Chrome, Edge

---

## Estimated Complexity

| Phase | Effort | Priority |
|-------|--------|----------|
| Phase 1: Typography & Colors | Low | P0 - Foundation |
| Phase 2: Motion System | Medium | P0 - Foundation |
| Phase 3: Hero Redesign | High | P0 - Above fold |
| Phase 4: Component Enhancement | High | P1 - Visual impact |
| Phase 5: Performance | Medium | P1 - UX |
| Phase 6: Polish | Low | P2 - Details |

**Total Estimated Time:** 7-8 hours

---

## Files Summary

### Files to Modify
1. `src/app/globals.css` - Colors, animations, utilities
2. `src/app/layout.tsx` - Font configuration
3. `src/app/page.tsx` - Dynamic imports, Suspense
4. `src/components/sections/hero.tsx` - Complete redesign
5. `src/components/sections/why-us.tsx` - Animation + layout
6. `src/components/sections/sessions-overview.tsx` - Animation
7. `src/components/sections/testimonials.tsx` - Enhanced carousel
8. `src/components/sections/locations-preview.tsx` - Animation
9. `src/components/sections/faq.tsx` - Animated accordion
10. `src/components/sections/cta.tsx` - Animation + effects
11. `src/components/layout/header.tsx` - Scroll behavior
12. `src/components/layout/footer.tsx` - Animation
13. `src/components/ui/button.tsx` - Enhanced variants

### Files to Create
1. `src/lib/motion.tsx` - Reusable animation components
2. `src/components/ui/animated-counter.tsx` - Counting animation
3. `src/components/ui/floating-element.tsx` - Floating animation wrapper
4. `src/components/sections/hero-background.tsx` - Animated background
