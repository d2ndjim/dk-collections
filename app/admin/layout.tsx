import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Skip auth check for login and auth callback pages
  const isLoginPage = pathname.startsWith("/admin/login");
  const isAuthCallback = pathname.startsWith("/admin/auth");

  if (!isLoginPage && !isAuthCallback) {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Redirect to login if not authenticated
    if (!session) {
      redirect("/admin/login");
    }
  }

  return <>{children}</>;
}
