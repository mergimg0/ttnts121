"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_LINKS, SITE_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo.jpg"
            alt="Take The Next Step 121"
            width={48}
            height={48}
            className="h-12 w-12 object-contain transition-transform group-hover:scale-105"
          />
          <div>
            <span className="text-xs sm:text-lg font-black tracking-tight text-black uppercase">
              Take The Next Step
            </span>
            <span className="ml-1 text-xs sm:text-lg font-black text-[#2E3192]">121</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex lg:items-center lg:gap-5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="link-underline text-xs font-medium uppercase tracking-wide text-neutral-600 transition-colors hover:text-black"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-6 lg:flex">
          <a
            href={`tel:${SITE_CONFIG.phone.replace(/\s/g, "")}`}
            className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-black transition-colors"
          >
            <Phone className="h-4 w-4" />
            {SITE_CONFIG.phone}
          </a>
          <Button asChild>
            <Link href="/book">Book Now</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="lg:hidden p-2 hover:bg-neutral-100 transition-colors"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="h-6 w-6 text-black" />
          ) : (
            <Menu className="h-6 w-6 text-black" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "lg:hidden overflow-hidden transition-all duration-300",
          isMenuOpen ? "max-h-screen" : "max-h-0"
        )}
      >
        <nav className="flex flex-col border-t border-neutral-200 bg-white px-4 py-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="py-4 text-lg font-medium uppercase tracking-wider text-neutral-600 hover:text-black border-b border-neutral-100 last:border-0"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-6 flex flex-col gap-4">
            <a
              href={`tel:${SITE_CONFIG.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-2 py-2 text-base font-medium text-neutral-600"
            >
              <Phone className="h-5 w-5" />
              {SITE_CONFIG.phone}
            </a>
            <Button asChild className="w-full">
              <Link href="/book">Book Now</Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
