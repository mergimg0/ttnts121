"use client";

import { useState } from "react";
import { Container } from "@/components/layout/container";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Sarah M.",
    location: "Barton Le Clay",
    quote:
      "My son absolutely loves the sessions. The coaches are brilliant at making every child feel included, and I've seen such a boost in his confidence. He can't wait for football day every week!",
    rating: 5,
    childAge: "6 years old",
  },
  {
    id: 2,
    name: "James P.",
    location: "Luton",
    quote:
      "What sets Take The Next Step apart is their focus on fun AND development. My daughter has improved so much, but more importantly, she's made great friends and loves being active.",
    rating: 5,
    childAge: "8 years old",
  },
  {
    id: 3,
    name: "Emma T.",
    location: "Silsoe",
    quote:
      "The holiday camps are a lifesaver for working parents. Professional, well-organised, and the kids have so much fun. I never worry when they're at Take The Next Step.",
    rating: 5,
    childAge: "5 years old",
  },
  {
    id: 4,
    name: "David K.",
    location: "Barton Le Clay",
    quote:
      "My shy son was nervous about starting, but the coaches were so welcoming. Now he's one of the first to arrive and last to leave. Thank you for bringing out his confidence!",
    rating: 5,
    childAge: "7 years old",
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
    <section className="py-20 sm:py-28 bg-black text-white">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight sm:text-4xl lg:text-5xl">
            What Parents
            <br />
            <span className="text-neutral-500">Say</span>
          </h2>
          <div className="mt-6 flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="h-5 w-5 fill-[#F5A623] text-[#F5A623]"
              />
            ))}
            <span className="ml-3 text-lg font-bold">
              4.9
            </span>
          </div>
          <p className="mt-2 text-sm text-neutral-500 uppercase tracking-widest">
            Based on 50+ parent reviews
          </p>
        </div>

        <div className="relative mx-auto mt-16 max-w-3xl">
          {/* Quote */}
          <div className="relative border border-neutral-800 p-8 sm:p-12">
            <Quote className="absolute -left-4 -top-4 h-8 w-8 text-neutral-700 bg-black" />

            <div className="relative">
              {/* Stars */}
              <div className="mb-6 flex gap-1">
                {[...Array(currentTestimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-[#F5A623] text-[#F5A623]"
                  />
                ))}
              </div>

              {/* Quote text */}
              <p className="text-xl sm:text-2xl font-light leading-relaxed text-neutral-300">
                &ldquo;{currentTestimonial.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="mt-8 pt-6 border-t border-neutral-800">
                <p className="font-bold uppercase tracking-wider">
                  {currentTestimonial.name}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  {currentTestimonial.location} &mdash; Child aged{" "}
                  {currentTestimonial.childAge}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-center gap-6">
            <button
              onClick={prev}
              className="border border-neutral-700 p-3 transition-colors hover:bg-white hover:text-black hover:border-white"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="flex gap-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 w-2 transition-colors ${
                    index === currentIndex ? "bg-white" : "bg-neutral-700"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="border border-neutral-700 p-3 transition-colors hover:bg-white hover:text-black hover:border-white"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <a
            href="https://g.page/r/YOUR_GOOGLE_REVIEW_LINK"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
          >
            See all reviews on Google &rarr;
          </a>
        </div>
      </Container>
    </section>
  );
}
