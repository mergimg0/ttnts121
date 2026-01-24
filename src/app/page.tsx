import { Hero } from "@/components/sections/hero";
import { SessionsOverview } from "@/components/sections/sessions-overview";
import { WhyUs } from "@/components/sections/why-us";
import { Testimonials } from "@/components/sections/testimonials";
import { LocationsPreview } from "@/components/sections/locations-preview";
import { FAQ } from "@/components/sections/faq";
import { CTA } from "@/components/sections/cta";

export default function Home() {
  return (
    <>
      <Hero />
      <SessionsOverview />
      <WhyUs />
      <Testimonials />
      <LocationsPreview />
      <FAQ />
      <CTA />
    </>
  );
}
