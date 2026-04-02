import { Flame } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-2">
          <Flame className="size-5 text-red-600" strokeWidth={2.25} />
          <span className="text-lg font-bold tracking-tight text-zinc-900">
            FE Tracker
          </span>
        </div>
        <p className="text-sm text-zinc-500">
          NFPA 10 Compliant Fire Extinguisher Tracking
        </p>
        <p className="text-xs text-zinc-400">
          &copy; {new Date().getFullYear()} FE Tracker. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
