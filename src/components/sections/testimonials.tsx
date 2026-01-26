"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Container } from "@/components/layout/container";
import { FadeInUp, StaggerChildren, StaggerItem } from "@/lib/motion";
import { ChevronLeft, ChevronRight, Star, Quote, Heart, Trophy, Users, Sparkles, Shield } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Sarah M.",
    location: "Barton Le Clay",
    quote:
      "When we started, my son would hide behind my legs at drop-off. Now he runs in shouting hello to his coaches and friends. Last week he scored his first goal and the smile lasted all week. The confidence boost has spilled into school too - his teacher noticed the difference!",
    rating: 5,
    childAge: "6 years old",
  },
  {
    id: 2,
    name: "James P.",
    location: "Luton",
    quote:
      "My daughter was the only girl at first and nearly didn't come back. The coaches made her feel so welcome that she's now been coming for 6 months. She's made genuine friendships, her coordination has improved massively, and she recently joined a local girls' team.",
    rating: 5,
    childAge: "8 years old",
  },
  {
    id: 3,
    name: "Emma T.",
    location: "Silsoe",
    quote:
      "The holiday camps are honestly a lifesaver. My kids come home exhausted, happy, and full of stories about their day. What I love most is that every child gets praised - not just the naturally sporty ones.",
    rating: 5,
    childAge: "5 years old",
  },
  {
    id: 4,
    name: "David K.",
    location: "Barton Le Clay",
    quote:
      "My shy son was nervous about starting - he'd had bad experiences at other clubs where he felt ignored. Here, Coach Mike learned his name in the first 5 minutes and by week 3, my son was high-fiving everyone.",
    rating: 5,
    childAge: "7 years old",
  },
];

const reasons = [
  {
    title: "Games, Not Drills",
    description: "90% games, 10% skills - exactly how kids learn best.",
    icon: Sparkles,
  },
  {
    title: "8 Kids Max Per Coach",
    description: "More touches, more feedback, more confidence.",
    icon: Users,
  },
  {
    title: "FA Level 2 Coaches",
    description: "Specialists in ages 4-11 who know how to make football click.",
    icon: Trophy,
  },
  {
    title: "Confidence First",
    description: "Football is our tool - confidence is what we build.",
    icon: Heart,
  },
  {
    title: "Peace of Mind",
    description: "DBS checked, first aid trained, fully insured.",
    icon: Shield,
  },
];

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-24 sm:py-32 bg-background-alt">
      <Container>
        <FadeInUp>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              What Parents Say
            </h2>
            <p className="mt-4 text-sm text-foreground-muted">
              Based on 50+ verified parent reviews
            </p>
          </div>
        </FadeInUp>

        <div className="relative mx-auto mt-16 max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Quote */}
              <div className="relative border border-neutral-200 p-8 sm:p-12 rounded-2xl bg-white">
                <Quote className="absolute -left-4 -top-4 h-8 w-8 text-navy/20 bg-background-alt rounded-full p-1" />

                <div className="relative">
                  {/* Stars */}
                  <div className="mb-6 flex gap-1">
                    {[...Array(currentTestimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-gold text-gold"
                      />
                    ))}
                  </div>

                  {/* Quote text */}
                  <p className="text-xl sm:text-2xl font-light leading-relaxed text-foreground-muted">
                    &ldquo;{currentTestimonial.quote}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="mt-8 pt-6 border-t border-neutral-200">
                    <p className="font-bold text-foreground">
                      {currentTestimonial.name}
                    </p>
                    <p className="mt-1 text-sm text-foreground-muted">
                      {currentTestimonial.location} · Child aged{" "}
                      {currentTestimonial.childAge}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-center gap-6">
            <button
              onClick={prev}
              className="border border-neutral-200 p-3 rounded-full transition-colors hover:bg-navy hover:text-white hover:border-navy"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="flex gap-1">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className="p-3 -m-2 touch-manipulation"
                  aria-label={`Go to testimonial ${index + 1}`}
                >
                  <span className={`block h-2.5 w-2.5 rounded-full transition-all ${
                    index === currentIndex ? "bg-navy" : "bg-neutral-300"
                  }`} />
                </button>
              ))}
            </div>

            <button
              onClick={next}
              className="border border-neutral-200 p-3 rounded-full transition-colors hover:bg-navy hover:text-white hover:border-navy"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* What Makes Us Different */}
        <div className="mt-20 pt-16 border-t border-neutral-200">
          <FadeInUp>
            <h3 className="text-center text-xl font-bold text-foreground mb-10">
              What Makes Us Different
            </h3>
          </FadeInUp>
          <StaggerChildren className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {reasons.map((reason) => (
              <StaggerItem key={reason.title}>
                <div className="text-center p-4">
                  <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-navy/10">
                    <reason.icon className="h-5 w-5 text-navy" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">{reason.title}</h4>
                  <p className="mt-1 text-xs text-foreground-muted">{reason.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </Container>
    </section>
  );
}
