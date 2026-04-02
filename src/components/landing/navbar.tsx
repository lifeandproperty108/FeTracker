"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-zinc-200 bg-white/80 shadow-sm backdrop-blur-md"
          : "border-b border-transparent bg-white"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold tracking-tight text-red-600">
          FE Tracker
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
          >
            Features
          </a>
          <Button
            className="h-9 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700"
            render={<Link href="/login" />}
          >
            Sign In
          </Button>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Open menu" />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle className="text-left text-lg font-bold text-red-600">
                  FE Tracker
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 px-4">
                <SheetClose
                  render={<a href="#features" />}
                  className="text-base font-medium text-zinc-700 transition-colors hover:text-zinc-900"
                >
                  Features
                </SheetClose>
                <SheetClose
                  render={<Link href="/login" />}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                >
                  Sign In
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
