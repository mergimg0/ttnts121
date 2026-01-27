import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { BirthdayInquiryForm } from "@/components/forms/birthday-inquiry-form";
import {
  ArrowRight,
  PartyPopper,
  Trophy,
  Medal,
  Gift,
  MapPin,
  Truck,
  CheckCircle,
  Phone,
  Star,
} from "lucide-react";
import { PARTY_OPTIONS, SITE_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Birthday Parties | Football Celebrations",
  description:
    "Give your child the ultimate football birthday party. Professional coaching, exciting games, medals, and memories. Venue or mobile options available.",
};

const venueComparison = [
  {
    title: "At Our Venue",
    icon: MapPin,
    description: "We handle everything. You just bring the birthday star.",
    features: [
      "Professional sports facility",
      "All equipment provided",
      "Easy parking",
      "Indoor backup if needed",
      "No setup or cleanup for you",
    ],
  },
  {
    title: "We Come To You",
    icon: Truck,
    description: "Your choice of location. We bring the party.",
    features: [
      "Your garden, local park, or school",
      "We bring all equipment",
      "More flexible timing",
      "Familiar environment for kids",
      "Perfect for smaller groups",
    ],
  },
];

const faqs = [
  {
    question: "How many children can attend?",
    answer: `We can accommodate ${PARTY_OPTIONS.minChildren}-${PARTY_OPTIONS.maxChildren} children. This ensures everyone gets involved and has a great time. Let us know if you need to discuss numbers outside this range.`,
  },
  {
    question: "What ages are parties suitable for?",
    answer: `Our parties are designed for children aged ${PARTY_OPTIONS.ageRange}. We adapt activities based on the age group - younger children get gentler games, while older kids enjoy more competitive challenges.`,
  },
  {
    question: "What's included in the price?",
    answer:
      "Everything football-related: professional coach, 1.5-2 hours of activities, all equipment, medals for participants, winner's trophy, and party bags if selected. You just handle food and cake.",
  },
  {
    question: "Can parents stay and watch?",
    answer:
      "Absolutely! We encourage it. Most parents love seeing their kids light up. We'll keep the children entertained while you relax (or take photos!).",
  },
  {
    question: "What happens if it rains?",
    answer:
      "At our venue, we have indoor backup options. For mobile parties, we'll work with you to find a solution - either rescheduling or finding alternative cover.",
  },
  {
    question: "How far in advance should we book?",
    answer:
      "We recommend 3-4 weeks minimum, especially for weekend dates. Popular dates (school holidays, summer) book up fast - the earlier the better!",
  },
];

