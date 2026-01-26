import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { SessionList } from "@/components/sessions/session-list";
import {
  ArrowRight,
  Target,
  Clock,
  TrendingUp,
  Calendar,
  CheckCircle,
  MessageCircle,
  Star,
} from "lucide-react";
import { ONE_TO_ONE_PACKAGES, SITE_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "1:1 Coaching | Private Football Sessions",
  description:
    "Personalised football coaching focused entirely on your child. Build confidence, develop specific skills, and progress faster with dedicated one-to-one attention.",
};

const benefits = [
  {
    title: "100% Focused Attention",
    description:
      "No waiting for a turn. No getting lost in the group. Every minute is dedicated to your child's development.",
    icon: Target,
  },
  {
    title: "Faster Progress",
    description:
      "Kids improve 3x faster with individual coaching. We identify weaknesses and build on strengths every session.",
    icon: TrendingUp,
  },
  {
    title: "Flexible Scheduling",
    description:
      "Sessions fit around your life, not the other way around. Weekdays, weekends, school holidays - you choose.",
    icon: Calendar,
  },
  {
    title: "Personalised Plan",
    description:
      "Whether it's confidence, ball control, or trial preparation - we create a plan specific to your child's goals.",
    icon: Star,
  },
];

const howItWorks = [
  {
    step: 1,
    title: "Book Your First Session",
    description:
      "Choose a time that works and tell us a bit about your child's experience and goals.",
  },
  {
    step: 2,
    title: "Initial Assessment",
    description:
      "We watch, play, and learn what makes your child tick. No pressure, just football fun.",
  },
  {
    step: 3,
    title: "Custom Plan Created",
    description:
      "Based on what we learn, we design sessions targeting exactly what your child needs.",
  },
  {
    step: 4,
    title: "Watch Them Grow",
    description:
      "Regular progress updates so you can see the confidence building, both on and off the pitch.",
  },
];

const faqs = [
  {
    question: "What ages do you coach 1:1?",
    answer:
      "We offer 1:1 coaching for children aged 4-11. Sessions are tailored to be age-appropriate - younger children focus more on fun coordination games, while older kids work on specific techniques and match scenarios.",
  },
  {
    question: "Where do sessions take place?",
    answer:
      "Sessions can be held at one of our regular venues in Luton, Barton Le Clay, or Silsoe. We can also come to you if you have a suitable outdoor space (garden, local park, school pitch).",
  },
  {
    question: "What if my child is a complete beginner?",
    answer:
      "Perfect! Many of our 1:1 clients have never played organised football. Private sessions are actually ideal for beginners - they build confidence without the pressure of peers watching.",
  },
  {
    question: "Can siblings share a session?",
    answer:
      "Absolutely. If you have two children of similar ability, they can share a 1:1 session. It's a great way for siblings to bond and learn together. Just let us know when booking.",
  },
  {
    question: "How often should we book sessions?",
    answer:
      "For noticeable progress, we recommend weekly sessions. The Starter Pack (4 sessions) is perfect for trying it out. For serious development, the Development Pack (8 sessions) gives us time to really work on skills.",
  },
  {
    question: "What happens if it rains?",
    answer:
      "We'll reschedule to a time that works for you - no session is wasted. If you have suitable indoor space or access to a sports hall, we can potentially continue there.",
  },
];

