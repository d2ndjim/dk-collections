"use client";

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartContent } from "@/components/CartContent";

export default function CartPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header variant="minimal" />
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-8 flex-1">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4" />
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4 border-b pb-4">
                  <div className="w-24 h-24 bg-gray-200 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-8 bg-gray-200 rounded w-32" />
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
      >
        <div className="flex-1">
          <CartContent />
        </div>
      </Suspense>
      <Footer />
    </div>
  );
}

