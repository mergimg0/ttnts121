"use client";

export function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Single subtle gradient - no animation */}
      <div className="absolute -right-20 top-20 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-sky/8 to-navy/3 blur-3xl" />
      <div className="absolute -left-40 bottom-0 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-navy/5 to-transparent blur-3xl" />
    </div>
  );
}
