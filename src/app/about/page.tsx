import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Award,
  Heart,
  Users,
  Target,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Quote,
} from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Take The Next Step 121 - our mission, values, and the qualified team dedicated to helping children develop through football.",
};

const values = [
  {
    title: "Games Over Drills",
    description:
      "Kids learn through play, not lectures. Our sessions are 90% games because that's how football skills actually stick - and how confidence grows.",
    icon: Sparkles,
  },
  {
    title: "Every Child Visible",
    description:
      "No one gets lost in the crowd. With 8 kids max per coach, we learn every name, notice every improvement, and celebrate every milestone.",
    icon: Target,
  },
  {
    title: "Character Over Trophies",
    description:
      "We measure success in high-fives given, not goals scored. Football is our tool for building confidence, resilience, and genuine friendships.",
    icon: Heart,
  },
  {
    title: "All Abilities, All Welcome",
    description:
      "Whether it's their first time kicking a ball or they're already match-ready, every child finds their place here. No try-outs. No rejection.",
    icon: Users,
  },
];

const credentials = [
  {
    title: "FA Level 2 Qualified",
    description: "The same training as professional youth coaches",
    icon: Award,
  },
  {
    title: "Enhanced DBS",
    description: "Rigorous background checks renewed annually",
    icon: Shield,
  },
  {
    title: "Paediatric First Aid",
    description: "Trained specifically for child emergencies",
    icon: CheckCircle,
  },
  {
    title: "Fully Insured",
    description: "Complete liability and accident coverage",
    icon: Shield,
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-black py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              We Started
              <br />
              <span className="text-neutral-500">As Parents Too</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-400">
              We saw what was missing in kids&apos; football: coaching that puts
              confidence before competition. So we built it ourselves.
            </p>
          </div>
        </Container>
      </section>

      {/* Origin Story */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
              Why We Started
            </h2>
            <div className="mt-8 space-y-6 text-lg text-neutral-600 leading-relaxed">
              <p>
                <span className="font-semibold text-black">It started with frustration.</span>{" "}
                We watched kids at local clubs get shouted at for mistakes.
                We saw children sitting on the sidelines because they weren&apos;t &quot;good enough.&quot;
                We heard parents say their child &quot;just isn&apos;t sporty&quot; after one bad experience.
              </p>
              <p>
                We knew there had to be another way. Football should be
                the place where kids <em>find</em> their confidence, not lose it.
                Where making mistakes is how you learn, not a reason to be benched.
                Where &quot;winning&quot; means going home happy, not a score on a board.
              </p>
              <p>
                <span className="font-semibold text-black">So in 2022, Take The Next Step 121 was born.</span>{" "}
                We built the football sessions we wished our own kids had:
                small groups, patient coaches, games instead of drills,
                and an absolute commitment to making every child feel like a superstar.
              </p>
            </div>

            {/* Founder Quote */}
            <div className="mt-12 border-l-4 border-[#2E3192] pl-6">
              <Quote className="h-6 w-6 text-neutral-300 mb-4" />
              <p className="text-xl text-neutral-700 italic leading-relaxed">
                &quot;Every child who walks through our gates deserves to leave feeling
                better about themselves than when they arrived. That&apos;s not a goal -
                it&apos;s a promise.&quot;
              </p>
              <p className="mt-4 font-bold uppercase tracking-wider text-black">
                - The TTNTS121 Team
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="bg-neutral-50 py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl lg:text-5xl">
              What We
              <br />
              <span className="text-neutral-400">Actually Believe</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              Not corporate values. Real principles we live by every session.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-px bg-neutral-200 sm:grid-cols-2">
            {values.map((value) => (
              <div key={value.title} className="bg-white p-8">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center border-2 border-black">
                  <value.icon className="h-5 w-5 text-black" />
                </div>
                <h3 className="text-lg font-bold uppercase tracking-wide text-black">
                  {value.title}
                </h3>
                <p className="mt-3 text-neutral-600">{value.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Credentials */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl lg:text-5xl">
              Your Trust
              <br />
              <span className="text-neutral-400">Is Earned</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              We don&apos;t just say we&apos;re qualified - we prove it. Every coach, every session.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-px bg-neutral-200 sm:grid-cols-2 lg:grid-cols-4">
            {credentials.map((credential) => (
              <div
                key={credential.title}
                className="bg-white p-6 text-center"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border-2 border-black">
                  <credential.icon className="h-5 w-5 text-black" />
                </div>
                <h3 className="font-bold uppercase tracking-wide text-black">
                  {credential.title}
                </h3>
                <p className="mt-2 text-sm text-neutral-600">
                  {credential.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Team */}
      <section className="bg-neutral-50 py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl lg:text-5xl">
              Meet The
              <br />
              <span className="text-neutral-400">Coaches</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              Parents ourselves. Football lovers. Child development specialists.
              <br />
              <span className="text-neutral-500">We get it because we live it.</span>
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-3xl border border-neutral-200 bg-white p-8 sm:p-12">
            <div className="text-center">
              <div className="mx-auto mb-8 h-24 w-24 border-2 border-black flex items-center justify-center">
                <span className="text-3xl font-black">4+</span>
              </div>
              <h3 className="text-xl font-bold uppercase tracking-wide text-black">
                Coaches Who Actually Care
              </h3>
              <p className="mt-6 text-neutral-600 leading-relaxed">
                Every coach on our team chose this work because they believe in it.
                Many are parents who saw the difference our approach made for their
                own children. All are trained to the highest FA standards and
                specialise in working with ages 4-11.
              </p>
              <p className="mt-4 text-neutral-600 leading-relaxed">
                <span className="font-semibold text-black">Combined experience:</span>{" "}
                15+ years of youth coaching. Thousands of children helped.
                One shared mission: making football the highlight of your child&apos;s week.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <span className="border border-black px-4 py-2 text-xs font-bold uppercase tracking-wider">
                  FA Level 2
                </span>
                <span className="border border-black px-4 py-2 text-xs font-bold uppercase tracking-wider">
                  Enhanced DBS
                </span>
                <span className="border border-black px-4 py-2 text-xs font-bold uppercase tracking-wider">
                  Paediatric First Aid
                </span>
                <span className="border border-black px-4 py-2 text-xs font-bold uppercase tracking-wider">
                  Safeguarding Level 2
                </span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-black py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
              See The Difference
              <br />
              <span className="text-neutral-500">For Yourself</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-400">
              One session. No commitment. Watch your child light up.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-neutral-200 rounded-none uppercase tracking-wider font-semibold"
                asChild
              >
                <Link href="/book">
                  Book a Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="border-neutral-700 bg-transparent text-white hover:bg-neutral-800"
                asChild
              >
                <Link href="/contact">Ask Us Anything</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
