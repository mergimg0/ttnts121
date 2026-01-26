import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { ArrowRight, User, Users, Tent, PartyPopper, School } from "lucide-react";
import { SERVICES, SITE_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Our Services",
  description:
    "Discover our range of football coaching services for children ages 4-11: 1:1 coaching, group sessions, birthday parties, half term camps, and after school clubs.",
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  user: User,
  users: Users,
  tent: Tent,
  "party-popper": PartyPopper,
  school: School,
};

export default function ServicesPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              What We
              <br />
              <span className="text-neutral-500">Offer</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-400">
              From private 1:1 coaching to action-packed birthday parties.
              <br />
              Every session designed to build confidence through football.
            </p>
          </div>
        </Container>
      </section>

      {/* Services Grid */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => {
              const Icon = iconMap[service.icon] || User;
              return (
                <Link
                  key={service.id}
                  href={`/services/${service.slug}`}
                  className="group border border-neutral-200 bg-white p-8 transition-all hover:border-black hover:shadow-lg"
                >
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center border-2 border-black transition-colors group-hover:bg-black">
                    <Icon className="h-6 w-6 text-black transition-colors group-hover:text-white" />
                  </div>
                  <h2 className="text-xl font-bold uppercase tracking-wide text-black">
                    {service.name}
                  </h2>
                  <p className="mt-3 text-neutral-600">
                    {service.shortDescription}
                  </p>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-lg font-bold text-brand-green">
                      {service.priceDisplay}
                    </span>
                    <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-black opacity-0 transition-opacity group-hover:opacity-100">
                      Learn more
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                  <ul className="mt-6 space-y-2">
                    {service.features.slice(0, 3).map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm text-neutral-600"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Why Choose Us */}
      <section className="bg-neutral-50 py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
              Why Parents
              <br />
              <span className="text-neutral-400">Choose Us</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              Whatever service you choose, you get the same commitment.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-px bg-neutral-200 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { stat: "4-11", label: "Age Range" },
              { stat: "8:1", label: "Max Ratio" },
              { stat: "FA", label: "Qualified" },
              { stat: "DBS", label: "Checked" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white p-6 text-center"
              >
                <div className="text-3xl font-black text-black">{item.stat}</div>
                <div className="mt-2 text-sm font-semibold uppercase tracking-wider text-neutral-500">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Not Sure Which */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-3xl border border-neutral-200 bg-white p-8 sm:p-12">
            <div className="text-center">
              <h2 className="text-2xl font-black uppercase tracking-tight text-black sm:text-3xl">
                Not Sure Which Is Right?
              </h2>
              <p className="mt-4 text-neutral-600">
                Every child is different. Call us and we&apos;ll help you find the
                perfect fit - whether that&apos;s building confidence in a group
                setting or fast-tracking skills with private coaching.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="rounded-none uppercase tracking-wider font-semibold"
                  asChild
                >
                  <a href={`tel:${SITE_CONFIG.phone.replace(/\s/g, "")}`}>
                    Call {SITE_CONFIG.phone}
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  asChild
                >
                  <Link href="/contact">Send a Message</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-navy py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
              Ready To Start?
              <br />
              <span className="text-neutral-500">Book Today</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-400">
              Join hundreds of happy families across Bedfordshire.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-neutral-200 rounded-none uppercase tracking-wider font-semibold"
                asChild
              >
                <Link href="/book">
                  Book Now
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
