import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";

export function Hero() {
  return (
    <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
      {/* Subtle gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-red-50/60 via-white to-white" />

      <div className="relative z-10 mx-auto max-w-3xl">
        {/* Brand */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <Flame className="size-10 text-red-600" strokeWidth={2.25} />
          <span className="text-4xl font-bold tracking-tight text-red-600">
            FE Tracker
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
          NFPA 10 Compliant{" "}
          <span className="text-red-600">Fire Extinguisher</span> Tracking
        </h1>

        {/* Subtext */}
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 sm:text-xl">
          Built for fire safety professionals. Manage inspections, track
          compliance, and protect your clients — all from one platform.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            className="h-11 min-w-[140px] rounded-lg bg-red-600 px-6 text-base font-semibold text-white hover:bg-red-700"
            render={<Link href="/login" />}
          >
            Sign In
          </Button>
          <Button
            variant="outline"
            className="h-11 min-w-[140px] rounded-lg px-6 text-base font-semibold"
            render={<a href="#features" />}
          >
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
}
