import { Suspense } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Secure Access"
      title="Sign in to continue"
      description="Use your assigned account to access the permit workflow for your role."
      showWorkflowHint={false}
      footer={
        <p className="text-sm text-slate-700">
          New airline/operator?{" "}
          <Link href="/register" className="font-semibold text-brand hover:underline">
            Create account
          </Link>
          .
        </p>
      }
    >
      <Suspense fallback={<p className="text-sm text-slate-600">Loading sign-in form...</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
