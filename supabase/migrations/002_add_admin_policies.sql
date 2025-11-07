-- ============================================
-- Add Admin Policies for Product Management
-- ============================================
-- This migration adds INSERT, UPDATE, and DELETE policies
-- for admin operations on products and related tables
-- ============================================

-- For development/testing: Allow all operations on products
-- NOTE: In production, you should restrict these to authenticated admin users
CREATE POLICY "Allow public insert on products"
    ON products FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on products"
    ON products FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public delete on products"
    ON products FOR DELETE
    USING (true);

-- Allow public operations on product_variants
CREATE POLICY "Allow public insert on product_variants"
    ON product_variants FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on product_variants"
    ON product_variants FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public delete on product_variants"
    ON product_variants FOR DELETE
    USING (true);

-- Allow public operations on product_images
CREATE POLICY "Allow public insert on product_images"
    ON product_images FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on product_images"
    ON product_images FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public delete on product_images"
    ON product_images FOR DELETE
    USING (true);

-- Allow public operations on categories
CREATE POLICY "Allow public insert on categories"
    ON categories FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on categories"
    ON categories FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public delete on categories"
    ON categories FOR DELETE
    USING (true);

