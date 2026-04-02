export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <span className="text-sm font-bold tracking-tight text-zinc-900">
          FE Tracker
        </span>
        <div className="flex items-center gap-4 text-sm text-zinc-500">
          <span>NFPA 10 Compliant</span>
          <span className="hidden sm:inline" aria-hidden="true">
            &middot;
          </span>
          <span>
            &copy; {new Date().getFullYear()} FE Tracker. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
