import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Phone, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";

export function CTA() {
  return (
    <section className="py-20 sm:py-28 bg-neutral-50">
      <Container>
        <div className="relative bg-black px-6 py-16 sm:px-12 sm:py-24 lg:px-20">
          {/* Geometric decoration */}
          <div className="absolute right-0 top-0 h-32 w-32 border-r border-t border-[#00AEEF]/30" />
          <div className="absolute bottom-0 left-0 h-32 w-32 border-l border-b border-[#2E3192]/30" />

          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
              Try One Session.
              <br />
              <span className="text-neutral-500">See Why Kids Come Back.</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-400">
              No joining fee. No long-term commitment. Just your child, a football,
              and coaches who genuinely care.
            </p>

            {/* Risk reversal bullets */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-8">
              <span className="flex items-center gap-2 text-sm text-neutral-400">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Pay as you go
              </span>
              <span className="flex items-center gap-2 text-sm text-neutral-400">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Cancel anytime
              </span>
              <span className="flex items-center gap-2 text-sm text-neutral-400">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Full refund guarantee
              </span>
            </div>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-neutral-200 rounded-none uppercase tracking-wider font-semibold"
                asChild
              >
                <Link href="/book">
                  Book Your First Session
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="border-neutral-700 bg-transparent text-white hover:bg-neutral-800 hover:border-neutral-600"
                asChild
              >
                <Link href="/contact">Got Questions? Ask Us</Link>
              </Button>
            </div>

            <p className="mt-4 text-sm text-neutral-500">
              Most parents book within 2 days of visiting. Spots fill quickly.
            </p>

            <div className="mt-16 flex flex-col items-center justify-center gap-6 border-t border-neutral-800 pt-10 sm:flex-row sm:gap-12">
              <a
                href={`tel:${SITE_CONFIG.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-3 text-neutral-400 hover:text-white transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center border border-neutral-700">
                  <Phone className="h-4 w-4" />
                </div>
                <span className="font-medium">{SITE_CONFIG.phone}</span>
              </a>
              <a
                href={`mailto:${SITE_CONFIG.email}`}
                className="flex items-center gap-3 text-neutral-400 hover:text-white transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center border border-neutral-700">
                  <Mail className="h-4 w-4" />
                </div>
                <span className="font-medium">{SITE_CONFIG.email}</span>
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
