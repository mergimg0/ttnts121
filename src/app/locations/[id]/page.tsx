import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  Users,
  Phone,
  ArrowLeft,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { LOCATIONS, SESSION_TYPES, SITE_CONFIG } from "@/lib/constants";

type Params = Promise<{ id: string }>;

export async function generateStaticParams() {
  return LOCATIONS.map((location) => ({
    id: location.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const location = LOCATIONS.find((l) => l.id === id);

  if (!location) {
    return {
      title: "Location Not Found",
    };
  }

  return {
    title: `Football Training in ${location.name}`,
    description: `Kids football sessions in ${location.name}, ${location.postcode}. After school clubs, holiday camps, and half-term sessions for ages 4-11.`,
  };
}

export default async function LocationPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const location = LOCATIONS.find((l) => l.id === id);

  if (!location) {
    notFound();
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-black py-20 sm:py-28">
        <Container>
          <Link
            href="/locations"
            className="mb-8 inline-flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm uppercase tracking-wider"
          >
            <ArrowLeft className="h-4 w-4" />
            All Locations
          </Link>

          <div className="max-w-3xl">
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              Football Sessions in
              <br />
              <span className="text-neutral-500">{location.name}</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-400">
              Join us at {location.address} for fun, engaging football sessions
              designed to help children develop skills and confidence.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-neutral-200 rounded-none uppercase tracking-wider font-semibold"
                asChild
              >
                <Link href="/book">
                  Book at {location.name}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="border-neutral-700 bg-transparent text-white hover:bg-neutral-800"
                asChild
              >
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(location.address + " " + location.postcode)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get Directions
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Location Details */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="grid gap-16 lg:grid-cols-2">
            {/* Info */}
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-wide text-black">
                About This Venue
              </h2>
              <p className="mt-4 text-neutral-600 leading-relaxed">
                Our {location.name} sessions are held at a fantastic venue with
                excellent facilities. Whether your child is joining us for
                after-school sessions or holiday camps, they&apos;ll enjoy
                top-quality coaching in a safe, friendly environment.
              </p>

              <div className="mt-10 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center border-2 border-black">
                    <MapPin className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold uppercase tracking-wide text-black">Address</h3>
                    <p className="text-neutral-600">{location.address}</p>
                    <p className="font-bold text-black">
                      {location.postcode}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center border-2 border-black">
                    <Clock className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold uppercase tracking-wide text-black">
                      Session Times
                    </h3>
                    <p className="text-neutral-600">After school: 3:30pm - 5pm</p>
                    <p className="text-neutral-600">Holiday camps: 9am - 3pm</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center border-2 border-black">
                    <Users className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold uppercase tracking-wide text-black">Age Groups</h3>
                    <p className="text-neutral-600">
                      Mini Kickers (4-5), Juniors (6-7), Seniors (8-9), Advanced
                      (10-11)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center border-2 border-black">
                    <Phone className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold uppercase tracking-wide text-black">Contact</h3>
                    <a
                      href={`tel:${SITE_CONFIG.phone.replace(/\s/g, "")}`}
                      className="text-black hover:underline"
                    >
                      {SITE_CONFIG.phone}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="border border-neutral-200 p-8">
              <div className="flex h-full min-h-[300px] items-center justify-center bg-neutral-50">
                <div className="text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border-2 border-neutral-300">
                    <MapPin className="h-8 w-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-600">
                    {location.address}
                  </p>
                  <p className="font-bold text-black">{location.postcode}</p>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(location.address + " " + location.postcode)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 text-sm uppercase tracking-wider text-black hover:underline"
                  >
                    Open in Google Maps
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Sessions Available */}
      <section className="bg-neutral-50 py-20 sm:py-28">
        <Container>
          <h2 className="text-2xl font-bold uppercase tracking-wide text-black">
            Sessions at {location.name}
          </h2>
          <p className="mt-3 text-neutral-600">
            Choose from our range of sessions running at this venue.
          </p>

          <div className="mt-12 grid gap-px bg-neutral-200 sm:grid-cols-3">
            {SESSION_TYPES.map((session) => (
              <div
                key={session.id}
                className="bg-white p-8"
              >
                <h3 className="text-lg font-bold uppercase tracking-wide text-black">
                  {session.name}
                </h3>
                <p className="mt-3 text-sm text-neutral-600">
                  {session.description}
                </p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-black">
                    £{session.priceFrom}
                  </span>
                  <span className="text-sm text-neutral-500">per session</span>
                </div>
                <Button className="mt-6 w-full" asChild>
                  <Link href="/book">Book Now</Link>
                </Button>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Other Locations */}
      <section className="py-20 sm:py-28">
        <Container>
          <h2 className="text-2xl font-bold uppercase tracking-wide text-black">
            Other Locations
          </h2>
          <p className="mt-3 text-neutral-600">
            Can&apos;t make it to {location.name}? Check out our other venues.
          </p>

          <div className="mt-12 grid gap-px bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
            {LOCATIONS.filter((l) => l.id !== location.id).map((otherLoc) => (
              <Link
                key={otherLoc.id}
                href={`/locations/${otherLoc.id}`}
                className="group flex items-center gap-4 bg-white p-6 transition-colors hover:bg-black"
              >
                <div className="flex h-10 w-10 items-center justify-center border border-neutral-300 group-hover:border-white transition-colors">
                  <MapPin className="h-5 w-5 text-black group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="font-bold uppercase tracking-wide text-black group-hover:text-white transition-colors">
                    {otherLoc.name}
                  </p>
                  <p className="text-sm text-neutral-500 group-hover:text-neutral-400 transition-colors">
                    {otherLoc.postcode}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
