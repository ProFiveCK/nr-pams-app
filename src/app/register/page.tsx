import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Airline Registration"
      title="Request an airline account"
      description="Create an operator account for landing and overflight permit requests. New registrations are reviewed and approved by a system administrator before access is enabled."
      showWorkflowHint={false}
      footer={
        <p className="text-sm text-slate-700">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Sign in here
          </Link>
          .
        </p>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
