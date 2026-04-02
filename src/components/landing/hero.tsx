import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";

export function Hero() {
  return (
    <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-6 py-16 text-center sm:py-24">
      {/* Dot grid pattern background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #d4d4d8 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Subtle gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-red-50/50 via-white/80 to-white" />

      {/* Red accent line */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-32 w-px -translate-x-1/2 bg-gradient-to-b from-red-600/60 to-transparent" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:text-left">
        {/* Text content */}
        <div className="flex-1">
          {/* Brand */}
          <div className="mb-6 flex items-center justify-center gap-2 lg:justify-start">
            <Flame className="size-9 text-red-600" strokeWidth={2.25} />
            <span className="text-3xl font-bold tracking-tight text-red-600 sm:text-4xl">
              FE Tracker
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
            NFPA 10 Compliant{" "}
            <span className="text-red-600">Fire Extinguisher</span> Tracking
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 sm:text-xl lg:mx-0">
            Built for fire safety professionals. Manage inspections, track
            compliance, and protect your clients — all from one platform.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
            <Button
              className="h-12 min-w-[160px] rounded-full bg-red-600 px-8 text-base font-semibold text-white shadow-lg shadow-red-600/20 hover:bg-red-700 hover:shadow-xl hover:shadow-red-600/30"
              render={<Link href="/login" />}
            >
              Sign In
            </Button>
            <Button
              variant="outline"
              className="h-12 min-w-[160px] rounded-full px-8 text-base font-semibold"
              render={<a href="#features" />}
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Decorative fire extinguisher silhouette — desktop only */}
        <div className="hidden flex-shrink-0 lg:block" aria-hidden="true">
          <div className="relative flex h-80 w-48 items-center justify-center">
            {/* Glow behind */}
            <div className="absolute inset-0 rounded-3xl bg-red-50/80 blur-2xl" />
            <svg
              viewBox="0 0 120 280"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="relative h-72 w-auto opacity-20"
            >
              {/* Handle */}
              <rect x="42" y="8" width="36" height="12" rx="4" fill="#DC2626" />
              <rect x="30" y="20" width="60" height="8" rx="3" fill="#DC2626" />
              {/* Neck */}
              <rect x="46" y="28" width="28" height="16" rx="4" fill="#DC2626" />
              {/* Gauge */}
              <circle cx="60" cy="58" r="12" fill="#DC2626" />
              <circle cx="60" cy="58" r="7" fill="#FEE2E2" />
              {/* Body */}
              <rect x="32" y="44" width="56" height="180" rx="16" fill="#DC2626" />
              {/* Label area */}
              <rect x="40" y="80" width="40" height="60" rx="4" fill="#FEE2E2" />
              {/* Bottom */}
              <rect x="36" y="224" width="48" height="16" rx="6" fill="#DC2626" />
              {/* Base */}
              <rect x="30" y="240" width="60" height="12" rx="4" fill="#DC2626" />
              {/* Hose */}
              <path
                d="M78 36 C 100 36, 104 50, 104 70 L 104 110"
                stroke="#DC2626"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="104" cy="116" r="6" fill="#DC2626" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
