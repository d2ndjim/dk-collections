'use client'

import { createClient } from '@/lib/supabase/client'

export async function uploadProductImageClient(
  file: File,
  productSlug: string
): Promise<{ url: string | null; error: Error | null }> {
  const supabase = createClient()
  
  try {
    // Generate a unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${productSlug}-${Date.now()}.${fileExt}`
    const filePath = `products/${fileName}`

    // Upload to Supabase Storage directly from client
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error('Error uploading image:', error)
      return { url: null, error: new Error(error.message) }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return { url: urlData.publicUrl, error: null }
  } catch (error) {
    console.error('Error uploading image:', error)
    return { url: null, error: error instanceof Error ? error : new Error('Failed to upload image') }
  }
}

