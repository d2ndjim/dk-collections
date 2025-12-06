"use client";

import Link from "next/link";
import Header from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function CheckoutFailedPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header variant="minimal" />
      <div className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-100 p-4">
              <XCircle className="h-16 w-16 text-red-600" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Payment Failed</h1>
          <p className="text-gray-600">
            We couldn&apos;t process your payment. Please try again or contact
            support if the problem persists.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/cart">
              <Button
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50 px-8"
              >
                Back to Cart
              </Button>
            </Link>
            <Link href="/">
              <Button className="bg-red-600 hover:bg-red-700 text-white px-8">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
