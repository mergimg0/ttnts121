"use client";

import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { FadeInUp } from "@/lib/motion";
import { Phone, Mail, ArrowRight, MapPin } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";

export function CTA() {
  return (
    <section className="py-24 sm:py-32 bg-background-alt">
      <Container>
        <FadeInUp>
          <div className="relative bg-navy px-6 py-16 sm:px-12 sm:py-20 lg:px-20 rounded-3xl overflow-hidden">
            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl tracking-tight text-white sm:text-4xl lg:text-5xl">
                Try One Session
              </h2>
              <p className="mt-6 text-lg text-white/70">
                No joining fee. No long-term commitment. Just football
                and coaches who genuinely care.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  variant="sky"
                  asChild
                >
                  <Link href="/book">
                    Book Your First Session
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="dark"
                  asChild
                >
                  <Link href="/contact">Got Questions? Ask Us</Link>
                </Button>
              </div>

              <div className="mt-12 flex flex-row flex-wrap items-center justify-center gap-3 sm:gap-6 border-t border-white/10 pt-10">
                <a
                  href={`tel:${SITE_CONFIG.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-1.5 text-xs sm:text-sm text-white/60 hover:text-white transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>{SITE_CONFIG.phone}</span>
                </a>
                <a
                  href={`mailto:${SITE_CONFIG.email}`}
                  className="flex items-center gap-1.5 text-xs sm:text-sm text-white/60 hover:text-white transition-colors"
                >
                  <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{SITE_CONFIG.email}</span>
                  <span className="sm:hidden">Email</span>
                </a>
                <span className="flex items-center gap-1.5 text-xs sm:text-sm text-white/60">
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>Luton · Barton · Silsoe</span>
                </span>
              </div>
            </div>
          </div>
        </FadeInUp>
      </Container>
    </section>
  );
}
