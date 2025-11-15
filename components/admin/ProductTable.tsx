'use client'

import { useState } from 'react'
import { ProductWithDetails } from '@/lib/types/database'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { DeleteProductDialog } from './DeleteProductDialog'
import { ProductForm } from './ProductForm'
import Image from 'next/image'

interface ProductTableProps {
  products: ProductWithDetails[]
  onDelete: (id: string) => void
  onUpdate: () => void
}

export function ProductTable({ products, onDelete, onUpdate }: ProductTableProps) {
  const [editingProduct, setEditingProduct] = useState<ProductWithDetails | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<ProductWithDetails | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleEdit = (product: ProductWithDetails) => {
    setEditingProduct(product)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (product: ProductWithDetails) => {
    setDeletingProduct(product)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (deletingProduct) {
      await onDelete(deletingProduct.id)
      setIsDeleteDialogOpen(false)
      setDeletingProduct(null)
    }
  }

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false)
    setEditingProduct(null)
    onUpdate()
  }

  const getProductTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'clothes':
        return 'default'
      case 'shoes':
        return 'secondary'
      case 'accessories':
        return 'outline'
      default:
        return 'default'
    }
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No products found. Add your first product to get started.
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Colors</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const totalStock = product.product_variants?.reduce(
                (sum, variant) => sum + (variant.stock || 0),
                0
              ) || 0
              
              // Get unique colors from variants
              const colors = Array.from(
                new Set(
                  product.product_variants
                    ?.filter((v) => v.color)
                    .map((v) => v.color) || []
                )
              )
              
              // Get primary image or first image
              const primaryImage =
                product.product_images?.find((img) => img.is_primary) ||
                product.product_images?.[0]
              const imageUrl =
                primaryImage?.image_url ||
                "https://via.placeholder.com/100x100?text=No+Image"
              
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="relative w-16 h-16 rounded-md overflow-hidden border">
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant={getProductTypeBadgeVariant(product.product_type)}>
                      {product.product_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {product.categories?.name || 'Uncategorized'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {colors.length > 0 ? (
                        colors.map((color, idx) => {
                          const variant = product.product_variants?.find(
                            (v) => v.color === color
                          )
                          return (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                              style={{
                                backgroundColor: variant?.color_code
                                  ? `${variant.color_code}20`
                                  : undefined,
                                borderColor: variant?.color_code || undefined,
                              }}
                            >
                              {color}
                            </Badge>
                          )
                        })
                      ) : (
                        <span className="text-xs text-muted-foreground">No colors</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(product.price)}</TableCell>
                  <TableCell>
                    <span className={totalStock < 10 ? 'text-destructive font-semibold' : ''}>
                      {totalStock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? 'default' : 'secondary'}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {product.is_featured && (
                      <Badge variant="outline" className="ml-2">
                        Featured
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information below.
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <ProductForm
              product={editingProduct}
              onSuccess={handleEditSuccess}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setEditingProduct(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <DeleteProductDialog
        product={deletingProduct}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}

