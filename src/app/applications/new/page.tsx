import Link from "next/link";
import { NewApplicationForm } from "@/components/workflow/new-application-form";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function NewApplicationPage() {
  const session = await auth();

  const profile = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          email: true,
          companyName: true,
        },
      })
    : null;

  const isProfileComplete = Boolean(profile?.companyName?.trim() && profile?.email?.trim());

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 lg:px-10">
      <Link
        href="/portal"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand"
      >
        ← Back to Dashboard
      </Link>
      <section className="rounded-3xl border border-line bg-panel p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-brand sm:text-3xl">New Permit Application</h1>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          Phase 1 starter form aligned to landing and overflight workflows in the approved request brief.
        </p>

        {!isProfileComplete ? (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Airline profile is incomplete. Please update your operator name before submitting applications.
            <div className="mt-2">
              <Link href="/profile" className="font-semibold text-brand hover:underline">
                Open Profile
              </Link>
            </div>
          </div>
        ) : null}

        <NewApplicationForm
          defaults={{
            operatorName: profile?.companyName ?? "",
            operatorEmail: profile?.email ?? "",
          }}
          profileComplete={isProfileComplete}
        />
      </section>
    </main>
  );
}
