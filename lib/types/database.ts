// Database types for the ecommerce store
// These types match the Supabase database schema

export type ProductType = 'clothes' | 'shoes' | 'accessories';

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

