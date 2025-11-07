'use server'

import { createClient } from '@/lib/supabase/server'

export async function uploadProductImage(
  fileData: {
    name: string
    type: string
    size: number
    data: string // base64 encoded string
  },
  productSlug: string
): Promise<{ url: string | null; error: Error | null }> {
  const supabase = await createClient()
  
  try {
    // Generate a unique filename
    const fileExt = fileData.name.split('.').pop()
    const fileName = `${productSlug}-${Date.now()}.${fileExt}`
    const filePath = `products/${fileName}`

    // Convert base64 to buffer
    const base64Data = fileData.data.split(',')[1] || fileData.data
    const buffer = Buffer.from(base64Data, 'base64')

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, buffer, {
        contentType: fileData.type,
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

