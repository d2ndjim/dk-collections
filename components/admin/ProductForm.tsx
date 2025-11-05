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
import { createProduct, updateProduct, getCategories } from '@/lib/actions/products'
import { slugify } from '@/lib/utils'
import { toast } from 'sonner'

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

      if (isEditing && product) {
        const { error } = await updateProduct(product.id, formData)
        if (error) {
          toast.error('Failed to update product', {
            description: error.message || 'Please try again',
          })
          return
        }
        toast.success('Product updated successfully')
      } else {
        const { error } = await createProduct(formData)
        if (error) {
          toast.error('Failed to create product', {
            description: error.message || 'Please try again',
          })
          return
        }
        toast.success('Product created successfully')
      }
      await onSuccess()
    } catch (error) {
      toast.error('An error occurred', {
        description: 'Something went wrong. Please try again.',
      })
    } finally {
      setIsLoading(false)
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

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="product_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
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
                  onValueChange={field.onChange}
                  defaultValue={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
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
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

