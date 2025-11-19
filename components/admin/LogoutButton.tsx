"use client";

import { useState } from "react";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    await signOut();
  }

  return (
    <form action={handleLogout}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Logout</span>
      </Button>
    </form>
  );
}
