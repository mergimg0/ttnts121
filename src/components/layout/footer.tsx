"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { SITE_CONFIG, NAV_LINKS, LOCATIONS } from "@/lib/constants";
export function Footer() {
  return (
      <footer className="border-t border-neutral-200 bg-foreground text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="Take The Next Step 121 Coaching"
                  width={160}
                  height={53}
                  className="h-auto w-40 object-contain brightness-0 invert"
                />
              </div>
              <p className="mt-6 text-sm text-neutral-400 leading-relaxed">
                {SITE_CONFIG.tagline}
              </p>
              <div className="mt-6 flex gap-4">
                <a
                  href={SITE_CONFIG.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-500 hover:text-grass transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href={SITE_CONFIG.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-500 hover:text-grass transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                Quick Links
              </h3>
              <ul className="mt-6 space-y-4">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-400 hover:text-grass transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/faq"
                    className="text-sm text-neutral-400 hover:text-grass transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Locations */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                Locations
              </h3>
              <ul className="mt-6 space-y-4">
                {LOCATIONS.map((location) => (
                  <li key={location.id}>
                    <Link
                      href={`/locations/${location.id}`}
                      className="flex items-center gap-2 text-sm text-neutral-400 hover:text-grass transition-colors"
                    >
                      <MapPin className="h-4 w-4" />
                      {location.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                Contact
              </h3>
              <div className="mt-6 flex flex-row flex-wrap gap-4 sm:gap-6">
                <a
                  href={`tel:${SITE_CONFIG.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-2 text-sm text-neutral-400 hover:text-grass transition-colors"
                >
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  {SITE_CONFIG.phone}
                </a>
                <a
                  href={`mailto:${SITE_CONFIG.email}`}
                  className="flex items-center gap-2 text-sm text-neutral-400 hover:text-grass transition-colors"
                >
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{SITE_CONFIG.email}</span>
                  <span className="sm:hidden">Email</span>
                </a>
              </div>
              <div className="mt-8">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  Credentials
                </h4>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="border border-neutral-700 px-3 py-1 text-xs font-medium text-neutral-400 rounded-full">
                    FA Qualified
                  </span>
                  <span className="border border-neutral-700 px-3 py-1 text-xs font-medium text-neutral-400 rounded-full">
                    DBS Checked
                  </span>
                  <span className="border border-neutral-700 px-3 py-1 text-xs font-medium text-neutral-400 rounded-full">
                    Insured
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-16 border-t border-neutral-800 pt-8">
            <p className="text-center text-xs text-neutral-500 uppercase tracking-widest">
              © {new Date().getFullYear()} {SITE_CONFIG.name}
            </p>
          </div>
        </div>
      </footer>
  );
}