export default function BirthdayPartiesPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/70">
              Birthday Parties
            </p>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              The Party
              <br />
              <span className="text-sky">They&apos;ll Remember</span>
            </h1>
            <p className="mt-6 text-lg text-white/70">
              Professional football party they&apos;ll talk about for years.
              <br />
              You handle the cake. We&apos;ll handle the fun.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-neutral-200 rounded-none uppercase tracking-wider font-semibold"
                asChild
              >
                <a href={`tel:${SITE_CONFIG.phone.replace(/\s/g, "")}`}>
                  <Phone className="mr-2 h-4 w-4" />
                  Call to Discuss
                </a>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
                asChild
              >
                <Link href="/contact?subject=birthday-party">
                  Send Enquiry
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* What's Included */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
              Every Party
              <br />
              <span className="text-navy">Includes</span>
            </h2>
          </div>

          <div className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-2">
            {PARTY_OPTIONS.inclusions.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 border border-neutral-200 bg-white p-4"
              >
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-brand-green" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>

          {/* Party Highlights */}
          <div className="mx-auto mt-16 grid max-w-3xl gap-px bg-neutral-200 sm:grid-cols-3">
            <div className="bg-white p-8 text-center">
              <Trophy className="mx-auto h-8 w-8 text-black" />
              <h3 className="mt-4 font-bold uppercase tracking-wide text-black">
                Winner&apos;s Trophy
              </h3>
              <p className="mt-2 text-sm text-neutral-600">
                For the birthday champion
              </p>
            </div>
            <div className="bg-white p-8 text-center">
              <Medal className="mx-auto h-8 w-8 text-black" />
              <h3 className="mt-4 font-bold uppercase tracking-wide text-black">
                Medals For All
              </h3>
              <p className="mt-2 text-sm text-neutral-600">
                Everyone&apos;s a winner
              </p>
            </div>
            <div className="bg-white p-8 text-center">
              <Gift className="mx-auto h-8 w-8 text-black" />
              <h3 className="mt-4 font-bold uppercase tracking-wide text-black">
                Party Bags
              </h3>
              <p className="mt-2 text-sm text-neutral-600">
                Optional add-on
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Venue Options */}
      <section className="bg-neutral-50 py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
              Two Ways
              <br />
              <span className="text-navy">To Party</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              Choose what works best for your family.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-8 lg:grid-cols-2">
            {venueComparison.map((option) => (
              <div
                key={option.title}
                className="border border-neutral-200 bg-white p-8"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center border-2 border-black">
                    <option.icon className="h-6 w-6 text-black" />
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-wide text-black">
                    {option.title}
                  </h3>
                </div>
                <p className="mt-4 text-neutral-600">{option.description}</p>
                <ul className="mt-6 space-y-3">
                  {option.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm"
                    >
                      <CheckCircle className="h-4 w-4 text-brand-green" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
              Party Day
              <br />
              <span className="text-navy">Rundown</span>
            </h2>
          </div>

          <div className="mx-auto mt-16 max-w-3xl">
            <div className="space-y-8">
              {[
                {
                  step: 1,
                  title: "Warm Up & Welcome",
                  description: "Kids arrive, meet the coach, and start with fun warm-up games to get everyone involved.",
                  time: "15 mins",
                },
                {
                  step: 2,
                  title: "Skill Challenges",
                  description: "Fun competitions: dribbling races, target shooting, keepie-uppies. Points for everyone!",
                  time: "30 mins",
                },
                {
                  step: 3,
                  title: "Mini Tournament",
                  description: "Teams compete in exciting mini matches. Cheering encouraged!",
                  time: "45 mins",
                },
                {
                  step: 4,
                  title: "Medals & Trophy",
                  description: "Presentation time! Every child gets a medal, birthday star gets the trophy.",
                  time: "15 mins",
                },
              ].map((item, index) => (
                <div key={item.step} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center border-2 border-black font-black text-lg">
                      {item.step}
                    </div>
                    {index < 3 && (
                      <div className="mx-auto mt-2 h-16 w-0.5 bg-neutral-200" />
                    )}
                  </div>
                  <div className="pt-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold uppercase tracking-wide text-black">
                        {item.title}
                      </h3>
                      <span className="text-sm text-neutral-500">
                        ~{item.time}
                      </span>
                    </div>
                    <p className="mt-2 text-neutral-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Testimonial */}
      <section className="bg-neutral-50 py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-3xl border border-neutral-200 bg-white p-8 sm:p-12">
            <div className="text-center">
              <div className="flex justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-6 w-6 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="mt-6 text-xl text-neutral-700 italic leading-relaxed">
                &quot;Best party we&apos;ve ever done. The coach was brilliant with the kids,
                everyone was included, and my son is STILL talking about his trophy.
                Worth every penny.&quot;
              </p>
              <p className="mt-4 font-bold uppercase tracking-wider text-black">
                - Sarah M., Luton
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
              Party
              <br />
              <span className="text-navy">Questions</span>
            </h2>
          </div>

          <div className="mx-auto mt-16 max-w-3xl divide-y divide-neutral-200">
            {faqs.map((faq) => (
              <div key={faq.question} className="py-6">
                <h3 className="font-bold text-black">{faq.question}</h3>
                <p className="mt-3 text-neutral-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Inquiry Form */}
      <section className="py-16 sm:py-20" id="inquiry">
        <Container>
          <div className="mx-auto max-w-2xl">
            <BirthdayInquiryForm />
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-navy py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
              Prefer To
              <br />
              <span className="text-sky">Talk?</span>
            </h2>
            <p className="mt-6 text-lg text-white/70">
              Every party is unique. Call us to discuss dates, numbers, and what would make
              your child&apos;s day extra special.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-neutral-200 rounded-none uppercase tracking-wider font-semibold"
                asChild
              >
                <a href={`tel:${SITE_CONFIG.phone.replace(/\s/g, "")}`}>
                  <Phone className="mr-2 h-4 w-4" />
                  Call {SITE_CONFIG.phone}
                </a>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
                asChild
              >
                <Link href="/contact?subject=birthday-party">
                  Send Enquiry
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
