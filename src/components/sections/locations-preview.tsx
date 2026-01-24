import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, Car } from "lucide-react";
import { LOCATIONS } from "@/lib/constants";

export function LocationsPreview() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl lg:text-5xl">
            Closer Than
            <br />
            <span className="text-neutral-400">You Think</span>
          </h2>
          <p className="mt-6 text-lg text-neutral-600">
            Three locations across Bedfordshire. All with easy parking.
            <br />
            <span className="text-neutral-500">Most families are less than 10 minutes away.</span>
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-px bg-neutral-200 sm:grid-cols-3">
          {LOCATIONS.map((location, index) => (
            <Link
              key={location.id}
              href={`/locations/${location.id}`}
              className="group relative bg-white p-8 transition-all hover:bg-black"
            >
              {/* Number */}
              <span className="absolute right-4 top-4 text-5xl font-black text-neutral-100 group-hover:text-neutral-800 transition-colors">
                0{index + 1}
              </span>

              <div className="relative">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center border-2 border-black group-hover:border-white transition-colors">
                  <MapPin className="h-5 w-5 text-black group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-wide text-black group-hover:text-white transition-colors">
                  {location.name}
                </h3>
                <p className="mt-2 text-sm text-neutral-500 group-hover:text-neutral-400 transition-colors">
                  {location.postcode}
                </p>
                <p className="mt-2 flex items-center gap-1 text-xs text-neutral-400 group-hover:text-neutral-500 transition-colors">
                  <Car className="h-3 w-3" />
                  Free parking
                </p>
                <div className="mt-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-black group-hover:text-white transition-colors">
                  View sessions
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button variant="secondary" size="lg" asChild>
            <Link href="/locations">
              Find Your Nearest Location
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
