"use client";

import { Container } from "@/components/layout/container";
import { FadeInUp, StaggerChildren, StaggerItem } from "@/lib/motion";
import {
  Heart,
  Trophy,
  Users,
  Sparkles,
  Shield,
  Star
} from "lucide-react";

const reasons = [
  {
    title: "Games, Not Drills",
    description:
      "Kids don't realise they're learning because they're too busy having fun. Every session is 90% games, 10% skills - exactly how kids learn best.",
    icon: Sparkles,
  },
  {
    title: "8 Kids Max Per Coach",
    description:
      "No one gets lost in the crowd. Small groups mean more touches on the ball, more feedback, and more confidence built every session.",
    icon: Users,
  },
  {
    title: "FA Level 2 Coaches",
    description:
      "Not just qualified - passionate. Our coaches specialise in ages 4-11 and know how to make football click for every learning style.",
    icon: Trophy,
  },
  {
    title: "Confidence First, Football Second",
    description:
      "We've seen quiet kids become team captains. Football is our tool - confidence, friendships, and resilience are what we really build.",
    icon: Heart,
  },
  {
    title: "Peace of Mind for Parents",
    description:
      "Enhanced DBS checks, first aid trained, fully insured. We treat every player like our own - because many of our coaches are parents too.",
    icon: Shield,
  },
  {
    title: "Progress You Can See",
    description:
      "Regular updates, end-of-term reports, and genuine celebration of every milestone. You'll see the difference in weeks, not months.",
    icon: Star,
  },
];

export function WhyUs() {
  return (
    <section className="py-24 sm:py-32 bg-background">
      <Container>
        <FadeInUp>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              What Makes Us Different
            </h2>
            <p className="mt-6 text-lg text-foreground-muted">
              We&apos;re not just football coaches. We&apos;re confidence builders who happen to use footballs.
            </p>
          </div>
        </FadeInUp>

        <StaggerChildren className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason) => (
            <StaggerItem key={reason.title}>
              <div className="group h-full bg-white p-6 rounded-2xl border border-neutral-100 hover:shadow-lg transition-shadow">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sky/10">
                  <reason.icon className="h-6 w-6 text-navy" />
                </div>

                <h3 className="text-lg font-bold text-foreground">
                  {reason.title}
                </h3>
                <p className="mt-2 text-sm text-foreground-muted leading-relaxed">
                  {reason.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </Container>
    </section>
  );
}
