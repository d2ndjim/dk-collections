"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { getOrderWithItemsByReference } from "@/lib/actions/payments";
import { formatCurrency } from "@/lib/utils";
import type { OrderWithItems } from "@/lib/types/database";

function SuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || "N/A";
  const [orderData, setOrderData] = useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(() => reference !== "N/A");

  useEffect(() => {
    let isMounted = true;

    if (reference && reference !== "N/A") {
      getOrderWithItemsByReference(reference)
        .then((result) => {
          if (isMounted) {
            if (result.success && result.order) {
              setOrderData(result.order);
            }
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        });
    } else {
      // Use setTimeout to avoid synchronous setState in effect
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    return () => {
      isMounted = false;
    };
  }, [reference]);

  const order = orderData;
  const orderItems = order?.order_items || [];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-600">
            Thank you for your order. We&apos;ve received your payment and will
            process your order shortly.
          </p>
        </div>

        {/* Order Summary Card */}
        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
        ) : order ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

            {/* Payment Reference */}
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-sm font-medium text-gray-600">
                Payment Reference
              </span>
              <span className="font-mono font-semibold">
                {order.payment_reference}
              </span>
            </div>

            {/* Items Count */}
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-sm font-medium text-gray-600">Items</span>
              <span className="font-semibold">{orderItems.length}</span>
            </div>

            {/* Delivery Fee */}
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-sm font-medium text-gray-600">
                Delivery Fee
              </span>
              <span className="font-semibold">{formatCurrency(0)}</span>
            </div>

            {/* Payment Method */}
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-sm font-medium text-gray-600">
                Payment Method
              </span>
              <span className="font-semibold">Paystack</span>
            </div>

            {/* Delivery Address */}
            <div className="pb-3 border-b">
              <span className="text-sm font-medium text-gray-600 block mb-2">
                Delivery Address
              </span>
              <div className="text-sm">
                <p className="font-semibold">{order.customer_name}</p>
                <p className="text-gray-600">{order.customer_phone}</p>
                <p className="text-gray-600">
                  {order.delivery_address_line1}
                  {order.delivery_address_line2 &&
                    `, ${order.delivery_address_line2}`}
                </p>
                <p className="text-gray-600">
                  {order.delivery_city}, {order.delivery_state}
                </p>
              </div>
            </div>

            {/* Order Items Summary */}
            {orderItems.length > 0 && (
              <div className="pt-3">
                <span className="text-sm font-medium text-gray-600 block mb-3">
                  Ordered Items
                </span>
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex gap-3 items-center">
                      {item.product_image_url && (
                        <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                          <Image
                            src={item.product_image_url}
                            alt={item.product_name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {item.product_name}
                        </p>
                        {(item.variant_color || item.variant_size) && (
                          <p className="text-xs text-gray-600">
                            {item.variant_color && (
                              <span>{item.variant_color}</span>
                            )}
                            {item.variant_color && item.variant_size && (
                              <span> • </span>
                            )}
                            {item.variant_size && (
                              <span>Size: {item.variant_size}</span>
                            )}
                          </p>
                        )}
                        <p className="text-xs text-gray-600">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-sm font-semibold">
                        {formatCurrency(item.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          reference &&
          reference !== "N/A" && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Payment Reference</p>
              <p className="font-mono font-semibold">{reference}</p>
            </div>
          )
        )}

        {/* Continue Shopping Button */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link href="/">
            <Button className="bg-red-600 hover:bg-red-700 text-white px-8">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header variant="minimal" />
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-12 flex-1">
            <div className="animate-pulse space-y-4 text-center">
              <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto" />
              <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
            </div>
          </div>
        }
      >
        <div className="flex-1">
          <SuccessContent />
        </div>
      </Suspense>
      <Footer />
    </div>
  );
}
