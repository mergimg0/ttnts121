import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Calendar, Sun, TreePine, ArrowRight } from "lucide-react";

const sessionTypes = [
  {
    id: "after-school",
    title: "After School",
    description:
      "Weekly sessions held at local schools. Perfect for developing skills and making friends.",
    icon: Calendar,
    features: ["Weekly during term time", "Ages 4-11", "School pickup friendly"],
    href: "/sessions",
  },
  {
    id: "half-term",
    title: "Half Term",
    description:
      "Intensive football fun during half term holidays. Full days of coaching and games.",
    icon: TreePine,
    features: ["Full day camps", "All abilities", "Holiday childcare"],
    href: "/sessions",
  },
  {
    id: "holiday",
    title: "Holiday Camps",
    description:
      "Summer, Easter, and Christmas camps packed with football activities and tournaments.",
    icon: Sun,
    features: ["School holidays", "Flexible booking", "Early drop-off"],
    href: "/sessions",
  },
];

export function SessionsOverview() {
  return (
    <section className="py-20 sm:py-28 bg-neutral-50">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl lg:text-5xl">
            Sessions for
            <br />
            <span className="text-neutral-400">Every Schedule</span>
          </h2>
          <p className="mt-6 text-lg text-neutral-600">
            Term-time clubs or holiday cover — we have you sorted.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
          {sessionTypes.map((session, index) => (
            <div
              key={session.id}
              className="group relative bg-white p-8 transition-all hover:bg-black hover-lift"
            >
              {/* Number */}
              <span className="absolute right-6 top-6 text-6xl font-black text-neutral-100 group-hover:text-neutral-800 transition-colors">
                0{index + 1}
              </span>

              <div className="relative">
                <session.icon className="h-8 w-8 text-black group-hover:text-white transition-colors" />
                <h3 className="mt-6 text-xl font-bold uppercase tracking-wide text-black group-hover:text-white transition-colors">
                  {session.title}
                </h3>
                <p className="mt-3 text-neutral-600 group-hover:text-neutral-400 transition-colors">
                  {session.description}
                </p>

                <ul className="mt-6 space-y-2">
                  {session.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-neutral-500 group-hover:text-neutral-400 transition-colors"
                    >
                      <span className="h-1 w-1 rounded-full bg-black group-hover:bg-white transition-colors" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={session.href}
                  className="mt-8 inline-flex items-center text-sm font-semibold uppercase tracking-wider text-black group-hover:text-white transition-colors"
                >
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button size="lg" asChild>
            <Link href="/book">
              Book Your Child's Place
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
