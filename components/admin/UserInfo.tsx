"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function UserInfo() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setEmail(user?.email || null);
      setLoading(false);
    }
    getUser();
  }, []);

  if (loading || !email) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center animate-pulse">
          <span className="text-xs font-medium">...</span>
        </div>
        <span className="text-sm font-medium hidden sm:inline">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
        <span className="text-xs font-medium">{email[0].toUpperCase()}</span>
      </div>
      <span className="text-sm font-medium hidden sm:inline">{email}</span>
    </div>
  );
}
