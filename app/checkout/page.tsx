"use client";

import { Suspense } from "react";
import Header from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CheckoutContent } from "@/components/checkout/CheckoutContent";

export default function CheckoutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header variant="minimal" />
      {/* Red Banner */}
      <div className="bg-[#D32F2F] py-12 px-4">
        <div className="container mx-auto">
          <h1 className="text-white text-4xl md:text-5xl font-bold text-center">
            Checkout
          </h1>
        </div>
      </div>
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-8 flex-1">
            <div className="animate-pulse space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/3" />
                  <div className="h-64 bg-gray-200 rounded" />
                </div>
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/3" />
                  <div className="h-96 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          </div>
        }
      >
        <div className="flex-1">
          <CheckoutContent />
        </div>
      </Suspense>
      <Footer />
    </div>
  );
}
