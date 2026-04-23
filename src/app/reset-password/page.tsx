import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token = "" } = await searchParams;

  return (
    <AuthShell
      eyebrow="Account Recovery"
      title="Choose a new password"
      description="Password reset links expire after 60 minutes and can only be used once."
      showWorkflowHint={false}
      footer={
        <p className="text-sm text-slate-700">
          Need a new link?{" "}
          <Link href="/forgot-password" className="font-semibold text-brand hover:underline">
            Request another reset
          </Link>
          .
        </p>
      }
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
