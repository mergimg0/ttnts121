import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { SessionList } from "@/components/sessions/session-list";
import {
  ArrowRight,
  Sun,
  Clock,
  Users,
  Trophy,
  Utensils,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Half Term Camps | Football Fun During School Breaks",
  description:
    "Action-packed football camps during half term holidays. Full and half day options, all abilities welcome. The perfect school holiday childcare solution from £20/day.",
};

const included = [
  "Professional FA-qualified coaching",
  "Fun football games & mini tournaments",
  "Skill challenges with prizes",
  "New friends from across Bedfordshire",
  "Progress certificates",
  "Lunch supervision (bring packed lunch)",
  "All equipment provided",
  "Snack breaks included",
];

const pricing = [
  {
    name: "Half Day",
    time: "9am - 12pm",
    price: 20,
    description: "Morning football fun. Perfect for younger ones or busy afternoons.",
  },
  {
    name: "Full Day",
    time: "9am - 3pm",
    price: 35,
    description: "The complete camp experience. Drop off, we'll handle the rest.",
    popular: true,
  },
  {
    name: "Full Week",
    time: "5 Full Days",
    price: 150,
    savings: 25,
    description: "Book the whole week and save. Consistent fun, consistent childcare.",
  },
];

const faqs = [
  {
    question: "What should my child bring?",
    answer:
      "Football boots or trainers, shin pads, a water bottle, and a packed lunch (for full day). We provide all footballs and equipment. Oh, and lots of energy!",
  },
  {
    question: "What if my child doesn't know anyone?",
    answer:
      "Perfect! Camps are where friendships are made. Our coaches are experts at helping kids connect. By mid-morning, they'll have found their squad.",
  },
  {
    question: "Are camps suitable for complete beginners?",
    answer:
      "Absolutely. We group by ability, not just age. Your child will play with others at their level and progress at their own pace. No one gets left behind.",
  },
  {
    question: "What happens in bad weather?",
    answer:
      "Light rain? We play on (they love it!). Heavy rain or storms? We'll contact you with options - usually we can find indoor space or reschedule.",
  },
  {
    question: "Can I book individual days?",
    answer:
      "Yes! Book as many or as few days as you need. Though the full week package is best value if you need all five days covered.",
  },
  {
    question: "What about drop-off and pick-up?",
    answer:
      "Drop-off is from 8:45am. Pick-up is at 12pm (half day) or 3pm (full day). We'll send full details including exact location when you book.",
  },
];

export default function HalfTermCampsPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/70">
              Holiday Camps
            </p>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              Half Term
              <br />
              <span className="text-sky">Sorted</span>
            </h1>
            <p className="mt-6 text-lg text-white/70">
              A week of football, friendships, and fun.
              <br />
              Childcare handled. Kids exhausted (in the best way).
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-neutral-200 rounded-none uppercase tracking-wider font-semibold"
                asChild
              >
                <Link href="/book?service=half-term-camps">
                  Book Camp Place
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
                asChild
              >
                <a href={`tel:${SITE_CONFIG.phone.replace(/\s/g, "")}`}>
                  Call for Availability
                </a>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Key Info */}
      <section className="border-b border-neutral-200 bg-white py-8">
        <Container>
          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-brand-green" />
              <span className="font-semibold">Every Half Term</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-brand-green">£20</span>
              <span className="text-neutral-600">from / day</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-brand-green" />
              <span className="font-semibold">Ages 4-11</span>
            </div>
          </div>
        </Container>
      </section>

      {/* What's Included */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
              What&apos;s
              <br />
              <span className="text-navy">Included</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              Everything they need for an unforgettable week.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-2">
            {included.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 border border-neutral-200 bg-white p-4"
              >
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-brand-green" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Available Camps */}
      <section className="py-16 sm:py-20">
        <Container>
          <SessionList
            serviceType="half-term"
            title="Upcoming Camps"
            subtitle="Secure your child's spot in our next holiday camp"
            maxSessions={6}
          />
        </Container>
      </section>

      {/* Pricing */}
      <section className="bg-neutral-50 py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
              Camp
              <br />
              <span className="text-navy">Pricing</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              Flexible options to fit your schedule and budget.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pricing.map((option) => (
              <div
                key={option.name}
                className={`relative border bg-white p-8 ${
                  option.popular
                    ? "border-black ring-2 ring-black"
                    : "border-neutral-200"
                }`}
              >
                {option.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-black px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
                      Best Value
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-xl font-bold uppercase tracking-wide text-black">
                    {option.name}
                  </h3>
                  <p className="mt-2 text-sm text-neutral-500">{option.time}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-black text-black">
                      £{option.price}
                    </span>
                  </div>
                  {option.savings && (
                    <p className="mt-2 text-sm font-semibold text-brand-green">
                      Save £{option.savings}
                    </p>
                  )}
                  <p className="mt-4 text-neutral-600">{option.description}</p>
                  <Button
                    className={`mt-6 w-full rounded-none uppercase tracking-wider font-semibold ${
                      option.popular
                        ? "bg-black text-white hover:bg-neutral-800"
                        : ""
                    }`}
                    variant={option.popular ? "primary" : "secondary"}
                    asChild
                  >
                    <Link href={`/book?service=half-term-camps&option=${option.name.toLowerCase().replace(" ", "-")}`}>
                      Book {option.name}
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* A Day at Camp */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
              A Day At
              <br />
              <span className="text-navy">Camp</span>
            </h2>
          </div>

          <div className="mx-auto mt-16 max-w-3xl">
            <div className="space-y-6">
              {[
                { time: "8:45am", activity: "Drop-off & warm up games" },
                { time: "9:30am", activity: "Skill session (age groups)" },
                { time: "10:30am", activity: "Snack break & chat" },
                { time: "11:00am", activity: "Fun challenges & competitions" },
                { time: "12:00pm", activity: "Lunch break (supervised)" },
                { time: "12:45pm", activity: "Mini tournaments" },
                { time: "2:00pm", activity: "Final games & medals" },
                { time: "3:00pm", activity: "Pick-up (exhausted kids!)" },
              ].map((item, index) => (
                <div
                  key={item.time}
                  className="flex items-center gap-6 border-b border-neutral-100 pb-4 last:border-0"
                >
                  <div className="w-20 flex-shrink-0 font-bold text-brand-green">
                    {item.time}
                  </div>
                  <div className="font-medium">{item.activity}</div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="bg-neutral-50 py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
              Camp
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

      {/* CTA */}
      <section className="bg-navy py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
              Spaces Fill
              <br />
              <span className="text-sky">Fast</span>
            </h2>
            <p className="mt-6 text-lg text-white/70">
              Our camps sell out every half term. Book early to secure their spot.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-neutral-200 rounded-none uppercase tracking-wider font-semibold"
                asChild
              >
                <Link href="/book?service=half-term-camps">
                  Book Camp Place
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
