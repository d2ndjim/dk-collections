'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ProductWithDetails } from '@/lib/types/database'
import { createProduct, updateProduct, getCategories, createProductImage } from '@/lib/actions/products'
import { uploadProductImageClient } from '@/lib/utils/storage'
import { slugify } from '@/lib/utils'
import { toast } from 'sonner'
import { ImageIcon, X } from 'lucide-react'

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  compare_at_price: z.coerce.number().min(0).optional().or(z.null()),
  category_id: z.string().optional().or(z.null()),
  product_type: z.enum(['clothes', 'shoes', 'accessories']),
  brand: z.string().optional().or(z.null()),
  material: z.string().optional().or(z.null()),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  product?: ProductWithDetails | null
  onSuccess: () => void | Promise<void>
  onCancel: () => void
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(
    product?.product_images?.[0]?.image_url || null
  )
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const isEditing = !!product

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: product?.name || '',
      slug: product?.slug || '',
      description: product?.description || '',
      price: product?.price || 0,
      compare_at_price: product?.compare_at_price || null,
      category_id: product?.category_id || null,
      product_type: product?.product_type || 'clothes',
      brand: product?.brand || null,
      material: product?.material || null,
      is_featured: product?.is_featured || false,
      is_active: product?.is_active ?? true,
    },
  })

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await getCategories()
      if (data) {
        setCategories(data)
      }
    }
    fetchCategories()
  }, [])

  const generateSlug = (name: string) => {
    form.setValue('slug', slugify(name))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }

      setSelectedImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const onSubmit = async (values: ProductFormValues) => {
    setIsLoading(true)
    try {
      // Convert null to undefined for server actions
      const formData = {
        ...values,
        compare_at_price: values.compare_at_price ?? undefined,
        category_id: values.category_id ?? undefined,
        brand: values.brand || undefined,
        material: values.material || undefined,
        description: values.description || undefined,
      }

      let productId: string

      if (isEditing && product) {
        const { data, error } = await updateProduct(product.id, formData)
        if (error) {
          toast.error('Failed to update product', {
            description: error.message || 'Please try again',
          })
          return
        }
        productId = product.id
        toast.success('Product updated successfully')
      } else {
        const { data, error } = await createProduct(formData)
        if (error) {
          toast.error('Failed to create product', {
            description: error.message || 'Please try again',
          })
          return
        }
        if (!data) {
          toast.error('Failed to create product', {
            description: 'Product was created but no data was returned',
          })
          return
        }
        productId = data.id
        toast.success('Product created successfully')
      }

      // Upload image if one was selected
      if (selectedImage && productId) {
        setIsUploadingImage(true)
        
        try {
          // Upload directly from client to Supabase Storage
          const { url, error: uploadError } = await uploadProductImageClient(
            selectedImage,
            values.slug
          )
          
          if (uploadError || !url) {
            toast.error('Failed to upload image', {
              description: uploadError?.message || 'Please try uploading the image again',
            })
            setIsUploadingImage(false)
            return
          }

          // Create product image record
          const { error: imageError } = await createProductImage({
            product_id: productId,
            image_url: url,
            alt_text: values.name,
            is_primary: true,
            display_order: 0,
          })

          if (imageError) {
            toast.error('Failed to save image', {
              description: 'Image was uploaded but could not be linked to product',
            })
          } else {
            toast.success('Image uploaded successfully')
          }
        } catch (error) {
          toast.error('Failed to upload image', {
            description: 'An unexpected error occurred',
          })
        } finally {
          setIsUploadingImage(false)
        }
      }

      await onSuccess()
    } catch (error) {
      toast.error('An error occurred', {
        description: 'Something went wrong. Please try again.',
      })
    } finally {
      setIsLoading(false)
      setIsUploadingImage(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., Classic White T-Shirt"
                    onChange={(e) => {
                      field.onChange(e)
                      if (!isEditing) {
                        generateSlug(e.target.value)
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., classic-white-tshirt" />
                </FormControl>
                <FormDescription>
                  URL-friendly identifier (auto-generated from name)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Product description..."
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image Upload Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Product Image
          </label>
          <div className="flex flex-col gap-4">
            {imagePreview ? (
              <div className="relative w-full max-w-xs">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="w-full h-64 object-cover rounded-md border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full max-w-xs h-64 border-2 border-dashed rounded-md hover:border-primary transition-colors">
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload image
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 5MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Upload a product image. This will be displayed as the main product image.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="product_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="clothes">Clothes</SelectItem>
                    <SelectItem value="shoes">Shoes</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={(value) => {
                    // Convert "none" to null/undefined
                    field.onChange(value === "none" ? null : value)
                  }}
                  value={field.value || "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="compare_at_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Compare at Price (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) =>
                      field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                    }
                  />
                </FormControl>
                <FormDescription>Original price for sale items</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} placeholder="Brand name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="material"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Material</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ''}
                    placeholder="e.g., Cotton, Leather"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="is_featured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Featured</FormLabel>
                  <FormDescription>
                    Show this product as featured
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Active</FormLabel>
                  <FormDescription>
                    Make this product available for purchase
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || isUploadingImage}>
            {isLoading || isUploadingImage
              ? isUploadingImage
                ? 'Uploading Image...'
                : 'Saving...'
              : isEditing
                ? 'Update Product'
                : 'Create Product'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

