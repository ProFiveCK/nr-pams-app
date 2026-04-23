import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail, Phone, MapPin } from "lucide-react";
import { auth } from "@/auth";
import { getPortalPathForUserRole } from "@/lib/pams";

const contactItems = [
  {
    icon: Mail,
    label: "Email Support",
    value: "support@naurufinance.info",
    href: "mailto:support@naurufinance.info",
  },
  {
    icon: Phone,
    label: "Civil Aviation Office",
    value: "+674 557 3133",
    href: "tel:+6745573133",
  },
  {
    icon: MapPin,
    label: "Location",
    value: "Yaren District, Republic of Nauru",
    href: null,
  },
] as const;

export default async function Home() {
  const session = await auth();

  if (session?.user?.role) {
    redirect(getPortalPathForUserRole(session.user.role));
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-5 py-6 sm:px-6 sm:py-10 lg:px-10">
      <section className="relative w-full overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,#fbfdff_0%,#eef4f8_55%,#e8eff4_100%)] shadow-[0_28px_80px_rgba(18,55,79,0.10)]">

        {/* Dynamic Atmosphere Glows */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-brand-accent/10 blur-3xl" />

        <div className="relative z-10 grid gap-10 px-6 py-8 sm:px-8 md:px-10 lg:grid-cols-[1.25fr_380px] lg:gap-12 lg:py-12">
          <div className="max-w-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[#d8e1e8] bg-white shadow-[0_10px_24px_rgba(16,51,76,0.08)] transition-transform hover:scale-105">
                <Image
                  src="/government-logo.png"
                  alt="Government of Nauru crest"
                  fill
                  sizes="80px"
                  className="object-contain p-2"
                  priority
                />
              </div>
              <div className="transition-all duration-300">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.34em] text-brand-accent">Civil Aviation</p>
                <div className="mt-2 space-y-0.5 text-brand">
                  <p className="text-lg font-semibold sm:text-xl">Department of Transport</p>
                  <p className="text-sm font-medium text-slate-700 sm:text-base">Republic of Nauru</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-xl text-2xl font-bold tracking-[-0.04em] text-[#0a253d] sm:text-3xl lg:text-4xl">
                Streamlined aviation permit processing.
              </h1>
              <p className="max-w-xl text-base leading-8 text-brand-accent font-medium">
                Submit, review, approve, and track landing or overflight permits through one professional workflow.
              </p>
            </div>

            <div className="grid gap-3 sm:max-w-xl sm:grid-cols-1">
              {contactItems.map((item) => {
                const Icon = item.icon;
                const inner = (
                  <>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                      <Icon size={16} strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{item.label}</p>
                      <p className="truncate text-sm font-medium text-slate-800 group-hover:text-brand">{item.value}</p>
                    </div>
                  </>
                );
                return item.href ? (
                  <a key={item.label} href={item.href} className="group flex items-center gap-3 rounded-2xl border border-white/75 bg-white/72 px-4 py-3 shadow-[0_10px_22px_rgba(20,59,86,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
                    {inner}
                  </a>
                ) : (
                  <div key={item.label} className="group flex items-center gap-3 rounded-2xl border border-white/75 bg-white/72 px-4 py-3 shadow-[0_10px_22px_rgba(20,59,86,0.05)]">
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center lg:justify-end">
            <div className="w-full max-w-[380px] rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_22px_50px_rgba(16,51,76,0.10)] backdrop-blur-sm sm:p-7">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-brand-accent">Secure Access</p>
              <h2 className="mt-3 text-2xl font-semibold text-brand">Sign in to continue</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">Access is routed automatically to the correct portal based on your assigned role.</p>

              <div className="mt-6 space-y-3">
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#083d59] hover:shadow-lg active:scale-[0.98]"
                  style={{ color: "#ffffff" }}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="flex w-full items-center justify-center rounded-full border border-[#c9d8e2] bg-white px-6 py-3 text-sm font-semibold text-brand transition-all hover:bg-[#f3f8fb] hover:border-brand/30 active:scale-[0.98]"
                >
                  Register Airline
                </Link>
              </div>
            </div>
          </div>
        </div>

      </section>
    </main>
  );
}
