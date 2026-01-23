import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Calendar, ArrowRight } from "lucide-react";
import { LOCATIONS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Locations",
  description:
    "Find football training sessions near you in Luton, Barton-le-Clay, and Silsoe. We bring quality coaching to communities across Bedfordshire.",
};

export default function LocationsPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-black py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              Our
              <br />
              <span className="text-neutral-500">Locations</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-400">
              We run sessions across Bedfordshire, making quality football
              coaching accessible to families in your area.
            </p>
          </div>
        </Container>
      </section>

      {/* Locations Grid */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="grid gap-px bg-neutral-200 lg:grid-cols-3">
            {LOCATIONS.map((location, index) => (
              <div
                key={location.id}
                className="group relative bg-white p-8 transition-colors hover:bg-black"
              >
                {/* Number */}
                <span className="absolute right-6 top-6 text-7xl font-black text-neutral-100 group-hover:text-neutral-800 transition-colors">
                  0{index + 1}
                </span>

                <div className="relative">
                  {/* Icon */}
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center border-2 border-black group-hover:border-white transition-colors">
                    <MapPin className="h-6 w-6 text-black group-hover:text-white transition-colors" />
                  </div>

                  <h2 className="text-2xl font-bold uppercase tracking-wide text-black group-hover:text-white transition-colors">
                    {location.name}
                  </h2>
                  <p className="mt-2 text-neutral-600 group-hover:text-neutral-400 transition-colors">
                    {location.address}
                  </p>
                  <p className="text-sm font-bold text-black group-hover:text-white transition-colors">
                    {location.postcode}
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-neutral-600 group-hover:text-neutral-400 transition-colors">
                      <Clock className="h-4 w-4" />
                      <span>After school &amp; weekends</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-neutral-600 group-hover:text-neutral-400 transition-colors">
                      <Calendar className="h-4 w-4" />
                      <span>Term time &amp; holidays</span>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <Button className="flex-1" asChild>
                      <Link href="/book">Book Here</Link>
                    </Button>
                    <Button variant="secondary" asChild>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(location.address + " " + location.postcode)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Directions
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Expansion Note */}
      <section className="bg-neutral-50 py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl lg:text-5xl">
              Want Us in
              <br />
              <span className="text-neutral-400">Your Area?</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              We&apos;re always looking to bring quality football coaching to
              new communities. If you&apos;d like us to run sessions in your
              school or local venue, get in touch.
            </p>
            <Button className="mt-10" size="lg" asChild>
              <Link href="/contact">
                Get in Touch
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
