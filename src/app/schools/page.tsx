import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import {
  School,
  Clock,
  Users,
  Shield,
  Target,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
} from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Schools Partnership",
  description:
    "Partner with Take The Next Step 121 to bring quality football coaching to your school. After-school clubs, PE support, and holiday camps.",
};

const benefits = [
  {
    title: "Curriculum-Aligned PE Support",
    description:
      "Our sessions complement your PE curriculum, reinforcing physical literacy and sports skills.",
    icon: Target,
  },
  {
    title: "Safeguarding First",
    description:
      "All coaches are DBS checked, first aid trained, and follow comprehensive safeguarding policies.",
    icon: Shield,
  },
  {
    title: "Flexible Scheduling",
    description:
      "We work around your school timetable - before school, lunchtimes, or after-school clubs.",
    icon: Clock,
  },
  {
    title: "Inclusive Approach",
    description:
      "Sessions designed to engage all abilities, building confidence in every participant.",
    icon: Users,
  },
];

const services = [
  {
    title: "After-School Clubs",
    description:
      "Weekly football clubs that give children a fun, active way to end the school day. We handle registration, equipment, and delivery.",
    features: [
      "Term-time sessions",
      "All equipment provided",
      "Age-appropriate groups",
      "Progress reports available",
    ],
  },
  {
    title: "PE Curriculum Support",
    description:
      "Support your PE department with specialist football coaching. We can deliver full lessons or work alongside your staff.",
    features: [
      "KS1 and KS2 focused",
      "Scheme of work aligned",
      "Staff CPD available",
      "Assessment support",
    ],
  },
  {
    title: "Holiday Camps",
    description:
      "Keep children active during school holidays with multi-day football camps hosted at your venue.",
    features: [
      "Half-term and summer",
      "Full or half days",
      "Use your facilities",
      "Breakfast club option",
    ],
  },
  {
    title: "One-Off Events",
    description:
      "Sports days, tournament support, or special football events for celebrations and community days.",
    features: [
      "Tournaments organised",
      "Equipment provided",
      "Prizes and medals",
      "Professional delivery",
    ],
  },
];

const steps = [
  {
    step: "1",
    title: "Get in Touch",
    description:
      "Contact us to discuss your school's needs. We'll arrange a call or visit to understand what you're looking for.",
  },
  {
    step: "2",
    title: "Tailored Proposal",
    description:
      "We'll create a bespoke package that fits your requirements, timetable, and budget.",
  },
  {
    step: "3",
    title: "Safeguarding Check",
    description:
      "We'll share our policies, insurance, and DBS certificates. Happy to complete any supplier forms you require.",
  },
  {
    step: "4",
    title: "Launch & Deliver",
    description:
      "We'll promote the programme, handle registrations, and start delivering great sessions.",
  },
];

export default function SchoolsPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-black py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              Schools
              <br />
              <span className="text-neutral-500">Partnership</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-400">
              Bring professional football coaching to your school. We work with
              primary schools across Bedfordshire to deliver engaging,
              high-quality PE and after-school programmes.
            </p>
            <div className="mt-10">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-neutral-200 rounded-none uppercase tracking-wider font-semibold"
                asChild
              >
                <Link href="/contact">
                  Enquire Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Benefits */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl lg:text-5xl">
              Why Partner
              <br />
              <span className="text-neutral-400">With Us?</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              We take the hassle out of delivering quality sports provision.
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

      {/* Services */}
      <section className="bg-neutral-50 py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl lg:text-5xl">
              Our Services
              <br />
              <span className="text-neutral-400">For Schools</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              Flexible options to suit your school&apos;s needs and budget.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-px bg-neutral-200 lg:grid-cols-2">
            {services.map((service) => (
              <div
                key={service.title}
                className="bg-white p-8"
              >
                <h3 className="text-xl font-bold uppercase tracking-wide text-black">
                  {service.title}
                </h3>
                <p className="mt-3 text-neutral-600">{service.description}</p>
                <ul className="mt-6 space-y-3">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-black" />
                      <span className="text-sm text-neutral-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl lg:text-5xl">
              Getting Started
              <br />
              <span className="text-neutral-400">Is Easy</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              From initial enquiry to delivery, we make the process simple.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-3xl">
            <div className="space-y-0">
              {steps.map((item, index) => (
                <div key={item.step} className="flex gap-6 border-l-2 border-neutral-200 pb-12 pl-8 last:pb-0 relative">
                  <div className="absolute -left-5 top-0 flex h-10 w-10 items-center justify-center border-2 border-black bg-white">
                    <span className="text-lg font-black">{item.step}</span>
                  </div>
                  <div className="pt-1">
                    <h3 className="text-lg font-bold uppercase tracking-wide text-black">
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

      {/* Contact CTA */}
      <section className="bg-black py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center border-2 border-neutral-700">
              <School className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
              Let&apos;s Talk About
              <br />
              <span className="text-neutral-500">Your School</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-400">
              Whether you&apos;re looking to enhance PE provision, start an
              after-school club, or host holiday camps, we&apos;d love to hear
              from you.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-8">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-12">
                <a
                  href={`tel:${SITE_CONFIG.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-3 text-neutral-400 hover:text-white transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center border border-neutral-700">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{SITE_CONFIG.phone}</span>
                </a>
                <a
                  href={`mailto:${SITE_CONFIG.email}`}
                  className="flex items-center gap-3 text-neutral-400 hover:text-white transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center border border-neutral-700">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{SITE_CONFIG.email}</span>
                </a>
              </div>

              <Button
                size="lg"
                className="bg-white text-black hover:bg-neutral-200 rounded-none uppercase tracking-wider font-semibold"
                asChild
              >
                <Link href="/contact">
                  Send an Enquiry
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
