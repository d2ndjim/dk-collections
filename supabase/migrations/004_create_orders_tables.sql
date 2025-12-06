-- ============================================
-- Orders and Order Items Tables
-- ============================================
-- This migration creates tables for:
-- - Orders (customer orders with delivery and payment info)
-- - Order Items (individual products in each order)
-- ============================================

-- ============================================
-- Orders Table
-- ============================================
-- Stores customer orders with delivery details and payment information
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Order identification
  order_number VARCHAR(50) UNIQUE NOT NULL, -- Human-readable order number (e.g., ORD-2024-001)
  payment_reference VARCHAR(100) UNIQUE NOT NULL, -- Paystack payment reference
  
  -- Customer information (stored in order for historical record)
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  
  -- Delivery address
  delivery_address_line1 VARCHAR(255) NOT NULL,
  delivery_address_line2 VARCHAR(255),
  delivery_city VARCHAR(100) NOT NULL,
  delivery_state VARCHAR(100) NOT NULL,
  delivery_postal_code VARCHAR(20) NOT NULL,
  delivery_country VARCHAR(100) NOT NULL DEFAULT 'Nigeria',
  delivery_note TEXT,
  
  -- Payment information
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('bank_transfer', 'card')),
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_amount DECIMAL(10, 2) NOT NULL CHECK (payment_amount >= 0),
  payment_currency VARCHAR(3) DEFAULT 'NGN',
  
  -- Order status
  order_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  
  user_id UUID, -- Can reference auth.users if you add authentication
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Order Items Table
-- ============================================
-- Stores individual products in each order
-- Stores product details at time of purchase for historical record
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Product references
  product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- Can be NULL if product is deleted
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL, -- Can be NULL if variant is deleted
  
  -- Product details at time of purchase (for historical record)
  product_name VARCHAR(255) NOT NULL,
  product_image_url TEXT,
  variant_color VARCHAR(50),
  variant_size VARCHAR(20),
  
  -- Pricing and quantity
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0), -- Price at time of purchase
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0), -- unit_price * quantity
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(payment_reference);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id) WHERE variant_id IS NOT NULL;

-- ============================================
-- Function to Generate Order Number
-- ============================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  year_prefix VARCHAR(4);
  sequence_num INTEGER;
  new_order_number VARCHAR(50);
BEGIN
  -- Get current year
  year_prefix := TO_CHAR(NOW(), 'YYYY');
  
  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM orders
  WHERE order_number LIKE 'ORD-' || year_prefix || '-%';
  
  -- Generate order number: ORD-YYYY-XXXXX (padded to 5 digits)
  new_order_number := 'ORD-' || year_prefix || '-' || LPAD(sequence_num::TEXT, 5, '0');
  
  NEW.order_number := new_order_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate order number
CREATE TRIGGER generate_orders_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_order_number();

-- ============================================
-- Trigger for Automatic Timestamp Updates
-- ============================================
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================
-- Enable RLS on orders and order_items tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Allow public to insert orders (for checkout)
CREATE POLICY "Allow public to create orders"
    ON orders FOR INSERT
    WITH CHECK (true);

-- Allow public to read their own orders (by email)
-- Note: For better security, you should add authentication and use user_id
CREATE POLICY "Allow public to read orders by email"
    ON orders FOR SELECT
    USING (true); -- For now, allow all reads. Restrict by email when you add authentication

-- Allow public to update order payment status
-- This is needed for Paystack webhook callbacks
CREATE POLICY "Allow public to update order payment status"
    ON orders FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Allow public to insert order items (when creating an order)
CREATE POLICY "Allow public to create order items"
    ON order_items FOR INSERT
    WITH CHECK (true);

-- Allow public to read order items for their orders
CREATE POLICY "Allow public to read order items"
    ON order_items FOR SELECT
    USING (true); -- For now, allow all reads. Restrict when you add authentication

-- ============================================
-- Helper View: Orders with Item Count
-- ============================================
CREATE OR REPLACE VIEW orders_with_summary AS
SELECT 
  o.*,
  COUNT(oi.id) as item_count,
  SUM(oi.subtotal) as items_subtotal
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;

