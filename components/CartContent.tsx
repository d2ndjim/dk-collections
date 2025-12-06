"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function CartContent() {
  const { items, updateQuantity, removeFromCart, clearCart, getCartTotal } =
    useCart();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCart = () => {
    setIsClearing(true);
    clearCart();
    toast.success("Cart cleared");
    setIsClearing(false);
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(id);
      toast.success("Item removed from cart");
      return;
    }
    updateQuantity(id, newQuantity);
  };

  const handleRemoveItem = (id: string, name: string) => {
    removeFromCart(id);
    toast.success(`${name} removed from cart`);
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Your cart is empty</h1>
          <p className="text-gray-600">Add some items to get started!</p>
          <Link href="/">
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const total = getCartTotal();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Clear Cart */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Shopping Cart</h1>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
              disabled={isClearing}
            >
              <X className="h-4 w-4" />
              Clear Cart
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Cart?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove all items from your cart? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearCart}
                className="bg-red-600 hover:bg-red-700"
              >
                Clear Cart
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Cart Items */}
      <div className="space-y-0 mb-8">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 py-4 border-b border-gray-200 last:border-b-0"
          >
            {/* Product Image */}
            <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
              <Image
                src={item.imageUrl || "/placeholder-image.jpg"}
                alt={item.name}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>

            {/* Product Details */}
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Product Name */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base sm:text-lg mb-1">
                  {item.name}
                </h3>
                {(item.color || item.size) && (
                  <p className="text-sm text-gray-600">
                    {item.color && <span>Color: {item.color}</span>}
                    {item.color && item.size && <span> • </span>}
                    {item.size && <span>Size: {item.size}</span>}
                  </p>
                )}
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 bg-gray-100 border-gray-300 hover:bg-gray-200"
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
                  className="w-16 h-9 text-center border-gray-300 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                  style={{ width: "4rem" }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 bg-gray-100 border-gray-300 hover:bg-gray-200"
                  onClick={() =>
                    handleQuantityChange(item.id, item.quantity + 1)
                  }
                >
                  +
                </Button>
              </div>

              {/* Price */}
              <div className="flex flex-col items-start sm:items-end gap-1">
                <p className="text-red-600 font-bold text-base sm:text-lg">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => handleRemoveItem(item.id, item.name)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 transition-colors self-start sm:self-center mt-2 sm:mt-0"
              >
                <Trash2 className="h-4 w-4" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex justify-end pt-6 border-t mb-6">
        <div className="text-right">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(total)}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link href="/" className="w-full sm:w-auto">
          <Button
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50 w-full sm:w-auto px-8 py-6 text-base font-semibold"
          >
            Continue Shopping
          </Button>
        </Link>
        <Link href="/checkout" className="w-full sm:w-auto">
          <Button className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto px-8 py-6 text-base font-semibold">
            Proceed to Checkout
          </Button>
        </Link>
      </div>
    </div>
  );
}
