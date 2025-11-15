"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ProductWithDetails } from "@/lib/types/database";
import {
  createProduct,
  updateProduct,
  getCategories,
  createProductImage,
  createProductVariant,
  deleteProductVariant,
  deleteProductImage,
} from "@/lib/actions/products";
import { uploadProductImageClient } from "@/lib/utils/storage";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VariantManager, ProductVariantInput } from "./VariantManager";
import { ColorImageManager, ColorImage } from "./ColorImageManager";
import { Separator } from "@/components/ui/separator";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  compare_at_price: z.coerce.number().min(0).optional().or(z.null()),
  category_id: z.string().optional().or(z.null()),
  product_type: z.enum(["clothes", "shoes", "accessories"]),
  brand: z.string().optional().or(z.null()),
  material: z.string().optional().or(z.null()),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormNewProps {
  product?: ProductWithDetails | null;
  onSuccess: () => void | Promise<void>;
  onCancel: () => void;
}

export function ProductFormNew({
  product,
  onSuccess,
  onCancel,
}: ProductFormNewProps) {
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [variants, setVariants] = useState<ProductVariantInput[]>([]);
  const [colorImages, setColorImages] = useState<ColorImage[]>([]);
  const isEditing = !!product;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: product?.name || "",
      slug: product?.slug || "",
      description: product?.description || "",
      price: product?.price || 0,
      compare_at_price: product?.compare_at_price || null,
      category_id: product?.category_id || null,
      product_type: product?.product_type || "clothes",
      brand: product?.brand || null,
      material: product?.material || null,
      is_featured: product?.is_featured || false,
      is_active: product?.is_active ?? true,
    },
  });

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await getCategories();
      if (data) {
        setCategories(data);
      }
    }
    fetchCategories();

    // Load existing variants if editing
    if (product?.product_variants) {
      setVariants(
        product.product_variants.map((v) => ({
          id: v.id,
          size: v.size || "",
          color: v.color || "",
          color_code: v.color_code || "#000000",
          stock: v.stock || 0,
          sku: v.sku || "",
          price_override: v.price_override || undefined,
        }))
      );
    }

    // Load existing images if editing
    if (product?.product_images) {
      setColorImages(
        product.product_images.map((img) => ({
          id: img.id,
          color: img.color || "",
          color_code: img.color_code || "#000000",
          image_url: img.image_url,
          is_primary: img.is_primary,
        }))
      );
    }
  }, [product]);

  const generateSlug = (name: string) => {
    form.setValue("slug", slugify(name));
  };

  const getUniqueColors = () => {
    const uniqueColors = new Map();
    variants.forEach((v) => {
      if (v.color && !uniqueColors.has(v.color)) {
        uniqueColors.set(v.color, v.color_code);
      }
    });
    return Array.from(uniqueColors.entries()).map(([color, color_code]) => ({
      color,
      color_code,
    }));
  };

  const onSubmit = async (values: ProductFormValues) => {
    setIsLoading(true);
    try {
      // Validate that we have variants
      if (variants.length === 0) {
        toast.error("Please add at least one variant");
        setIsLoading(false);
        return;
      }

      // Convert null to undefined for server actions
      const formData = {
        ...values,
        compare_at_price: values.compare_at_price ?? undefined,
        category_id: values.category_id ?? undefined,
        brand: values.brand || undefined,
        material: values.material || undefined,
        description: values.description || undefined,
      };

      let productId: string;

      if (isEditing && product) {
        const { data, error } = await updateProduct(product.id, formData);
        if (error) {
          toast.error("Failed to update product", {
            description: error.message || "Please try again",
          });
          setIsLoading(false);
          return;
        }
        productId = product.id;
        toast.success("Product updated successfully");

        // Delete old variants and images to recreate them
        if (product.product_variants) {
          await Promise.all(
            product.product_variants.map((v) => deleteProductVariant(v.id))
          );
        }
        if (product.product_images) {
          await Promise.all(
            product.product_images.map((img) => deleteProductImage(img.id))
          );
        }
      } else {
        const { data, error } = await createProduct(formData);
        if (error) {
          toast.error("Failed to create product", {
            description: error.message || "Please try again",
          });
          setIsLoading(false);
          return;
        }
        if (!data) {
          toast.error("Failed to create product", {
            description: "Product was created but no data was returned",
          });
          setIsLoading(false);
          return;
        }
        productId = data.id;
        toast.success("Product created successfully");
      }

      // Create variants
      const variantPromises = variants.map((variant) =>
        createProductVariant({
          product_id: productId,
          size: variant.size,
          color: variant.color,
          color_code: variant.color_code,
          stock: variant.stock,
          sku: variant.sku,
          price_override: variant.price_override,
          is_available: true,
        })
      );

      const variantResults = await Promise.all(variantPromises);
      const failedVariants = variantResults.filter((r) => r.error);
      if (failedVariants.length > 0) {
        toast.error(`Failed to create ${failedVariants.length} variant(s)`);
      }

      // Upload images and create image records
      let uploadedCount = 0;
      for (let i = 0; i < colorImages.length; i++) {
        const img = colorImages[i];
        let imageUrl = img.image_url;

        // Upload if it's a new file
        if (img.file) {
          const { url, error: uploadError } = await uploadProductImageClient(
            img.file,
            `${values.slug}-${img.color}-${i}`
          );

          if (uploadError || !url) {
            toast.error(`Failed to upload image for ${img.color}`);
            continue;
          }
          imageUrl = url;
        }

        if (imageUrl) {
          const { error: imageError } = await createProductImage({
            product_id: productId,
            image_url: imageUrl,
            alt_text: `${values.name} - ${img.color}`,
            is_primary: img.is_primary || false,
            display_order: i,
            color: img.color,
            color_code: img.color_code,
          });

          if (!imageError) {
            uploadedCount++;
          }
        }
      }

      if (uploadedCount > 0) {
        toast.success(`Uploaded ${uploadedCount} image(s)`);
      }

      await onSuccess();
    } catch (error) {
      toast.error("An error occurred", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="variants">Variants & Stock</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
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
                          field.onChange(e);
                          if (!isEditing) {
                            generateSlug(e.target.value);
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                        field.onChange(value === "none" ? null : value);
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
                    <FormLabel>Price (₦)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
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
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Original price for sale items
                    </FormDescription>
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
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="Brand name"
                      />
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
                        value={field.value || ""}
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
          </TabsContent>

          <TabsContent value="variants" className="space-y-4">
            <VariantManager variants={variants} onChange={setVariants} />
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            <ColorImageManager
              colorImages={colorImages}
              availableColors={getUniqueColors()}
              onChange={setColorImages}
            />
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Saving..."
              : isEditing
                ? "Update Product"
                : "Create Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

