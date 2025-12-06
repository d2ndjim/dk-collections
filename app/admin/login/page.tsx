import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { LoginForm } from "@/components/admin/LoginForm";

export default async function LoginPage() {
  const session = await getSession();

  // Redirect if already logged in
  if (session) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md px-4">
        <LoginForm />
      </div>
    </div>
  );
}
