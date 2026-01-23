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
} from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Take The Next Step 121 - our mission, values, and the qualified team dedicated to helping children develop through football.",
};

const values = [
  {
    title: "Fun First",
    description:
      "Children learn best when they're enjoying themselves. We make every session engaging and exciting.",
    icon: Sparkles,
  },
  {
    title: "Individual Growth",
    description:
      "Every child is unique. We celebrate individual progress and help each child reach their potential.",
    icon: Target,
  },
  {
    title: "Life Skills",
    description:
      "Football teaches more than ball control. We focus on confidence, teamwork, and resilience.",
    icon: Heart,
  },
  {
    title: "Inclusive Environment",
    description:
      "All abilities welcome. We create a supportive space where every child feels they belong.",
    icon: Users,
  },
];

const credentials = [
  {
    title: "FA Qualified Coaches",
    description: "All coaches hold official FA coaching badges",
    icon: Award,
  },
  {
    title: "DBS Checked",
    description: "Enhanced background checks for your peace of mind",
    icon: Shield,
  },
  {
    title: "First Aid Trained",
    description: "Prepared for any situation to keep children safe",
    icon: CheckCircle,
  },
  {
    title: "Fully Insured",
    description: "Comprehensive insurance coverage for all sessions",
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
              About
              <br />
              <span className="text-neutral-500">{SITE_CONFIG.name}</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-400">
              Helping children across Bedfordshire discover their love for
              football while building confidence and life skills.
            </p>
          </div>
        </Container>
      </section>

      {/* Mission */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
              Our Mission
            </h2>
            <div className="mt-8 space-y-6 text-lg text-neutral-600 leading-relaxed">
              <p>
                At Take The Next Step 121, we believe every child deserves the
                chance to experience the joy of football. But we&apos;re about
                more than just the beautiful game.
              </p>
              <p>
                Our sessions are designed to help children grow - not just as
                players, but as people. We focus on building confidence,
                developing social skills, and creating an environment where
                every child feels valued and supported.
              </p>
              <p>
                Whether your child dreams of becoming the next Lioness or simply
                wants to have fun with friends after school, we&apos;re here to
                help them take the next step.
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
              Our
              <br />
              <span className="text-neutral-400">Values</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              The principles that guide everything we do.
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
              <span className="text-neutral-400">Matters</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              We take safeguarding seriously. All our coaches are fully vetted
              and qualified.
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
              Meet Our
              <br />
              <span className="text-neutral-400">Team</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              A dedicated team of coaches who share a passion for helping
              children grow through football.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-3xl border border-neutral-200 bg-white p-8 sm:p-12">
            <div className="text-center">
              <div className="mx-auto mb-8 h-24 w-24 border-2 border-black flex items-center justify-center">
                <span className="text-3xl font-black">4+</span>
              </div>
              <h3 className="text-xl font-bold uppercase tracking-wide text-black">
                Growing Team of Coaches
              </h3>
              <p className="mt-6 text-neutral-600 leading-relaxed">
                Our expanding team of FA qualified coaches brings diverse
                experience and a shared commitment to child development. Each
                coach is DBS checked, first aid trained, and genuinely
                passionate about helping children succeed.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <span className="border border-black px-4 py-2 text-xs font-bold uppercase tracking-wider">
                  FA Qualified
                </span>
                <span className="border border-black px-4 py-2 text-xs font-bold uppercase tracking-wider">
                  DBS Checked
                </span>
                <span className="border border-black px-4 py-2 text-xs font-bold uppercase tracking-wider">
                  First Aid Trained
                </span>
                <span className="border border-black px-4 py-2 text-xs font-bold uppercase tracking-wider">
                  Safeguarding Certified
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
              Ready to
              <br />
              <span className="text-neutral-500">Join Us?</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-400">
              Give your child the gift of football, friendship, and growing
              confidence.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-neutral-200 rounded-none uppercase tracking-wider font-semibold"
                asChild
              >
                <Link href="/book">
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
                <Link href="/contact">Get in Touch</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