export default function OneToOnePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-black py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-green">
              Private Coaching
            </p>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              All Eyes On
              <br />
              <span className="text-neutral-500">Your Child</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-400">
              Personalised coaching that adapts to how your child learns.
              <br />
              Build confidence. Develop skills. Progress faster.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-neutral-200 rounded-none uppercase tracking-wider font-semibold"
                asChild
              >
                <Link href="/book?service=one-to-one">
                  Book a Session
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="border-neutral-700 bg-transparent text-white hover:bg-neutral-800"
                asChild
              >
                <a href={`tel:${SITE_CONFIG.phone.replace(/\s/g, "")}`}>
                  Call to Discuss
                </a>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Benefits */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
              Why 1:1
              <br />
              <span className="text-neutral-400">Changes Everything</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              Group sessions are great for fun. Private sessions are where
              real transformation happens.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-px bg-neutral-200 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="bg-white p-8">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center border-2 border-black">
                  <benefit.icon className="h-5 w-5 text-black" />
                </div>
                <h3 className="text-lg font-bold uppercase tracking-wide text-black">
                  {benefit.title}
                </h3>
                <p className="mt-3 text-neutral-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Available Sessions */}
      <section className="py-20 sm:py-28">
        <Container>
          <SessionList
            serviceType="one-to-one"
            title="Available Slots"
            subtitle="Book an available 1:1 session or contact us for custom scheduling"
            maxSessions={6}
          />
        </Container>
      </section>

      {/* Pricing */}
      <section className="bg-neutral-50 py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
              Simple Pricing
              <br />
              <span className="text-neutral-400">No Surprises</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              Try a single session or save with a package. No contracts. No commitments.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-6 lg:grid-cols-3">
            {ONE_TO_ONE_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={cn(
                  "relative border bg-white p-8",
                  pkg.popular
                    ? "border-black ring-2 ring-black"
                    : "border-neutral-200"
                )}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-black px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-xl font-bold uppercase tracking-wide text-black">
                    {pkg.name}
                  </h3>
                  <div className="mt-4">
                    <span className="text-4xl font-black text-black">
                      £{pkg.totalPrice}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-neutral-500">
                    {pkg.sessions} session{pkg.sessions > 1 ? "s" : ""} •{" "}
                    £{pkg.pricePerSession}/session
                  </p>
                  {pkg.savings && (
                    <p className="mt-2 text-sm font-semibold text-brand-green">
                      Save £{pkg.savings}
                    </p>
                  )}
                  <p className="mt-4 text-neutral-600">{pkg.description}</p>
                  <Button
                    className={cn(
                      "mt-6 w-full rounded-none uppercase tracking-wider font-semibold",
                      pkg.popular
                        ? "bg-black text-white hover:bg-neutral-800"
                        : ""
                    )}
                    variant={pkg.popular ? "primary" : "secondary"}
                    asChild
                  >
                    <Link href={`/book?service=one-to-one&package=${pkg.id}`}>
                      {pkg.name}
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
              How It
              <br />
              <span className="text-neutral-400">Works</span>
            </h2>
          </div>

          <div className="mx-auto mt-16 max-w-3xl">
            <div className="space-y-8">
              {howItWorks.map((item, index) => (
                <div key={item.step} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center border-2 border-black font-black text-lg">
                      {item.step}
                    </div>
                    {index < howItWorks.length - 1 && (
                      <div className="mx-auto mt-2 h-16 w-0.5 bg-neutral-200" />
                    )}
                  </div>
                  <div className="pt-2">
                    <h3 className="font-bold uppercase tracking-wide text-black">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-neutral-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="bg-neutral-50 py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
              Questions?
              <br />
              <span className="text-neutral-400">We&apos;ve Got Answers</span>
            </h2>
          </div>

          <div className="mx-auto mt-16 max-w-3xl divide-y divide-neutral-200">
            {faqs.map((faq) => (
              <div key={faq.question} className="py-6">
                <h3 className="font-bold text-black">{faq.question}</h3>
                <p className="mt-3 text-neutral-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-black py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
              Let&apos;s Start
              <br />
              <span className="text-neutral-500">Their Journey</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-400">
              One session is all it takes to see the difference. Book today.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-neutral-200 rounded-none uppercase tracking-wider font-semibold"
                asChild
              >
                <Link href="/book?service=one-to-one">
                  Book 1:1 Coaching
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="border-neutral-700 bg-transparent text-white hover:bg-neutral-800"
                asChild
              >
                <a href={`tel:${SITE_CONFIG.phone.replace(/\s/g, "")}`}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Talk to Us First
                </a>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
