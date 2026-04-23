import { auth } from "@/auth";
import { ProfileForm } from "@/components/auth/profile-form";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await auth();

  const profile = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          fullName: true,
          companyName: true,
          email: true,
          role: true,
        },
      })
    : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-6 py-10">
      <section className="w-full rounded-3xl border border-line bg-panel p-7 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">Nauru PAMS</p>
        <h1 className="mt-2 text-2xl font-semibold text-brand">Airline Profile</h1>
        <p className="mt-2 text-sm text-slate-700">
          Keep your operator identity accurate. New applications use this profile by default.
        </p>

        {profile ? (
          <ProfileForm
            initial={{
              fullName: profile.fullName,
              companyName: profile.companyName ?? "",
              email: profile.email,
              role: profile.role,
            }}
          />
        ) : (
          <p className="mt-4 text-sm text-red-700">Unable to load profile.</p>
        )}
      </section>
    </main>
  );
}
