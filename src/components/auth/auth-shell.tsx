import Image from "next/image";
import Link from "next/link";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
  showWorkflowHint = true,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showWorkflowHint?: boolean;
}) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-5 py-6 sm:px-6 sm:py-10 lg:px-10">
      <section className="w-full overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,#fbfdff_0%,#eef4f8_60%,#e8eff4_100%)] shadow-[0_28px_80px_rgba(18,55,79,0.10)]">
        <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1fr_440px] lg:px-10 lg:py-10">
          <div className="flex flex-col justify-between gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[#d8e1e8] bg-white shadow-[0_10px_24px_rgba(16,51,76,0.08)]">
                  <Image
                    src="/government-logo.png"
                    alt="Government of Nauru crest"
                    fill
                    sizes="80px"
                    className="object-contain p-2"
                    priority
                  />
                </div>
                <div>
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.34em] text-brand-accent">Nauru Government</p>
                  <p className="mt-2 text-lg font-semibold text-brand sm:text-xl">Permit Application Management System</p>
                </div>
              </div>

              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-brand-accent">{eyebrow}</p>
                <h1 className="mt-3 max-w-lg text-3xl font-semibold tracking-[-0.04em] text-[#12324b] sm:text-4xl">{title}</h1>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-700 sm:text-base">{description}</p>
              </div>

              {showWorkflowHint ? (
                <div className="rounded-2xl border border-white/70 bg-white/72 px-4 py-4 shadow-[0_10px_22px_rgba(20,59,86,0.05)]">
                  <p className="text-sm leading-6 text-slate-700">Role-based access routes users directly to the correct workflow after sign-in.</p>
                </div>
              ) : null}
            </div>

            <div>
              <Link href="/" className="inline-flex items-center rounded-full border border-[#c9d8e2] bg-white px-5 py-2.5 text-sm font-semibold text-brand transition hover:bg-[#f3f8fb]">
                Return Home
              </Link>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-[#d7e1e9] bg-white p-6 shadow-[0_22px_50px_rgba(16,51,76,0.10)] sm:p-7">
            {children}
            {footer ? <div className="mt-5">{footer}</div> : null}
          </div>
        </div>
      </section>
    </main>
  );
}