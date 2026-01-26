import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { SessionList } from "@/components/sessions/session-list";
import {
  ArrowRight,
  School,
  Clock,
  Users,
  Calendar,
  CheckCircle,
  Heart,
  Zap,
} from "lucide-react";
import { SITE_CONFIG, LOCATIONS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "After School Clubs | Weekly Football Sessions",
  description:
    "Weekly after school football clubs during term time. The perfect mid-week energy release that fits around work schedules. Just £6 per session.",
};

const benefits = [
  {
    title: "Work-Friendly Timing",
    description:
      "Sessions run 3:30-4:30pm. Pick up a tired, happy child after work instead of a restless one.",
    icon: Clock,
  },
  {
    title: "Term-Time Routine",
    description:
      "Same day, same time, every week. Kids thrive on routine. Parents thrive on predictability.",
    icon: Calendar,
  },
  {
    title: "Energy Release",
    description:
      "All that pent-up school energy? Gone. They'll come home ready for homework (maybe) and dinner (definitely).",
    icon: Zap,
  },
  {
    title: "School Friends, Football Friends",
    description:
      "Familiar faces from school plus new ones from football. Friendships that cross playgrounds.",
    icon: Heart,
  },
];

const whatToExpect = [
  {
    time: "3:15pm",
    activity: "Arrive & change (if needed)",
  },
  {
    time: "3:30pm",
    activity: "Fun warm-up games",
  },
  {
    time: "3:45pm",
    activity: "Skill of the week",
  },
  {
    time: "4:00pm",
    activity: "Mini matches",
  },
  {
    time: "4:25pm",
    activity: "Cool down & collect",
  },
];

const faqs = [
  {
    question: "Which schools do you run clubs at?",
    answer:
      "We currently run after school clubs in Luton, Barton Le Clay, and Silsoe. Contact us to find out specific schools or to request a club at your child's school.",
  },
  {
    question: "Do I need to book every week?",
    answer:
      "You can book weekly (pay as you go) or block book a half-term in advance. Block booking guarantees your spot and saves admin hassle.",
  },
  {
    question: "What if my child is ill one week?",
    answer:
      "No problem. If you let us know before the session, we'll credit you for a future week. We're parents too - we get it.",
  },
  {
    question: "What do they need to bring?",
    answer:
      "Just trainers or boots and a water bottle. If they're coming straight from school, normal PE kit is fine. No special equipment needed.",
  },
  {
    question: "How do you handle pickup?",
    answer:
      "Sessions end at 4:30pm. You'll receive a text when we wrap up. We won't release children to anyone not on your approved pickup list.",
  },
  {
    question: "Is it suitable for complete beginners?",
    answer:
      "Absolutely. We group by ability within sessions. Your child will play with others at their level and progress at their own pace.",
  },
];

export default function AfterSchoolClubsPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-black py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-green">
              After School Clubs
            </p>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              Football
              <br />
              <span className="text-neutral-500">After School</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-400">
              The perfect mid-week energy release.
              <br />
              Weekly football that fits around work.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-neutral-200 rounded-none uppercase tracking-wider font-semibold"
                asChild
              >
                <Link href="/book?service=after-school-clubs">
                  Book a Place
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
                  Check Availability
                </a>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Key Info */}
      <section className="border-b border-neutral-200 bg-white py-8">
        <Container>
          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-brand-green" />
              <span className="font-semibold">3:30 - 4:30pm</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-brand-green">£6</span>
              <span className="text-neutral-600">per session</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-brand-green" />
              <span className="font-semibold">Weekly (Term Time)</span>
            </div>
          </div>
        </Container>
      </section>

      {/* Benefits */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
              Why Parents
              <br />
              <span className="text-neutral-400">Love It</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              Not just childcare. Proper coaching that happens to be convenient.
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

      {/* What to Expect */}
      <section className="bg-neutral-50 py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
              A Typical
              <br />
              <span className="text-neutral-400">Session</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              One hour of structured fun. Every minute counts.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-xl">
            <div className="space-y-4">
              {whatToExpect.map((item) => (
                <div
                  key={item.time}
                  className="flex items-center gap-6 border border-neutral-200 bg-white p-4"
                >
                  <div className="w-16 flex-shrink-0 font-bold text-brand-green">
                    {item.time}
                  </div>
                  <div className="font-medium">{item.activity}</div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Available Sessions */}
      <section className="py-20 sm:py-28">
        <Container>
          <SessionList
            serviceType="after-school"
            title="Available Sessions"
            subtitle="Book your child's spot in our after school clubs"
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
              <span className="text-neutral-400">Run Clubs</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              Currently running at schools across these areas.
              <br />
              Contact us for specific school information.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-3xl gap-6 sm:grid-cols-3">
            {LOCATIONS.map((location) => (
              <div
                key={location.id}
                className="border border-neutral-200 bg-white p-6 text-center"
              >
                <School className="mx-auto h-8 w-8 text-neutral-400" />
                <h3 className="mt-4 font-bold uppercase tracking-wide text-black">
                  {location.name}
                </h3>
                <p className="mt-2 text-sm text-neutral-500">Schools in area</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-8 max-w-xl text-center">
            <p className="text-neutral-600">
              Don&apos;t see your school? We&apos;re always expanding.{" "}
              <Link href="/contact" className="font-semibold text-brand-green hover:underline">
                Contact us
              </Link>{" "}
              to request a club at your child&apos;s school.
            </p>
          </div>
        </Container>
      </section>

      {/* What's Included */}
      <section className="bg-neutral-50 py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
              Every Session
              <br />
              <span className="text-neutral-400">Includes</span>
            </h2>
          </div>

          <div className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-2">
            {[
              "FA-qualified coaching",
              "All equipment provided",
              "Age-appropriate groups",
              "Progress tracking",
              "End of term awards",
              "Parent updates",
              "Safe pickup procedures",
              "First aid trained staff",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 border border-neutral-200 bg-white p-4"
              >
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-brand-green" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
              Common
              <br />
              <span className="text-neutral-400">Questions</span>
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
              Book A
              <br />
              <span className="text-neutral-500">Spot</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-400">
              Book their spot now. Spaces are limited to keep groups small.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-neutral-200 rounded-none uppercase tracking-wider font-semibold"
                asChild
              >
                <Link href="/book?service=after-school-clubs">
                  Book After School Club
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
