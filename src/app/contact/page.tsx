import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Facebook,
  Instagram,
} from "lucide-react";
import { SITE_CONFIG, LOCATIONS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Take The Next Step 121. Questions about sessions, bookings, or school partnerships? We're here to help.",
};

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-black py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              Get in
              <br />
              <span className="text-neutral-500">Touch</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-400">
              Have questions about our sessions? Want to discuss a school
              partnership? We&apos;d love to hear from you.
            </p>
          </div>
        </Container>
      </section>

      {/* Contact Content */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="mx-auto grid max-w-5xl gap-16 lg:grid-cols-2">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-wide text-black">
                Send Us a Message
              </h2>
              <p className="mt-3 text-neutral-600">
                Fill out the form below and we&apos;ll get back to you as soon
                as possible.
              </p>

              <form className="mt-8 space-y-6" action="/api/contact" method="POST">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-xs font-bold uppercase tracking-wider text-neutral-500"
                    >
                      First Name *
                    </label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      className="mt-2 rounded-none border-neutral-300 focus:border-black focus:ring-black"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-xs font-bold uppercase tracking-wider text-neutral-500"
                    >
                      Last Name *
                    </label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      className="mt-2 rounded-none border-neutral-300 focus:border-black focus:ring-black"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold uppercase tracking-wider text-neutral-500"
                  >
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="mt-2 rounded-none border-neutral-300 focus:border-black focus:ring-black"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-xs font-bold uppercase tracking-wider text-neutral-500"
                  >
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="mt-2 rounded-none border-neutral-300 focus:border-black focus:ring-black"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-xs font-bold uppercase tracking-wider text-neutral-500"
                  >
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    className="mt-2 block w-full rounded-none border border-neutral-300 px-4 py-3 text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">Select a subject...</option>
                    <option value="booking">Session Booking Enquiry</option>
                    <option value="schools">School Partnership</option>
                    <option value="holiday">Holiday Camp Enquiry</option>
                    <option value="general">General Question</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-xs font-bold uppercase tracking-wider text-neutral-500"
                  >
                    Message *
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    className="mt-2 rounded-none border-neutral-300 focus:border-black focus:ring-black"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <Button type="submit" size="lg">
                  Send Message
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-wide text-black">
                Contact Information
              </h2>
              <p className="mt-3 text-neutral-600">
                Prefer to reach out directly? Here&apos;s how to contact us.
              </p>

              <div className="mt-8 space-y-6">
                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center border-2 border-black">
                    <Phone className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold uppercase tracking-wide text-black">Phone</h3>
                    <a
                      href={`tel:${SITE_CONFIG.phone.replace(/\s/g, "")}`}
                      className="text-black hover:underline"
                    >
                      {SITE_CONFIG.phone}
                    </a>
                    <p className="mt-1 text-sm text-neutral-500">
                      Available during session hours
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center border-2 border-black">
                    <Mail className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold uppercase tracking-wide text-black">Email</h3>
                    <a
                      href={`mailto:${SITE_CONFIG.email}`}
                      className="text-black hover:underline"
                    >
                      {SITE_CONFIG.email}
                    </a>
                    <p className="mt-1 text-sm text-neutral-500">
                      We&apos;ll respond within 24 hours
                    </p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center border-2 border-black">
                    <Clock className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold uppercase tracking-wide text-black">
                      Session Hours
                    </h3>
                    <p className="text-neutral-600">Monday - Friday: 3pm - 6pm</p>
                    <p className="text-neutral-600">
                      Weekends: Holiday camps only
                    </p>
                  </div>
                </div>

                {/* Locations */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center border-2 border-black">
                    <MapPin className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold uppercase tracking-wide text-black">Locations</h3>
                    <ul className="mt-2 space-y-1">
                      {LOCATIONS.map((location) => (
                        <li key={location.id} className="text-neutral-600">
                          {location.name} &mdash; {location.postcode}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="mt-12 border-t border-neutral-200 pt-8">
                <h3 className="font-bold uppercase tracking-wide text-black">Follow Us</h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Stay updated with session photos, news, and tips.
                </p>
                <div className="mt-4 flex gap-4">
                  <a
                    href={SITE_CONFIG.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center border border-neutral-300 text-neutral-600 transition-colors hover:border-black hover:text-black"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a
                    href={SITE_CONFIG.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center border border-neutral-300 text-neutral-600 transition-colors hover:border-black hover:text-black"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Quick Links */}
      <section className="bg-neutral-50 py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold uppercase tracking-wide text-black">
              Looking for Something Specific?
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button variant="secondary" asChild>
                <Link href="/book">Book a Session</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/sessions">View Sessions</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/schools">Schools Info</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/locations">Find Locations</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
