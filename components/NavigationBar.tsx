"use client";

import Image from "next/image";
import Link from "next/link";
import { SearchBar } from "./SearchBar";
import { CartIcon } from "./CartIcon";

interface NavigationBarProps {
  variant?: "full" | "minimal";
}

export function NavigationBar({ variant = "full" }: NavigationBarProps) {
  return (
    <nav className="bg-white border-b border-gray-200 relative z-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center relative z-10">
            <div className="relative bg-white">
              <Image
                src="/assets/Logo.png"
                alt="DK Collections"
                width={120}
                height={40}
                className="h-auto object-contain"
                style={{
                  backgroundColor: "white",
                }}
                priority
              />
            </div>
          </Link>

          {variant === "full" && <SearchBar />}

          <div className="flex items-center gap-6">
            <CartIcon />
          </div>
        </div>
      </div>
    </nav>
  );
}
