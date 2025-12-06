// Database types for the ecommerce store
// These types match the Supabase database schema

export type ProductType = "clothes" | "shoes" | "accessories";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
  product_type: ProductType;
  brand: string | null;
  material: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  color_code: string | null;
  stock: number;
  sku: string | null;
  price_override: number | null;
  weight: number | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  variant_id: string | null;
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

// Extended types for queries with joins
export interface ProductWithDetails extends Product {
  categories: Category | null;
  product_variants: ProductVariant[];
  product_images: ProductImage[];
}

export interface ProductWithCategory extends Product {
  categories: Category | null;
}

export type PaymentMethod = "bank_transfer" | "card";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  order_number: string;
  payment_reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address_line1: string;
  delivery_address_line2: string | null;
  delivery_city: string;
  delivery_state: string;
  delivery_postal_code: string;
  delivery_country: string;
  delivery_note: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_amount: number;
  payment_currency: string;
  order_status: OrderStatus;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  product_image_url: string | null;
  variant_color: string | null;
  variant_size: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export interface OrderWithSummary extends Order {
  item_count: number;
  items_subtotal: number;
}
