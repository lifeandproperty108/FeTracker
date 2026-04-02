import {
  Building2,
  ClipboardCheck,
  QrCode,
  Bell,
  FileText,
  Receipt,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Building2,
    title: "Multi-Tenant Management",
    description:
      "Manage multiple buildings and organizations from a single dashboard.",
  },
  {
    icon: ClipboardCheck,
    title: "NFPA 10 Checklists",
    description:
      "Type-specific inspection checklists following NFPA 10 standards for every extinguisher type.",
  },
  {
    icon: QrCode,
    title: "QR Code Scanning",
    description:
      "Generate and scan QR codes for instant extinguisher identification in the field.",
  },
  {
    icon: Bell,
    title: "Automated Alerts",
    description:
      "Automated email notifications at 30-day, 7-day, and overdue intervals.",
  },
  {
    icon: FileText,
    title: "Compliance Reports",
    description:
      "Generate PDF compliance reports and inspection certificates for auditors.",
  },
  {
    icon: Receipt,
    title: "Invoicing & Quotes",
    description:
      "Create quotes, convert to invoices, and track payments — all integrated.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-zinc-50 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Section heading */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Everything you need for fire safety compliance
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Purpose-built tools that streamline every part of your workflow.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, description }: Feature) {
  return (
    <div className="group rounded-xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md">
      <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-colors group-hover:bg-red-100">
        <Icon className="size-5" strokeWidth={2} />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-zinc-900">{title}</h3>
      <p className="text-sm leading-relaxed text-zinc-600">{description}</p>
    </div>
  );
}
