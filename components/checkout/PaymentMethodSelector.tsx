"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { DeliveryDetails } from "./CheckoutContent";
import {
  loadPaystackScript,
  initializePaystackPayment,
  generatePaymentReference,
} from "@/lib/utils/paystack";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { createOrder, updateOrderPaymentStatus } from "@/lib/actions/payments";

interface PaymentMethodSelectorProps {
  deliveryDetails: DeliveryDetails | null;
  onPaymentSuccess: () => void;
}

export function PaymentMethodSelector({
  deliveryDetails,
  onPaymentSuccess,
}: PaymentMethodSelectorProps) {
  const { items, getCartTotal } = useCart();
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load Paystack script on mount
  useEffect(() => {
    setIsLoadingScript(true);
    loadPaystackScript()
      .then(() => {
        // Wait a bit to ensure PaystackPop is fully initialized
        setTimeout(() => {
          if (window.PaystackPop) {
            setIsLoadingScript(false);
          } else {
            console.error("PaystackPop not available after script load");
            toast.error("Failed to load payment system. Please try again.");
            setIsLoadingScript(false);
          }
        }, 100);
      })
      .catch((error) => {
        console.error("Failed to load Paystack script:", error);
        toast.error("Failed to load payment system. Please try again.");
        setIsLoadingScript(false);
      });
  }, []);

  const handlePaystackPayment = () => {
    if (!deliveryDetails) {
      toast.error("Please fill in delivery details first");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!window.PaystackPop) {
      toast.error(
        "Payment system not ready. Please wait a moment and try again.",
      );
      setIsLoadingScript(true);
      loadPaystackScript()
        .then(() => {
          setIsLoadingScript(false);
          toast.info("Payment system loaded. Please try again.");
        })
        .catch(() => {
          setIsLoadingScript(false);
          toast.error(
            "Failed to load payment system. Please refresh the page.",
          );
        });
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      toast.error("Payment system not configured. Please contact support.");
      return;
    }

    setIsProcessing(true);

    try {
      const total = getCartTotal();
      const amountInKobo = Math.round(total * 100); // Convert to kobo
      const reference = generatePaymentReference();

      // Prepare metadata
      const metadata = {
        cart_items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        deliveryDetails: {
          name: deliveryDetails.fullName,
          phone: deliveryDetails.phone,
          address: `${deliveryDetails.addressLine1}, ${deliveryDetails.city}`,
        },
      };

      initializePaystackPayment({
        key: publicKey,
        email: deliveryDetails.email,
        amount: amountInKobo,
        reference: reference,
        metadata: metadata,
        callback: (response: any) => {
          // Payment successful - handle async operations without blocking
          if (response.status === "success" || response.reference) {
            (async () => {
              try {
                // Create order in database
                const orderResult = await createOrder({
                  reference: response.reference || reference,
                  email: deliveryDetails.email,
                  amount: total,
                  deliveryDetails: {
                    name: deliveryDetails.fullName,
                    email: deliveryDetails.email,
                    phone: deliveryDetails.phone,
                    addressLine1: deliveryDetails.addressLine1,
                    addressLine2: deliveryDetails.addressLine2,
                    city: deliveryDetails.city,
                    state: deliveryDetails.state,
                    postalCode: deliveryDetails.postalCode,
                    country: deliveryDetails.country,
                    note: deliveryDetails.note,
                  },
                  cartItems: items.map((item) => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    color: item.color,
                    size: item.size,
                    imageUrl: item.imageUrl,
                  })),
                  paymentMethod: "card",
                });

                if (orderResult.success) {
                  // Update payment status to paid
                  await updateOrderPaymentStatus(
                    response.reference || reference,
                    "paid",
                  );

                  // Clear cart and redirect
                  onPaymentSuccess();
                  setTimeout(() => {
                    window.location.href = `/checkout/success?reference=${response.reference || reference}`;
                  }, 100);
                } else {
                  toast.error(orderResult.error || "Failed to create order");
                  setIsProcessing(false);
                }
              } catch (error) {
                console.error("Error creating order:", error);
                toast.error(
                  "Payment successful but failed to save order. Please contact support.",
                );
                setIsProcessing(false);
              }
            })();
          } else {
            toast.error("Payment failed. Please try again.");
            setIsProcessing(false);
          }
        },
        onClose: () => {
          // User closed payment popup
          toast.info("Payment cancelled");
          setIsProcessing(false);
        },
      });
    } catch (error) {
      console.error("Error initializing payment:", error);
      toast.error("Failed to initialize payment. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handlePaystackPayment}
        disabled={!deliveryDetails || isLoadingScript || isProcessing}
        className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg font-semibold"
      >
        {isLoadingScript
          ? "Loading Payment..."
          : isProcessing
            ? "Processing..."
            : `Pay with Paystack - ${formatCurrency(getCartTotal())}`}
      </Button>
      <p className="text-sm text-gray-600 text-center">
        Paystack supports card payments, bank transfers, and other payment
        methods
      </p>
    </div>
  );
}
