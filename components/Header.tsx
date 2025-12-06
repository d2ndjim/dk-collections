"use client";

import Link from "next/link";
import { NavigationBar } from "./NavigationBar";

interface HeaderProps {
  category?: "all" | "clothes" | "shoes" | "accessories";
  variant?: "full" | "minimal";
}

export default function Header({
  category = "all",
  variant = "full",
}: HeaderProps) {
  const getHeaderText = () => {
    if (category === "all") {
      return {
        line1: "Welcome to",
        line2: "DK Collections",
      };
    }

    const categoryName = category
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

    return {
      line1: categoryName,
      line2: null,
    };
  };

  const { line1, line2 } = getHeaderText();

  return (
    <header className="relative w-full">
      {/* Navigation Bar */}
      <div className="relative z-20 bg-white mb-4">
        <NavigationBar variant={variant} />
      </div>

      {/* Banner Section - Only show in full variant */}
      {variant === "full" && (
        <div className="bg-[#D32F2F] py-12 px-4 flex items-center justify-center relative z-10">
          <div className="text-center">
            {line2 ? (
              <div className="flex flex-col items-center gap-2">
                <h1 className="text-white text-4xl md:text-5xl font-bold tracking-tight">
                  {line1}
                </h1>
                <h1 className="text-white text-3xl md:text-4xl font-medium tracking-tight">
                  {line2}
                </h1>
              </div>
            ) : (
              <h1 className="text-white text-4xl md:text-5xl font-bold tracking-tight">
                {line1}
              </h1>
            )}
          </div>
        </div>
      )}

      {/* Category Tabs - Only show in full variant */}
      {variant === "full" && (
        <div className="bg-gray-100 border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex justify-center gap-6 py-3">
              <Link
                href="/?category=all"
                className={`text-sm font-medium ${
                  category === "all"
                    ? "text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                } transition-colors`}
              >
                All
              </Link>
              <Link
                href="/?category=shoes"
                className={`text-sm font-medium ${
                  category === "shoes"
                    ? "text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                } transition-colors`}
              >
                Shoes
              </Link>
              <Link
                href="/?category=clothes"
                className={`text-sm font-medium ${
                  category === "clothes"
                    ? "text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                } transition-colors`}
              >
                Clothes
              </Link>
              <Link
                href="/?category=accessories"
                className={`text-sm font-medium ${
                  category === "accessories"
                    ? "text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                } transition-colors`}
              >
                Accessories
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
