import type { Metadata } from "next";
import { FAQ } from "@/components/sections/faq";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "FAQ | Take The Next Step 121",
  description: "Frequently asked questions about our football coaching sessions for children ages 4-11.",
};

export default function FAQPage() {
  return (
    <main>
      {/* Header Section */}
      <section className="bg-navy py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-3xl tracking-tight text-white sm:text-4xl lg:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-6 text-lg text-white/80">
              Everything you need to know about our football coaching sessions.
            </p>
          </div>
        </Container>
      </section>

      {/* FAQ Section */}
      <FAQ />
    </main>
  );
}
