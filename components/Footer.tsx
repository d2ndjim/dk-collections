"use client";

import { useState } from "react";
import { Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Implement newsletter subscription
    console.log("Subscribe:", email);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setEmail("");
      // TODO: Show success toast
    }, 500);
  };

  return (
    <footer
      className="text-white mt-auto"
      style={{ backgroundColor: "#000000" }}
    >
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Left Section - Contact Us */}
          <div className="space-y-3 md:space-y-4">
            <h2 className="text-base md:text-lg font-bold uppercase">
              CONTACT US
            </h2>
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="text-xs md:text-sm">+2348000000000</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="text-xs md:text-sm">Lagos, Nigeria</span>
              </div>
            </div>
          </div>

          {/* Right Section - Newsletter Signup */}
          <div className="space-y-3 md:space-y-4">
            <h2 className="text-base md:text-lg font-bold uppercase">
              SIGN UP FOR DISCOUNTS & UPDATES
            </h2>
            <form onSubmit={handleSubscribe} className="space-y-2 md:space-y-3">
              <Input
                type="text"
                placeholder="Enter your phone number or email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-9 md:h-10 text-sm focus:border-gray-600 focus-visible:ring-gray-600"
                required
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold h-9 md:h-10 text-sm"
              >
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-700 text-center">
          <p className="text-xs md:text-sm text-gray-400">© DK Collections</p>
        </div>
      </div>
    </footer>
  );
}
