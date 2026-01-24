import { Container } from "@/components/layout/container";
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
      "Your child won't get lost in the crowd. Small groups mean more touches on the ball, more feedback, and more confidence built every session.",
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
      "Enhanced DBS checks, first aid trained, fully insured. We treat your kids like our own - because many of our coaches are parents too.",
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
    <section className="py-20 sm:py-28">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl lg:text-5xl">
            What Makes Us
            <br />
            <span className="text-neutral-400">Different</span>
          </h2>
          <p className="mt-6 text-lg text-neutral-600">
            We&apos;re not just football coaches. We&apos;re confidence builders who happen to use footballs.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-px bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason) => (
            <div
              key={reason.title}
              className="group bg-white p-8 transition-colors hover:bg-neutral-50"
            >
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center border-2 border-black">
                <reason.icon className="h-5 w-5 text-black" />
              </div>
              <h3 className="text-lg font-bold uppercase tracking-wide text-black">
                {reason.title}
              </h3>
              <p className="mt-3 text-sm text-neutral-600 leading-relaxed">
                {reason.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
