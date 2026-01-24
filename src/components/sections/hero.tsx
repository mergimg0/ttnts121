import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Shield, Award, FileCheck, Heart, ArrowRight, Star } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-28 lg:py-36">
      {/* Subtle geometric background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 top-0 h-[600px] w-[600px] rounded-full border border-neutral-100" />
        <div className="absolute -left-20 bottom-0 h-[400px] w-[400px] rounded-full border border-neutral-100" />
      </div>

      <Container className="relative">
        <div className="mx-auto max-w-4xl text-center">
          {/* Trust badges - minimal */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-neutral-500">
              <Shield className="h-3.5 w-3.5" />
              FA Qualified
            </span>
            <span className="text-neutral-300">|</span>
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-neutral-500">
              <Award className="h-3.5 w-3.5" />
              DBS Checked
            </span>
            <span className="text-neutral-300">|</span>
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-neutral-500">
              <FileCheck className="h-3.5 w-3.5" />
              Fully Insured
            </span>
          </div>

          {/* Main heading - CRO Option B: Transformation-focused */}
          <h1 className="text-5xl font-black uppercase tracking-tight text-black sm:text-6xl lg:text-8xl">
            Where Shy Kids
            <br />
            <span className="text-[#2E3192]">Become</span>
            <br />
            Team Players
          </h1>

          {/* Subheading - Enhanced with specific value prop */}
          <p className="mx-auto mt-8 max-w-2xl text-lg text-neutral-600 leading-relaxed">
            Fun football coaching that builds confidence, not pressure.{" "}
            <span className="font-semibold text-black">Ages 4-11</span> in{" "}
            <span className="font-semibold text-black">Luton</span>,{" "}
            <span className="font-semibold text-black">Barton Le Clay</span> &{" "}
            <span className="font-semibold text-black">Silsoe</span>.
            <br />
            <span className="text-neutral-500">Small groups. Big smiles. Real progress you can see.</span>
          </p>

          {/* CTA buttons - Enhanced with value messaging */}
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/book">
                Book Your Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/sessions">See Session Times & Prices</Link>
            </Button>
          </div>

          {/* Risk reversal message */}
          <p className="mt-4 text-sm text-neutral-500">
            No commitment required. Cancel anytime. Full refund if your child doesn&apos;t love it.
          </p>

          {/* Social proof - Enhanced stats with context */}
          <div className="mt-20 grid grid-cols-3 gap-8 border-t border-neutral-200 pt-12">
            <div className="text-center">
              <p className="text-4xl font-black text-black sm:text-5xl">1,000<span className="text-neutral-400">+</span></p>
              <p className="mt-2 text-xs font-medium uppercase tracking-widest text-neutral-500">Sessions Since 2022</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <p className="text-4xl font-black sm:text-5xl"><span className="text-[#F5A623]">4.9</span></p>
                <Star className="h-6 w-6 fill-[#F5A623] text-[#F5A623]" />
              </div>
              <p className="mt-2 text-xs font-medium uppercase tracking-widest text-neutral-500">Google Reviews</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black text-black sm:text-5xl">100<span className="text-neutral-400">%</span></p>
              <p className="mt-2 text-xs font-medium uppercase tracking-widest text-neutral-500">Would Recommend</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
