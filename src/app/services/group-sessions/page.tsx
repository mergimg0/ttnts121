import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { SessionList } from "@/components/sessions/session-list";
import {
  ArrowRight,
  Users,
  Calendar,
  MapPin,
  Clock,
} from "lucide-react";
import { LOCATIONS, AGE_GROUPS, SITE_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Group Sessions | Drop-In Football Fun",
  description:
    "Join our drop-in group football sessions for children ages 4-11. Make friends, build teamwork skills, and enjoy football in a fun, welcoming environment. Just £6 per session.",
};

export default function GroupSessionsPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/70">
              Drop-In Sessions
            </p>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              Just Turn Up
              <br />
              <span className="text-sky">& Play</span>
            </h1>
            <p className="mt-6 text-lg text-white/70">
              No commitment. No pressure. Just football fun with friends.
              <br />
              From just £6 per session.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-neutral-200 rounded-none uppercase tracking-wider font-semibold"
                asChild
              >
                <Link href="/book?service=group-sessions">
                  Book a Session
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Price Highlight */}
      <section className="border-b border-neutral-200 bg-white py-8">
        <Container>
          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-brand-green" />
              <span className="font-semibold">1 Hour Sessions</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-brand-green">£6</span>
              <span className="text-neutral-600">per session</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-brand-green" />
              <span className="font-semibold">Ages 4-11</span>
            </div>
          </div>
        </Container>
      </section>

      {/* Age Groups */}
      <section className="bg-neutral-50 py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
              Age
              <br />
              <span className="text-neutral-400">Groups</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              Sessions are split by age so every child plays with others at their level.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-6 grid-cols-2 md:grid-cols-4">
            {AGE_GROUPS.map((group) => (
              <div
                key={group.id}
                className="border border-neutral-200 bg-white p-6"
              >
                <div className="text-center">
                  <span className="text-3xl font-black text-black">
                    {group.ageRange}
                  </span>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-neutral-500">
                    Years
                  </p>
                </div>
                <h3 className="mt-4 text-center font-bold uppercase tracking-wide text-black">
                  {group.name}
                </h3>
                <p className="mt-3 text-sm text-neutral-600">{group.focus}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Available Sessions */}
      <section className="py-20 sm:py-28">
        <Container>
          <SessionList
            serviceType="group-session"
            title="Available Sessions"
            subtitle="Find and book your drop-in session"
            maxSessions={6}
          />
        </Container>
      </section>

      {/* Locations */}
      <section className="bg-neutral-50 py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
              Where We
              <br />
              <span className="text-neutral-400">Run Sessions</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              Multiple locations across Bedfordshire. Find one near you.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-3xl gap-6 sm:grid-cols-3">
            {LOCATIONS.map((location) => (
              <Link
                key={location.id}
                href={`/locations#${location.id}`}
                className="group border border-neutral-200 bg-white p-6 text-center transition-all hover:border-black hover:shadow-lg"
              >
                <MapPin className="mx-auto h-8 w-8 text-neutral-400 transition-colors group-hover:text-black" />
                <h3 className="mt-4 font-bold uppercase tracking-wide text-black">
                  {location.name}
                </h3>
                <p className="mt-2 text-sm text-neutral-500">
                  {location.postcode}
                </p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-navy py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
              Ready To
              <br />
              <span className="text-sky">Join In?</span>
            </h2>
            <p className="mt-6 text-lg text-white/70">
              Book a session, turn up, and let them play. It really is that simple.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-neutral-200 rounded-none uppercase tracking-wider font-semibold"
                asChild
              >
                <Link href="/book?service=group-sessions">
                  Book Group Session
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
                asChild
              >
                <a href={`tel:${SITE_CONFIG.phone.replace(/\s/g, "")}`}>
                  Questions? Call Us
                </a>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
