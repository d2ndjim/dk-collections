# Supabase Storage Setup

To enable image uploads for products, you need to set up a storage bucket in Supabase.

## Important: Fix RLS Policies First

Before uploading images, make sure you've run the second migration (`002_add_admin_policies.sql`) to allow INSERT operations on products and related tables.

## Steps:

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Click on "Storage" in the left sidebar

2. **Create a new bucket**
   - Click "New bucket"
   - Name: `product-images`
   - Make it **Public** (so images can be accessed via URL)
   - Click "Create bucket"

3. **Set up bucket policies (REQUIRED)**
   - Go to "Policies" tab for the `product-images` bucket
   - Click "New Policy" and add these policies using the UI:

   **For public read access (SELECT):**
   - Policy name: `Enable read access for all users`
   - Allowed operation: Select **SELECT**
   - Target roles: Leave as default (public)
   - USING expression: `bucket_id = 'product-images'`
   - Click "Review" then "Save policy"

   **For public upload access (INSERT) - REQUIRED:**
   - Policy name: `Enable insert access for all users`
   - Allowed operation: Select **INSERT**
   - Target roles: Leave as default (public)
   - WITH CHECK expression: `bucket_id = 'product-images'`
   - Click "Review" then "Save policy"

   **For public delete access (DELETE) - Optional:**
   - Policy name: `Enable delete access for all users`
   - Allowed operation: Select **DELETE**
   - Target roles: Leave as default (public)
   - USING expression: `bucket_id = 'product-images'`
   - Click "Review" then "Save policy"

   **Important Notes:**
   - Make sure the bucket name `product-images` matches exactly (case-sensitive)
   - For SELECT and DELETE, use the "USING expression" field
   - For INSERT, use the "WITH CHECK expression" field
   - For production, you should restrict INSERT/DELETE to authenticated admin users only

## File Structure:

Images will be stored at: `products/{product-slug}-{timestamp}.{ext}`

Example: `products/classic-white-tshirt-1234567890.jpg`
