import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthenticated = Boolean(session);

  return (
    <div className="min-h-screen bg-slate-100">
      {!isAuthenticated && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-sm text-amber-900">
          <p className="font-medium">Admin authentication is not enabled yet.</p>
          <p className="text-amber-800/80">
            Once Supabase Auth is configured, update this layout to enforce access
            control. For now, the banner is a reminder that the dashboard is
            running in open mode.
          </p>
        </div>
      )}
      {children}
    </div>
  );
}

