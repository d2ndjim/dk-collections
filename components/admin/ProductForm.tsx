"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
  deleteProductImage,
  syncProductVariants,
} from "@/lib/actions/products";
import { uploadProductImageClient } from "@/lib/utils/storage";
import { slugify } from "@/lib/utils";
import {
  generateSKU,
  hasDuplicateVariants,
  getDuplicateVariants,
  hasStockAvailable,
  hasUniqueSKUs,
  getDuplicateSKUs,
  detectVariantChanges,
} from "@/lib/utils/variant-utils";
import { toast } from "sonner";
import { ImageIcon, X, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { ColorPicker } from "@/components/ui/color-picker";

const variantSchema = z.object({
  id: z.string().optional(),
  color: z.string().min(1, "Color is required"),
  color_code: z.string().optional(),
  sizes: z
    .array(
      z.object({
        size: z.string().min(1, "Size is required"),
        stock: z.coerce.number().min(0, "Stock must be 0 or greater"),
        sku: z.string().optional(),
      }),
    )
    .min(1, "At least one size is required"),
  images: z.array(z.instanceof(File)).optional(),
  existingImages: z.array(z.string()).optional(), // URLs of existing images
});

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
  variants: z.array(variantSchema).min(1, "At least one variant is required"),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: ProductWithDetails | null;
  onSuccess: () => void | Promise<void>;
  onCancel: () => void;
}

