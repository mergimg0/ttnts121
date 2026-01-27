"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { HeroBackground } from "@/components/sections/hero-background";
import { FadeInUp, FadeInRight } from "@/lib/motion";
import { ArrowRight, Star } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-28 lg:py-36">
      <HeroBackground />

      <Container className="relative">
        {/* Two-column layout on desktop */}
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">

          {/* Left column - Content */}
          <div className="max-w-xl">
            <FadeInUp>
              <p className="text-sm font-medium text-navy tracking-wide">
                Limited spots for February term
              </p>
            </FadeInUp>

            {/* Main heading - single fade, no stagger */}
            <FadeInUp delay={0.1}>
              <h1 className="mt-4 font-display text-5xl tracking-tight text-foreground sm:text-6xl lg:text-7xl leading-[1.1]">
                Where Kids Become{" "}
                <span className="text-brand-navy">Team Players</span>
              </h1>
            </FadeInUp>

            {/* Subheading */}
            <FadeInUp delay={0.2}>
              <p className="mt-6 text-lg text-foreground-muted leading-relaxed">
                Fun football coaching that builds confidence, not pressure.{" "}
                Ages 4-11 in Luton, Barton Le Clay & Silsoe.
              </p>
            </FadeInUp>

            {/* Trust badges - simplified to text */}
            <FadeInUp delay={0.25}>
              <p className="mt-6 text-sm text-foreground-muted">
                FA Qualified · DBS Checked · Fully Insured
              </p>
            </FadeInUp>

            {/* CTA buttons */}
            <FadeInUp delay={0.3}>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button size="lg" className="group" asChild>
                  <Link href="/book">
                    Book Your Free Trial
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/sessions">See Session Times</Link>
                </Button>
              </div>
            </FadeInUp>
          </div>

          {/* Right column - Image placeholder + testimonial card */}
          <div className="relative lg:pl-8">
            <FadeInRight delay={0.2}>
              <div className="relative aspect-[4/5] rounded-3xl bg-gradient-to-br from-sky/5 via-navy/5 to-sky-light overflow-hidden border border-neutral-100">
                {/* Placeholder pattern */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="mx-auto h-24 w-24 rounded-full bg-navy/10 flex items-center justify-center mb-4">
                      <span className="text-4xl">⚽</span>
                    </div>
                    <p className="text-sm text-foreground-muted">
                      Photo coming soon
                    </p>
                  </div>
                </div>

                {/* Static testimonial card */}
                <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-xs bg-white rounded-2xl shadow-lg p-4 border border-neutral-100">
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground-muted italic">
                    &ldquo;My son went from hiding behind my legs to running in shouting hello!&rdquo;
                  </p>
                  <p className="mt-2 text-xs font-semibold text-foreground">
                    Sarah M. - Barton Le Clay
                  </p>
                </div>
              </div>
            </FadeInRight>
          </div>
        </div>

      </Container>
    </section>
  );
}
