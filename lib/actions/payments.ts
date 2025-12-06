"use server";

import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/types/database";

export interface PaymentData {
  reference: string;
  email: string;
  amount: number;
  deliveryDetails: {
    name: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    note?: string;
  };
  cartItems: Array<{
    productId: string;
    variantId: string | null;
    name: string;
    price: number;
    quantity: number;
    color: string | null;
    size: string | null;
    imageUrl?: string;
  }>;
  paymentMethod: "bank_transfer" | "card";
}

export interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  error?: string;
  message?: string;
}

/**
 * Creates an order in the database
 */
export async function createOrder(
  paymentData: PaymentData,
): Promise<CreateOrderResult> {
  try {
    const supabase = await createClient();

    // First, get product images for order items
    const orderItemsData = await Promise.all(
      paymentData.cartItems.map(async (item) => {
        let imageUrl: string | null = null;

        // Try to get product image
        if (item.productId) {
          const { data: images } = await supabase
            .from("product_images")
            .select("image_url")
            .eq("product_id", item.productId)
            .eq("is_primary", true)
            .limit(1)
            .single();

          imageUrl = images?.image_url || null;
        }

        return {
          product_id: item.productId,
          variant_id: item.variantId,
          product_name: item.name,
          product_image_url: imageUrl || item.imageUrl || null,
          variant_color: item.color,
          variant_size: item.size,
          unit_price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        };
      }),
    );

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        payment_reference: paymentData.reference,
        customer_name: paymentData.deliveryDetails.name,
        customer_email: paymentData.deliveryDetails.email,
        customer_phone: paymentData.deliveryDetails.phone,
        delivery_address_line1: paymentData.deliveryDetails.addressLine1,
        delivery_address_line2:
          paymentData.deliveryDetails.addressLine2 || null,
        delivery_city: paymentData.deliveryDetails.city,
        delivery_state: paymentData.deliveryDetails.state,
        delivery_postal_code: paymentData.deliveryDetails.postalCode,
        delivery_country: paymentData.deliveryDetails.country,
        delivery_note: paymentData.deliveryDetails.note || null,
        payment_method: paymentData.paymentMethod,
        payment_status:
          paymentData.paymentMethod === "card" ? "paid" : "pending",
        payment_amount: paymentData.amount,
        payment_currency: "NGN",
        order_status: "pending",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      return {
        success: false,
        error: orderError.message,
        message: "Failed to create order",
      };
    }

    const orderItems = orderItemsData.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      // Try to delete the order if items creation fails
      await supabase.from("orders").delete().eq("id", order.id);
      return {
        success: false,
        error: itemsError.message,
        message: "Failed to create order items",
      };
    }

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      message: "Order created successfully",
    };
  } catch (error) {
    console.error("Unexpected error creating order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Failed to create order",
    };
  }
}

/**
 * Updates order payment status (for Paystack webhooks)
 */
export async function updateOrderPaymentStatus(
  paymentReference: string,
  paymentStatus: "paid" | "failed" | "refunded",
  orderStatus?: "confirmed" | "processing" | "cancelled",
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const updateData: any = {
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    };

    if (orderStatus) {
      updateData.order_status = orderStatus;
    } else if (paymentStatus === "paid") {
      updateData.order_status = "confirmed";
    } else if (paymentStatus === "failed") {
      updateData.order_status = "cancelled";
    }

    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("payment_reference", paymentReference);

    if (error) {
      console.error("Error updating order payment status:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error updating order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Gets an order by payment reference
 */
export async function getOrderByReference(
  paymentReference: string,
): Promise<{ success: boolean; order?: Order; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("payment_reference", paymentReference)
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      order: order as Order,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Gets an order with items by payment reference
 */
export async function getOrderWithItemsByReference(
  paymentReference: string,
): Promise<{ success: boolean; order?: any; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("payment_reference", paymentReference)
      .single();

    if (orderError) {
      return {
        success: false,
        error: orderError.message,
      };
    }

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });

    if (itemsError) {
      return {
        success: false,
        error: itemsError.message,
      };
    }

    return {
      success: true,
      order: {
        ...order,
        order_items: items || [],
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
