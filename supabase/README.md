# Database Setup Instructions

## Running the Migration

To create all the database tables in your Supabase project:

1. **Open Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration**
   - Copy the entire contents of `migrations/001_initial_schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)

4. **Verify Tables Created**
   - Go to "Table Editor" in the left sidebar
   - You should see the following tables:
     - `categories`
     - `products`
     - `product_variants`
     - `product_images`

## Tables Overview

### `categories`

Stores product categories (e.g., Men's, Women's, Kids)

### `products`

Main table for all products (clothes, shoes, accessories)

- Includes pricing, descriptions, brand info
- Has `product_type` field to distinguish between clothes/shoes/accessories

### `product_variants`

Stores variations of products (sizes, colors, stock levels, SKUs)

### `product_images`

Stores image URLs for each product

## Row Level Security (RLS)

All tables have RLS enabled with public read access policies. This means:

- ✅ Anyone can read/view products (for your store frontend)
- ❌ Only authenticated users can insert/update/delete (you'll need to add policies for admin access later)

## TypeScript Types

Type definitions are available in `lib/types/database.ts` for use in your Next.js application.

## Additional Migrations

After running the initial schema, you also need to run:

### `002_add_admin_policies.sql`

This migration adds INSERT, UPDATE, and DELETE policies to allow admin operations.

**To run:**

1. Go to SQL Editor in Supabase Dashboard
2. Copy the contents of `migrations/002_add_admin_policies.sql`
3. Paste and run it

**Note:** These policies allow public write access for development. In production, you should restrict these to authenticated admin users.

## Next Steps

1. Run the admin policies migration (`002_add_admin_policies.sql`)
2. Set up Supabase Storage bucket (see `STORAGE_SETUP.md`)
3. Insert some sample categories and products
4. Create API routes or server components to fetch products
5. Build your product listing pages
