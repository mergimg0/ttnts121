"use client";

import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { FadeInUp, StaggerChildren, StaggerItem } from "@/lib/motion";
import { MapPin, ArrowRight, Car } from "lucide-react";
import { LOCATIONS } from "@/lib/constants";

export function LocationsPreview() {
  return (
    <section className="py-24 sm:py-32 bg-background">
      <Container>
        <FadeInUp>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Our Locations
            </h2>
            <p className="mt-6 text-lg text-foreground-muted">
              Three locations across Bedfordshire. All with easy parking.
            </p>
          </div>
        </FadeInUp>

        <StaggerChildren className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
          {LOCATIONS.map((location) => (
            <StaggerItem key={location.id}>
              <Link href={`/locations/${location.id}`}>
                <div className="group relative h-full bg-white p-6 rounded-2xl border border-neutral-100 hover:shadow-lg transition-shadow">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sky/10">
                    <MapPin className="h-6 w-6 text-navy" />
                  </div>

                  <h3 className="text-xl font-bold text-foreground">
                    {location.name}
                  </h3>
                  <p className="mt-1 text-sm text-foreground-muted">
                    {location.postcode}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-foreground-muted">
                    <Car className="h-3 w-3" />
                    Free parking
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-navy group-hover:text-sky transition-colors">
                    View sessions
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerChildren>

        <FadeInUp delay={0.2}>
          <div className="mt-16 text-center">
            <Button variant="secondary" size="lg" asChild>
              <Link href="/locations">
                Find Your Nearest Location
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </FadeInUp>
      </Container>
    </section>
  );
}
