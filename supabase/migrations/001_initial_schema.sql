-- ============================================
-- Ecommerce Clothing Store Database Schema
-- ============================================
-- This migration creates all necessary tables for:
-- - Categories
-- - Products (clothes, shoes, accessories)
-- - Product Variants (sizes, colors, stock)
-- - Product Images
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Categories Table
-- ============================================
-- Stores product categories (e.g., Men's, Women's, Kids, etc.)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Products Table
-- ============================================
-- Stores all products: clothes, shoes, and accessories
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  compare_at_price DECIMAL(10, 2) CHECK (compare_at_price >= 0),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  product_type VARCHAR(50) NOT NULL CHECK (product_type IN ('clothes', 'shoes', 'accessories')),
  brand VARCHAR(100),
  material TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Product Variants Table
-- ============================================
-- Stores product variations (sizes, colors, stock levels)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size VARCHAR(20),
  color VARCHAR(50),
  color_code VARCHAR(7), -- Hex color code for display
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  sku VARCHAR(100) UNIQUE,
  price_override DECIMAL(10, 2) CHECK (price_override >= 0), -- Optional variant-specific pricing
  weight DECIMAL(8, 2), -- Weight in grams/ounces
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Product Images Table
-- ============================================
-- Stores images for each product
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_variants_available ON product_variants(is_available) WHERE is_available = TRUE;
CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_images_primary ON product_images(product_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- ============================================
-- Functions for Automatic Timestamp Updates
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at timestamp
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================
-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all tables (for ecommerce store)
CREATE POLICY "Allow public read access on categories"
    ON categories FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access on products"
    ON products FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access on product_variants"
    ON product_variants FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access on product_images"
    ON product_images FOR SELECT
    USING (true);

-- ============================================
-- Sample Data (Optional - Comment out if not needed)
-- ============================================
-- Uncomment the following section to insert sample data

/*
-- Insert sample categories
INSERT INTO categories (name, slug, description) VALUES
('Men''s Clothing', 'mens-clothing', 'Clothing for men'),
('Women''s Clothing', 'womens-clothing', 'Clothing for women'),
('Men''s Shoes', 'mens-shoes', 'Shoes for men'),
('Women''s Shoes', 'womens-shoes', 'Shoes for women'),
('Accessories', 'accessories', 'Fashion accessories');

-- Insert sample products
INSERT INTO products (name, slug, description, price, category_id, product_type, brand, is_featured) VALUES
('Classic White T-Shirt', 'classic-white-tshirt', 'A comfortable and versatile white t-shirt', 29.99, 
 (SELECT id FROM categories WHERE slug = 'mens-clothing'), 'clothes', 'DK Collections', true),
('Running Sneakers', 'running-sneakers', 'Comfortable running shoes for daily wear', 89.99,
 (SELECT id FROM categories WHERE slug = 'mens-shoes'), 'shoes', 'DK Collections', true),
('Leather Watch', 'leather-watch', 'Elegant leather strap watch', 149.99,
 (SELECT id FROM categories WHERE slug = 'accessories'), 'accessories', 'DK Collections', true);
*/

