"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { DeliveryDetailsForm } from "./DeliveryDetailsForm";
import { OrderSummary } from "./OrderSummary";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { toast } from "sonner";

export type PaymentMethod = "card"; // Paystack handles all payment methods

export interface DeliveryDetails {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  note?: string;
}

export function CheckoutContent() {
  const router = useRouter();
  const { items, getCartTotal, clearCart } = useCart();
  const [deliveryDetails, setDeliveryDetails] =
    useState<DeliveryDetails | null>(null);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      router.push("/cart");
    }
  }, [items, router]);

  const handleDeliveryDetailsSubmit = (details: DeliveryDetails) => {
    setDeliveryDetails(details);
    toast.success("Delivery details saved");
  };

  if (items.length === 0) {
    return null; // Will redirect via useEffect
  }

  const total = getCartTotal();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Delivery Details */}
        <div className="space-y-6">
          <DeliveryDetailsForm
            onSubmit={handleDeliveryDetailsSubmit}
            initialData={deliveryDetails}
          />
        </div>

        {/* Right Column - Order Summary & Payment */}
        <div className="space-y-6">
          <OrderSummary items={items} total={total} />

          <PaymentMethodSelector
            deliveryDetails={deliveryDetails}
            onPaymentSuccess={() => {
              clearCart();
            }}
          />
        </div>
      </div>
    </div>
  );
}
