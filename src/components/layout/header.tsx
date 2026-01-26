"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Phone, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_LINKS, SITE_CONFIG, SERVICES_NAV, ABOUT_NAV } from "@/lib/constants";
import { CartButton } from "@/components/cart/cart-sidebar";
import { cn } from "@/lib/utils";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(false);
  const [isMobileAboutOpen, setIsMobileAboutOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsServicesOpen(false);
        setIsAboutOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) {
        setIsServicesOpen(false);
      }
      if (aboutRef.current && !aboutRef.current.contains(e.target as Node)) {
        setIsAboutOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-sm"
          : "bg-background"
      )}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <Image
            src="/logo.png"
            alt="Take The Next Step 121 Coaching"
            width={180}
            height={60}
            className="h-14 sm:h-16 w-auto object-contain transition-transform group-hover:scale-105"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex lg:items-center lg:gap-6">
          {/* Home link */}
          <Link
            href="/"
            className="link-underline text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
          >
            Home
          </Link>

          {/* Services Dropdown */}
          <div
            ref={servicesRef}
            className="relative"
            onMouseEnter={() => setIsServicesOpen(true)}
            onMouseLeave={() => setIsServicesOpen(false)}
          >
            <button
              className="flex items-center gap-1 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
              onClick={() => setIsServicesOpen(!isServicesOpen)}
              aria-expanded={isServicesOpen}
              aria-haspopup="true"
            >
              Services
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isServicesOpen && "rotate-180"
                )}
              />
            </button>

            <AnimatePresence>
              {isServicesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full pt-2"
                >
                  <div className="min-w-[200px] rounded-lg border border-neutral-200 bg-white py-2 shadow-lg">
                    {SERVICES_NAV.map((service) => (
                      <Link
                        key={service.href}
                        href={service.href}
                        className="block px-4 py-2 text-sm text-foreground-muted transition-colors hover:bg-neutral-50 hover:text-foreground"
                        onClick={() => setIsServicesOpen(false)}
                      >
                        {service.label}
                      </Link>
                    ))}
                    <div className="my-2 border-t border-neutral-100" />
                    <Link
                      href="/services"
                      className="block px-4 py-2 text-sm font-medium text-brand-green transition-colors hover:bg-neutral-50"
                      onClick={() => setIsServicesOpen(false)}
                    >
                      View All Services
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* About Us Dropdown */}
          <div
            ref={aboutRef}
            className="relative"
            onMouseEnter={() => setIsAboutOpen(true)}
            onMouseLeave={() => setIsAboutOpen(false)}
          >
            <button
              className="flex items-center gap-1 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
              onClick={() => setIsAboutOpen(!isAboutOpen)}
              aria-expanded={isAboutOpen}
              aria-haspopup="true"
            >
              About
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isAboutOpen && "rotate-180"
                )}
              />
            </button>

            <AnimatePresence>
              {isAboutOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full pt-2"
                >
                  <div className="min-w-[180px] rounded-lg border border-neutral-200 bg-white py-2 shadow-lg">
                    {ABOUT_NAV.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-4 py-2 text-sm text-foreground-muted transition-colors hover:bg-neutral-50 hover:text-foreground"
                        onClick={() => setIsAboutOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Other nav links (excluding Home which is already shown) */}
          {NAV_LINKS.filter((link) => link.href !== "/").map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="link-underline text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-6 lg:flex">
          <a
            href={`tel:${SITE_CONFIG.phone.replace(/\s/g, "")}`}
            className="flex items-center gap-2 text-sm font-medium text-foreground-muted hover:text-foreground transition-colors"
          >
            <Phone className="h-4 w-4" />
            {SITE_CONFIG.phone}
          </a>
          <CartButton />
          <Button asChild>
            <Link href="/sessions">Book Now</Link>
          </Button>
        </div>

        {/* Mobile: Cart + Menu Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <CartButton />
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden"
          >
            <nav className="flex flex-col border-t border-neutral-200 bg-white px-4 py-6">
              {/* Home link */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0 }}
              >
                <Link
                  href="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="block py-4 text-lg font-medium text-foreground-muted hover:text-foreground border-b border-neutral-100"
                >
                  Home
                </Link>
              </motion.div>

              {/* Services Expandable Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
              >
                <button
                  onClick={() => setIsMobileServicesOpen(!isMobileServicesOpen)}
                  className="flex w-full items-center justify-between py-4 text-lg font-medium text-foreground-muted hover:text-foreground border-b border-neutral-100"
                >
                  Services
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      isMobileServicesOpen && "rotate-180"
                    )}
                  />
                </button>
                <AnimatePresence>
                  {isMobileServicesOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden bg-neutral-50"
                    >
                      {SERVICES_NAV.map((service, idx) => (
                        <motion.div
                          key={service.href}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                        >
                          <Link
                            href={service.href}
                            onClick={() => {
                              setIsMenuOpen(false);
                              setIsMobileServicesOpen(false);
                            }}
                            className="block py-3 pl-6 pr-4 text-base text-foreground-muted hover:text-foreground border-b border-neutral-100 last:border-0"
                          >
                            {service.label}
                          </Link>
                        </motion.div>
                      ))}
                      <Link
                        href="/services"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsMobileServicesOpen(false);
                        }}
                        className="block py-3 pl-6 pr-4 text-base font-medium text-brand-green hover:text-brand-green/80"
                      >
                        View All Services
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* About Us Expandable Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <button
                  onClick={() => setIsMobileAboutOpen(!isMobileAboutOpen)}
                  className="flex w-full items-center justify-between py-4 text-lg font-medium text-foreground-muted hover:text-foreground border-b border-neutral-100"
                >
                  About
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      isMobileAboutOpen && "rotate-180"
                    )}
                  />
                </button>
                <AnimatePresence>
                  {isMobileAboutOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden bg-neutral-50"
                    >
                      {ABOUT_NAV.map((item, idx) => (
                        <motion.div
                          key={item.href}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                        >
                          <Link
                            href={item.href}
                            onClick={() => {
                              setIsMenuOpen(false);
                              setIsMobileAboutOpen(false);
                            }}
                            className="block py-3 pl-6 pr-4 text-base text-foreground-muted hover:text-foreground border-b border-neutral-100 last:border-0"
                          >
                            {item.label}
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Other nav links (excluding Home) */}
              {NAV_LINKS.filter((link) => link.href !== "/").map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (index + 2) * 0.05 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-4 text-lg font-medium text-foreground-muted hover:text-foreground border-b border-neutral-100 last:border-0"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 flex flex-col gap-4"
              >
                <a
                  href={`tel:${SITE_CONFIG.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-2 py-2 text-base font-medium text-foreground-muted"
                >
                  <Phone className="h-5 w-5" />
                  {SITE_CONFIG.phone}
                </a>
                <Button asChild className="w-full">
                  <Link href="/sessions">Book Now</Link>
                </Button>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
