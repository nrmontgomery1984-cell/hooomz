-- Add product_image_url and manual_url columns to materials table
-- These fields will store automatically fetched product images and owner's manual links

ALTER TABLE materials
ADD COLUMN IF NOT EXISTS product_image_url TEXT,
ADD COLUMN IF NOT EXISTS manual_url TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_materials_product_image ON materials(product_image_url) WHERE product_image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_materials_manual ON materials(manual_url) WHERE manual_url IS NOT NULL;
