import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Hero } from "@/components/sections/hero";

// Dynamic imports for below-fold sections
const SessionsOverview = dynamic(
  () => import("@/components/sections/sessions-overview").then((mod) => mod.SessionsOverview),
  { ssr: true }
);

const Testimonials = dynamic(
  () => import("@/components/sections/testimonials").then((mod) => mod.Testimonials),
  { ssr: true }
);

const LocationsPreview = dynamic(
  () => import("@/components/sections/locations-preview").then((mod) => mod.LocationsPreview),
  { ssr: true }
);

const CTA = dynamic(
  () => import("@/components/sections/cta").then((mod) => mod.CTA),
  { ssr: true }
);

// Loading skeleton for sections
function SectionSkeleton() {
  return (
    <div className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="mx-auto h-8 w-64 rounded bg-neutral-200" />
          <div className="mx-auto mt-4 h-4 w-96 rounded bg-neutral-100" />
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-neutral-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Suspense fallback={<SectionSkeleton />}>
        <SessionsOverview />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <Testimonials />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <LocationsPreview />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <CTA />
      </Suspense>
    </>
  );
}
