-- ============================================
-- Update Product Images for Color-Specific Images
-- ============================================
-- This migration adds a color field to product_images
-- to support multiple images per color variant
-- ============================================

-- Add color field to product_images table
ALTER TABLE product_images 
ADD COLUMN IF NOT EXISTS color VARCHAR(50);

-- Add color_code field for hex color representation
ALTER TABLE product_images 
ADD COLUMN IF NOT EXISTS color_code VARCHAR(7);

-- Add index for filtering images by color
CREATE INDEX IF NOT EXISTS idx_images_color ON product_images(product_id, color);

-- Update the RLS policies (already exist from previous migration, no changes needed)

-- ============================================
-- Comments for clarity
-- ============================================
COMMENT ON COLUMN product_images.color IS 'Color name associated with this image (e.g., "Black", "White")';
COMMENT ON COLUMN product_images.color_code IS 'Hex color code for UI display (e.g., "#000000")';

