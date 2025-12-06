"use client";

import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OrderSummaryProps {
  items: ReturnType<typeof useCart>["items"];
  total: number;
}

export function OrderSummary({ items, total }: OrderSummaryProps) {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(id);
      return;
    }
    updateQuantity(id, newQuantity);
  };

  // Calculate shipping (placeholder - can be made dynamic later)
  const shipping = 0; // Or calculate based on location/weight
  const finalTotal = total + shipping;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">YOUR ORDER</h2>

      {/* Order Items */}
      <div className="space-y-4 border-b pb-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4">
            {/* Product Image */}
            <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
              <Image
                src={item.imageUrl || "/placeholder-image.jpg"}
                alt={item.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>

            {/* Product Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
              {(item.color || item.size) && (
                <p className="text-xs text-gray-600 mb-2">
                  {item.color && <span>{item.color}</span>}
                  {item.color && item.size && <span> • </span>}
                  {item.size && <span>Size: {item.size}</span>}
                </p>
              )}

              {/* Quantity Controls */}
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-gray-100 border-gray-300 hover:bg-gray-200"
                  onClick={() =>
                    handleQuantityChange(item.id, item.quantity - 1)
                  }
                >
                  -
                </Button>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    handleQuantityChange(item.id, value);
                  }}
                  className="w-16 h-8 text-center border-gray-300 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                  style={{ width: "4rem" }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-gray-100 border-gray-300 hover:bg-gray-200"
                  onClick={() =>
                    handleQuantityChange(item.id, item.quantity + 1)
                  }
                >
                  +
                </Button>
              </div>
            </div>

            {/* Price */}
            <div className="flex flex-col items-end">
              <p className="text-red-600 font-bold text-sm">
                {formatCurrency(item.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Order Totals */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="font-semibold">SUBTOTAL</span>
          <span className="font-semibold">{formatCurrency(total)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-semibold">Delivery Fee</span>
          <span className="font-semibold">{formatCurrency(shipping)}</span>
        </div>
        <div className="flex justify-between text-lg pt-3 border-t">
          <span className="font-bold">TOTAL</span>
          <span className="font-bold text-red-600">
            {formatCurrency(finalTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
