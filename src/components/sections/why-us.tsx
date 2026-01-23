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
    title: "Fun Comes First",
    description:
      "Children learn best when they're having fun. Our sessions are designed to be engaging and exciting.",
    icon: Sparkles,
  },
  {
    title: "Personalized Attention",
    description:
      "Small group sizes mean every child gets the attention they deserve.",
    icon: Users,
  },
  {
    title: "Qualified Coaches",
    description:
      "All our coaches hold FA qualifications and are trained in child development.",
    icon: Trophy,
  },
  {
    title: "Confidence Building",
    description:
      "We focus on building confidence, resilience, and social skills.",
    icon: Heart,
  },
  {
    title: "Safe Environment",
    description:
      "All staff are DBS checked, first aid trained, and follow safeguarding policies.",
    icon: Shield,
  },
  {
    title: "Development Focus",
    description:
      "We track progress and celebrate achievements. Watch your child grow week by week.",
    icon: Star,
  },
];

export function WhyUs() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl lg:text-5xl">
            Why Families
            <br />
            <span className="text-neutral-400">Choose Us</span>
          </h2>
          <p className="mt-6 text-lg text-neutral-600">
            We&apos;re not just about football. We&apos;re about helping children grow.
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
