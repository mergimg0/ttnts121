import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Clock, Users, Calendar, MapPin, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import { SESSION_TYPES, AGE_GROUPS, LOCATIONS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Football Sessions",
  description:
    "After school clubs, half-term camps, and holiday camps for children ages 4-11 in Luton & Bedfordshire. Fun, skill-building football sessions.",
};

// Enhanced session descriptions
const sessionDetails = {
  "after-school": {
    description: "The perfect mid-week energy release. Drop off after school, pick up a tired, happy child who can't stop talking about their goals.",
    parentBenefit: "Fits around work schedules",
  },
  "half-term": {
    description: "A week of non-stop football fun. Games, skills, new friends - everything kids need to make half-term memorable.",
    parentBenefit: "Childcare sorted",
  },
  "holiday": {
    description: "Summer, Easter, Christmas - we've got you covered. Full days of football that kids count down to all year.",
    parentBenefit: "Early drop-off available",
  },
};

// Enhanced age group info
const ageGroupDetails = {
  "mini-kickers": {
    focus: "First football memories! Gentle games, lots of encouragement, and big celebrations for every kick. Perfect for kids new to sport.",
    parentNote: "Most popular for first-timers",
  },
  "juniors": {
    focus: "Building real skills through fun games. Kids start to understand teamwork and get more confident every session.",
    parentNote: "Sweet spot for skill development",
  },
  "seniors": {
    focus: "Technique gets serious (but still fun!). Mini matches, tactical basics, and preparing for club football if they want it.",
    parentNote: "Ideal for competitive kids",
  },
  "advanced": {
    focus: "For kids who live and breathe football. Advanced skills, proper matches, and pathways to local clubs.",
    parentNote: "Club-ready preparation",
  },
};

export default function SessionsPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-black py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            {/* Urgency banner */}
            <div className="mb-8 inline-flex items-center gap-2 border border-[#F5A623] px-4 py-2 text-sm text-[#F5A623]">
              <AlertCircle className="h-4 w-4" />
              Limited spots for Spring term - book early to avoid disappointment
            </div>

            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              Find Your
              <br />
              <span className="text-neutral-500">Perfect Session</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-400">
              Weekly clubs or holiday camps. School pickups or full-day fun.
              <br />
              <span className="text-neutral-500">We fit around your life, not the other way around.</span>
            </p>
          </div>
        </Container>
      </section>

      {/* Session Types */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="grid gap-px bg-neutral-200 lg:grid-cols-3">
            {SESSION_TYPES.map((session, index) => {
              const details = sessionDetails[session.id as keyof typeof sessionDetails];
              return (
                <div
                  key={session.id}
                  className="group relative bg-white p-8 transition-colors hover:bg-black"
                >
                  {/* Number */}
                  <span className="absolute right-6 top-6 text-7xl font-black text-neutral-100 group-hover:text-neutral-800 transition-colors">
                    0{index + 1}
                  </span>

                  {/* Most Popular badge for after-school */}
                  {session.id === "after-school" && (
                    <span className="absolute -top-3 left-6 bg-[#2E3192] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                      Most Popular
                    </span>
                  )}

                  <div className="relative">
                    <h2 className="text-2xl font-bold uppercase tracking-wide text-black group-hover:text-white transition-colors">
                      {session.name}
                    </h2>
                    <p className="mt-3 text-neutral-600 group-hover:text-neutral-400 transition-colors">
                      {details?.description || session.description}
                    </p>

                    {/* Parent benefit callout */}
                    {details?.parentBenefit && (
                      <p className="mt-3 flex items-center gap-2 text-sm text-[#2E3192] group-hover:text-[#00AEEF] transition-colors">
                        <Sparkles className="h-4 w-4" />
                        {details.parentBenefit}
                      </p>
                    )}

                    {/* Details */}
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm text-neutral-600 group-hover:text-neutral-400 transition-colors">
                          {session.duration}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm text-neutral-600 group-hover:text-neutral-400 transition-colors">
                          Ages {session.ageRange}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm text-neutral-600 group-hover:text-neutral-400 transition-colors">
                          {session.frequency}
                        </span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mt-8 pt-6 border-t border-neutral-200 group-hover:border-neutral-800 transition-colors">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs uppercase tracking-widest text-neutral-500">
                          From
                        </span>
                        <span className="text-4xl font-black text-black group-hover:text-white transition-colors">
                          £{session.priceFrom}
                        </span>
                      </div>
                      <p className="mt-1 text-right text-xs text-neutral-500">
                        per session
                      </p>
                    </div>

                    <Button className="mt-6 w-full" asChild>
                      <Link href="/book">Book Now</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Age Groups */}
      <section className="bg-neutral-50 py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl lg:text-5xl">
              Right Level,
              <br />
              <span className="text-neutral-400">Right Challenge</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              We group by age so your child is always with peers at the same stage.
              <br />
              <span className="text-neutral-500">No one gets left behind. No one gets bored.</span>
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-px bg-neutral-200 sm:grid-cols-2 lg:grid-cols-4">
            {AGE_GROUPS.map((group) => {
              const details = ageGroupDetails[group.id as keyof typeof ageGroupDetails];
              return (
                <div
                  key={group.id}
                  className="bg-white p-6 text-center"
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border-2 border-black">
                    <span className="text-2xl font-black text-black">
                      {group.ageRange.split("-")[0]}+
                    </span>
                  </div>
                  <h3 className="text-lg font-bold uppercase tracking-wide text-black">
                    {group.name}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Ages {group.ageRange}
                  </p>
                  <p className="mt-3 text-sm text-neutral-600">
                    {details?.focus || group.focus}
                  </p>
                  {details?.parentNote && (
                    <p className="mt-2 text-xs font-semibold text-[#2E3192]">
                      {details.parentNote}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Locations Preview */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl lg:text-5xl">
              Near You
              <br />
              <span className="text-neutral-400">In Bedfordshire</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              Three convenient locations. Easy parking. No long drives.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-3xl gap-px bg-neutral-200 sm:grid-cols-3">
            {LOCATIONS.map((location) => (
              <Link
                key={location.id}
                href={`/locations/${location.id}`}
                className="group flex items-center gap-4 bg-white p-6 transition-colors hover:bg-black"
              >
                <div className="flex h-10 w-10 items-center justify-center border border-neutral-300 group-hover:border-white transition-colors">
                  <MapPin className="h-5 w-5 text-black group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="font-bold uppercase tracking-wide text-black group-hover:text-white transition-colors">
                    {location.name}
                  </p>
                  <p className="text-sm text-neutral-500 group-hover:text-neutral-400 transition-colors">
                    {location.postcode}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-neutral-400 transition-transform group-hover:translate-x-1 group-hover:text-white" />
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-black py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
              Still Deciding?
              <br />
              <span className="text-neutral-500">Try One Session Risk-Free</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-400">
              No commitment. No pressure. Just your child having the best hour of their week.
              <br />
              <span className="text-neutral-500">Full refund if they don&apos;t love it.</span>
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-neutral-200 rounded-none uppercase tracking-wider font-semibold"
                asChild
              >
                <Link href="/book">
                  Book a Trial Session
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="border-neutral-700 bg-transparent text-white hover:bg-neutral-800"
                asChild
              >
                <Link href="/contact">Ask a Question First</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
