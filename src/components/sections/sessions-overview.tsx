import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Calendar, Sun, TreePine, ArrowRight, Star, Clock } from "lucide-react";

const sessionTypes = [
  {
    id: "after-school",
    title: "After School Club",
    description:
      "Drop off stressed, pick up smiling. Our after-school sessions give kids the perfect mid-week energy release while you finish work.",
    icon: Calendar,
    features: ["Weekly during term time", "Ages 4-11", "3:30pm - 4:30pm slots"],
    href: "/sessions",
    badge: "Most Popular",
    price: "From \u00A36/session",
  },
  {
    id: "half-term",
    title: "Half Term Camps",
    description:
      "A week of football, friendships, and fun. Kids get tired out (in a good way) while you get peace of mind during school breaks.",
    icon: TreePine,
    features: ["Full day camps", "All abilities welcome", "Lunch supervision available"],
    href: "/sessions",
    badge: null,
    price: "From \u00A320/day",
  },
  {
    id: "holiday",
    title: "Holiday Camps",
    description:
      "Summer sorted. Easter covered. Our holiday camps keep kids active, social, and having the time of their lives while school's out.",
    icon: Sun,
    features: ["All school holidays", "Flexible daily booking", "8am early drop-off"],
    href: "/sessions",
    badge: "Book Early - Limited Spots",
    price: "From \u00A325/day",
  },
];

export function SessionsOverview() {
  return (
    <section className="py-20 sm:py-28 bg-neutral-50">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl lg:text-5xl">
            Choose Your
            <br />
            <span className="text-neutral-400">Game Plan</span>
          </h2>
          <p className="mt-6 text-lg text-neutral-600">
            Term-time clubs for regular development. Holiday camps for all-day fun.
            <br />
            <span className="text-neutral-500">Mix and match to suit your schedule.</span>
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
          {sessionTypes.map((session, index) => (
            <div
              key={session.id}
              className="group relative bg-white p-8 transition-all hover:bg-black hover-lift"
            >
              {/* Badge */}
              {session.badge && (
                <span className="absolute -top-3 left-6 bg-[#2E3192] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  {session.badge}
                </span>
              )}

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

                {/* Price */}
                <p className="mt-4 text-lg font-bold text-[#2E3192] group-hover:text-[#00AEEF] transition-colors">
                  {session.price}
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
                  View Schedule
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button size="lg" asChild>
            <Link href="/book">
              Book Your Child&apos;s First Session
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-4 text-sm text-neutral-500">
            <Clock className="inline-block h-4 w-4 mr-1" />
            Takes 2 minutes. No payment required to reserve.
          </p>
        </div>
      </Container>
    </section>
  );
}
