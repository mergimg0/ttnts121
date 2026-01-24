"use client";

import { useState } from "react";
import { Container } from "@/components/layout/container";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "My child is shy / has never played football - will they be okay?",
    answer:
      "Absolutely! Most of our kids started exactly the same way. We specialise in building confidence, not just football skills. Our coaches are trained to spot nervous newcomers and give them extra encouragement. Small group sizes (max 8 per coach) mean no one gets lost or overlooked. By week 3, most shy kids are running in ahead of their parents!",
  },
  {
    question: "What happens in a typical session?",
    answer:
      "Sessions are 90% games, 10% skills - because that's how kids actually learn. We start with a fun warm-up game, move into skill-based activities disguised as games, and finish with mini matches. Every child gets praised for effort, not just talent. Most importantly: they leave tired, happy, and already asking when they can come back.",
  },
  {
    question: "What do we need to bring?",
    answer:
      "Football boots or trainers (boots are better for grass), shin pads, comfortable clothes they can run in, and a water bottle. That's it! We provide all the footballs, bibs, cones, and goals. No expensive kit required - come as you are.",
  },
  {
    question: "How do the age groups work?",
    answer:
      "We group by age to ensure the right challenge level: Mini Kickers (4-5), Juniors (6-7), Seniors (8-9), and Advanced (10-11). This means your child is always with kids at a similar stage - no one feels left behind or bored. If your child is on the border between groups, we'll place them where they'll thrive most.",
  },
  {
    question: "What if my child doesn't like it?",
    answer:
      "No problem at all - we offer a full refund guarantee for first-timers. Try a session risk-free. If your child doesn't love it (rare but it happens!), you get your money back, no questions asked. We're confident enough in what we do to take that risk.",
  },
  {
    question: "Can I stay and watch?",
    answer:
      "Of course! Parents are welcome to stay for every session. We just ask that you stay on the sidelines so kids can focus. Many parents tell us they love watching their child's confidence grow week by week. Some bring camping chairs and coffee - we don't judge!",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 sm:py-28 bg-neutral-50">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl lg:text-5xl">
            Questions?
            <br />
            <span className="text-neutral-400">We&apos;ve Got Answers</span>
          </h2>
          <p className="mt-6 text-lg text-neutral-600">
            Everything parents ask us before booking. Still curious?{" "}
            <a href="/contact" className="text-[#2E3192] hover:underline">
              Just ask.
            </a>
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-3xl divide-y divide-neutral-200">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white">
              <button
                onClick={() => toggleFaq(index)}
                className="flex w-full items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-neutral-50"
                aria-expanded={openIndex === index}
              >
                <span className="font-bold text-black">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 flex-shrink-0 text-neutral-400 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6">
                  <p className="text-neutral-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
