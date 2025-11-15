-- ============================================
-- Add Product Colorways & Color-Scoped Media
-- ============================================
-- This migration introduces a first-class colorway entity so that:
--   1. Each product can define rich color swatches with ordering
--   2. Variants can link directly to a colorway
--   3. Media (images) can be scoped to a specific colorway
-- ============================================

-- --------------------------------------------
-- Product Colorways Table
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS product_colorways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(160) NOT NULL,
  color_label VARCHAR(120),
  color_code VARCHAR(12) NOT NULL, -- e.g. #FF0000
  is_default BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (product_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_colorways_product ON product_colorways(product_id);
CREATE INDEX IF NOT EXISTS idx_colorways_default ON product_colorways(product_id, is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_colorways_display ON product_colorways(product_id, display_order);

-- Ensure updated_at stays fresh
CREATE TRIGGER update_product_colorways_updated_at
    BEFORE UPDATE ON product_colorways
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- --------------------------------------------
-- Link Variants To Colorways
-- --------------------------------------------
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS colorway_id UUID REFERENCES product_colorways(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_variants_colorway ON product_variants(colorway_id);

-- --------------------------------------------
-- Scope Images To Colorways
-- --------------------------------------------
ALTER TABLE product_images
  ADD COLUMN IF NOT EXISTS colorway_id UUID REFERENCES product_colorways(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_images_colorway ON product_images(colorway_id);

-- --------------------------------------------
-- RLS Policies
-- --------------------------------------------
ALTER TABLE product_colorways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on product_colorways"
    ON product_colorways FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on product_colorways"
    ON product_colorways FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on product_colorways"
    ON product_colorways FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public delete on product_colorways"
    ON product_colorways FOR DELETE
    USING (true);

