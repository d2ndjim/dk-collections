-- ============================================
-- Add variant_id to product_images table
-- ============================================
-- This allows images to be linked to specific color variants
-- When a color is selected, the associated image can be displayed

-- Add variant_id column to product_images
ALTER TABLE product_images 
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_images_variant ON product_images(variant_id);

-- Update RLS policy if needed (keeping existing public read access)
-- The existing policy should still work, but we can add variant-specific queries if needed