export function ProductForm({
  product,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!product;

  // Track object URLs for file previews to prevent memory leaks
  const objectUrlMapRef = useRef<Map<File, string>>(new Map());
  
  // Track original variants for change detection
  const originalVariantsRef = useRef(product?.product_variants || []);

  // Initialize variants from product or empty
  const initialVariants = product?.product_variants?.length
    ? product.product_variants.reduce(
        (acc, variant) => {
          const color = variant.color || "Default";
          const existingVariant = acc.find((v) => v.color === color);

          if (existingVariant) {
            existingVariant.sizes.push({
              size: variant.size || "",
              stock: variant.stock || 0,
              sku: variant.sku || "",
            });
          } else {
            const variantImages =
              product.product_images?.filter(
                (img) => img.variant_id === variant.id,
              ) || [];

            acc.push({
              id: variant.id,
              color,
              color_code: variant.color_code || "",
              sizes: [
                {
                  size: variant.size || "",
                  stock: variant.stock || 0,
                  sku: variant.sku || "",
                },
              ],
              images: [],
              existingImages: variantImages.map((img) => img.image_url),
            });
          }
          return acc;
        },
        [] as Array<{
          id?: string;
          color: string;
          color_code: string;
          sizes: Array<{ size: string; stock: number; sku: string }>;
          images: File[];
          existingImages: string[];
        }>,
      )
    : [
        {
          color: "",
          color_code: "",
          sizes: [{ size: "", stock: 0, sku: "" }],
          images: [],
          existingImages: [],
        },
      ];

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
      variants: initialVariants,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await getCategories();
      if (data) {
        setCategories(data);
      }
    }
    fetchCategories();
  }, []);

  // Helper function to get or create object URL for a file
  const getObjectUrl = (file: File): string => {
    const map = objectUrlMapRef.current;
    if (!map.has(file)) {
      const url = URL.createObjectURL(file);
      map.set(file, url);
    }
    return map.get(file)!;
  };

  // Cleanup: Revoke all object URLs on unmount
  useEffect(() => {
    return () => {
      const map = objectUrlMapRef.current;
      map.forEach((url) => URL.revokeObjectURL(url));
      map.clear();
    };
  }, []);

  const generateSlug = (name: string) => {
    form.setValue("slug", slugify(name));
  };

  const addVariant = () => {
    append({
      color: "",
      color_code: "",
      sizes: [{ size: "", stock: 0, sku: "" }],
      images: [],
      existingImages: [],
    });
  };

  const removeVariant = (variantIndex: number) => {
    // Clean up object URLs for all images in this variant
    const images = form.getValues(`variants.${variantIndex}.images`) || [];
    const map = objectUrlMapRef.current;
    images.forEach((file: File) => {
      const url = map.get(file);
      if (url) {
        URL.revokeObjectURL(url);
        map.delete(file);
      }
    });
    remove(variantIndex);
  };

  const addSizeToVariant = (variantIndex: number) => {
    const sizes = form.getValues(`variants.${variantIndex}.sizes`);
    form.setValue(`variants.${variantIndex}.sizes`, [
      ...sizes,
      { size: "", stock: 0, sku: "" },
    ]);
  };

  const removeSizeFromVariant = (variantIndex: number, sizeIndex: number) => {
    const sizes = form.getValues(`variants.${variantIndex}.sizes`);
    if (sizes.length > 1) {
      form.setValue(
        `variants.${variantIndex}.sizes`,
        sizes.filter((_, i) => i !== sizeIndex),
      );
    }
  };

  const handleImageUpload = (
    variantIndex: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    const currentImages =
      form.getValues(`variants.${variantIndex}.images`) || [];
    form.setValue(`variants.${variantIndex}.images`, [
      ...currentImages,
      ...files,
    ]);
  };

  const removeImage = (variantIndex: number, imageIndex: number) => {
    const images = form.getValues(`variants.${variantIndex}.images`) || [];
    const fileToRemove = images[imageIndex];

    // Revoke object URL if it exists
    if (fileToRemove) {
      const map = objectUrlMapRef.current;
      const url = map.get(fileToRemove);
      if (url) {
        URL.revokeObjectURL(url);
        map.delete(fileToRemove);
      }
    }

    form.setValue(
      `variants.${variantIndex}.images`,
      images.filter((_, i) => i !== imageIndex),
    );
  };

  const removeExistingImage = async (
    variantIndex: number,
    imageUrl: string,
  ) => {
    if (!product) return;

    const image = product.product_images?.find(
      (img) => img.image_url === imageUrl,
    );
    if (image) {
      const { error } = await deleteProductImage(image.id);
      if (error) {
        toast.error("Failed to delete image");
        return;
      }
    }

    const existingImages =
      form.getValues(`variants.${variantIndex}.existingImages`) || [];
    form.setValue(
      `variants.${variantIndex}.existingImages`,
      existingImages.filter((url) => url !== imageUrl),
    );
    toast.success("Image deleted");
  };

  const onSubmit = async (values: ProductFormValues) => {
    setIsLoading(true);
    
    try {
      // Validation: Check for duplicate color+size combinations
      if (hasDuplicateVariants(values.variants)) {
        const duplicates = getDuplicateVariants(values.variants);
        toast.error("Duplicate variants detected", {
          description: `Found duplicate combinations: ${duplicates.map(d => `${d.color} - ${d.size}`).join(", ")}`,
        });
        setIsLoading(false);
        return;
      }

      // Validation: Check for duplicate SKUs
      if (!hasUniqueSKUs(values.variants)) {
        const duplicates = getDuplicateSKUs(values.variants);
        toast.error("Duplicate SKUs detected", {
          description: `SKUs must be unique: ${duplicates.join(", ")}`,
        });
        setIsLoading(false);
        return;
      }

      // Warning: Check if any variant has stock
      if (!hasStockAvailable(values.variants)) {
        toast.warning("No stock available", {
          description: "All variants have 0 stock. Product won't be purchasable.",
        });
      }

      // Remove variants from formData before sending to create/update product
      const { variants, ...productData } = values;
      const formData = {
        ...productData,
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
      }

      // Store sync results for later use in image uploads
      let createdVariants: any[] = [];
      let updatedVariants: any[] = [];

      // Process variants using batch operations and change detection
      if (isEditing && product) {
        // Use change detection for updates
        const changes = detectVariantChanges(
          originalVariantsRef.current,
          values.variants
        );

        // Prepare variants for batch operations
        const variantsToCreate = changes.toCreate.map((v) => ({
          product_id: productId,
          color: v.color,
          color_code: v.color_code || undefined,
          size: v.size,
          stock: v.stock,
          sku: v.sku || generateSKU(values.slug, v.color, v.size),
          is_available: true,
        }));

        const variantsToUpdate = changes.toUpdate.map((v) => ({
          id: v.id!,
          product_id: productId,
          color: v.color,
          color_code: v.color_code || undefined,
          size: v.size,
          stock: v.stock,
          sku: v.sku || generateSKU(values.slug, v.color, v.size),
          is_available: true,
        }));

        const variantsToDelete = changes.toDelete.map((v) => v.id);

        // Use syncProductVariants for atomic operation
        const { data: syncResult, error: syncError } = await syncProductVariants(
          productId,
          {
            toCreate: variantsToCreate,
            toUpdate: variantsToUpdate,
            toDelete: variantsToDelete,
          }
        );

        if (syncError) {
          toast.error("Failed to sync variants", {
            description: syncError.message || "Some variants may not have been saved",
          });
          setIsLoading(false);
          return;
        }

        // Store created and updated variants for image uploads
        createdVariants = syncResult?.created || [];
        updatedVariants = syncResult?.updated || [];

        // Log sync results
        console.log("Variant sync results:", {
          created: createdVariants.length,
          updated: updatedVariants.length,
          deleted: syncResult?.deleted.length || 0,
        });

        toast.success("Product updated successfully", {
          description: `${createdVariants.length} created, ${updatedVariants.length} updated, ${syncResult?.deleted.length || 0} deleted`,
        });
      } else {
        // For new products, create all variants
        const variantsToCreate = [];
        
        for (const variant of variants) {
          for (const size of variant.sizes) {
            variantsToCreate.push({
              product_id: productId,
              color: variant.color,
              color_code: variant.color_code || undefined,
              size: size.size,
              stock: size.stock,
              sku: size.sku || generateSKU(values.slug, variant.color, size.size),
              is_available: true,
            });
          }
        }

        const { data: syncResult, error: syncError } = await syncProductVariants(
          productId,
          {
            toCreate: variantsToCreate,
            toUpdate: [],
            toDelete: [],
          }
        );

        if (syncError) {
          toast.error("Failed to create variants", {
            description: syncError.message || "Product created but variants failed",
          });
          setIsLoading(false);
          return;
        }

        // Store created variants for image uploads
        createdVariants = syncResult?.created || [];

        toast.success("Product created successfully", {
          description: `Created with ${createdVariants.length} variants`,
        });
      }

      // Process images for variants
      // Note: Image handling remains sequential as uploads can't be easily batched
      for (let variantIndex = 0; variantIndex < variants.length; variantIndex++) {
        const variant = variants[variantIndex];
        const imagesToUpload = variant.images || [];

        if (imagesToUpload.length === 0) continue;

        // Find the variant ID
        let variantId: string | undefined;
        
        if (variant.id) {
          // Existing variant - use the ID from the form
          variantId = variant.id;
        } else {
          // New variant - find it in the created variants
          // Match by color and first size (since form groups by color)
          const firstSize = variant.sizes[0]?.size;
          const createdVariant = createdVariants.find(
            (v) => v.color === variant.color && v.size === firstSize
          );
          variantId = createdVariant?.id;
        }

        if (!variantId) {
          console.warn(`Could not find variant ID for ${variant.color}`, {
            variantColor: variant.color,
            firstSize: variant.sizes[0]?.size,
            createdVariants,
          });
          continue;
        }

        for (let imgIndex = 0; imgIndex < imagesToUpload.length; imgIndex++) {
          const imageFile = imagesToUpload[imgIndex];
          try {
            const { url, error: uploadError } = await uploadProductImageClient(
              imageFile,
              `${values.slug}-${variant.color}-${Date.now()}-${imgIndex}`,
            );

            if (uploadError || !url) {
              toast.error(`Failed to upload image ${imgIndex + 1}`);
              continue;
            }

            const { error: imageError } = await createProductImage({
              product_id: productId,
              variant_id: variantId,
              image_url: url,
              alt_text: `${values.name} - ${variant.color}`,
              is_primary: imgIndex === 0 && variantIndex === 0,
              display_order: imgIndex,
            });

            if (imageError) {
              toast.error(`Failed to save image ${imgIndex + 1}`);
            }
          } catch (error) {
            console.error(`Failed to process image ${imgIndex + 1}`, error);
            toast.error(`Failed to process image ${imgIndex + 1}`);
          }
        }
      }

      await onSuccess();
    } catch (error) {
      console.error("Error in onSubmit:", error);
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
                <FormLabel>Price</FormLabel>
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
                        e.target.value ? parseFloat(e.target.value) : null,
                      )
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

        {/* Variants Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Product Variants</h3>
              <p className="text-sm text-muted-foreground">
                Add color variants with sizes and stock
              </p>
            </div>
            <Button type="button" onClick={addVariant} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Variant
            </Button>
          </div>

          {fields.map((field, variantIndex) => (
            <Card key={field.id} className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Variant {variantIndex + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariant(variantIndex)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`variants.${variantIndex}.color`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Black, White, Red"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`variants.${variantIndex}.color_code`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color Code</FormLabel>
                        <FormControl>
                          <ColorPicker
                            value={field.value || "#000000"}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormDescription>
                          Select a color using the color picker
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Sizes */}
                <div className="space-y-2">
                  <FormLabel>Sizes & Stock</FormLabel>
                  {form
                    .watch(`variants.${variantIndex}.sizes`)
                    .map((_, sizeIndex) => (
                      <div key={sizeIndex} className="flex gap-2 items-start">
                        <FormField
                          control={form.control}
                          name={`variants.${variantIndex}.sizes.${sizeIndex}.size`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Size (e.g., S, M, L, 40, 41)"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`variants.${variantIndex}.sizes.${sizeIndex}.stock`}
                          render={({ field }) => (
                            <FormItem className="w-32">
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  placeholder="Stock"
                                  onChange={(e) =>
                                    field.onChange(
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`variants.${variantIndex}.sizes.${sizeIndex}.sku`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="SKU (optional)"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {form.watch(`variants.${variantIndex}.sizes`).length >
                          1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              removeSizeFromVariant(variantIndex, sizeIndex)
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addSizeToVariant(variantIndex)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Size
                  </Button>
                </div>

                {/* Images */}
                <div className="space-y-2">
                  <FormLabel>Images</FormLabel>

                  {/* Existing Images */}
                  {form
                    .watch(`variants.${variantIndex}.existingImages`)
                    ?.map((imageUrl, imgIndex) => (
                      <div
                        key={imgIndex}
                        className="relative inline-block mr-2 mb-2"
                      >
                        <div className="relative w-24 h-24 border rounded-md overflow-hidden">
                          <Image
                            src={imageUrl}
                            alt={`Variant ${variantIndex + 1} image ${imgIndex + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() =>
                            removeExistingImage(variantIndex, imageUrl)
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}

                  {/* New Images Preview */}
                  {form
                    .watch(`variants.${variantIndex}.images`)
                    ?.map((file, imgIndex) => {
                      const previewUrl = getObjectUrl(file);
                      return (
                        <div
                          key={imgIndex}
                          className="relative inline-block mr-2 mb-2"
                        >
                          <div className="relative w-24 h-24 border rounded-md overflow-hidden">
                            <img
                              src={previewUrl}
                              alt={`Preview ${imgIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={() => removeImage(variantIndex, imgIndex)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}

                  <div>
                    <label className="flex items-center justify-center w-full max-w-xs h-32 border-2 border-dashed rounded-md hover:border-primary transition-colors cursor-pointer">
                      <div className="flex flex-col items-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">
                          Click to upload images
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          PNG, JPG up to 5MB
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleImageUpload(variantIndex, e)}
                          className="hidden"
                        />
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </Card>
          ))}
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
