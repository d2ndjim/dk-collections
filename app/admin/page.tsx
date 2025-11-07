import { Suspense } from 'react'
import { getProducts } from '@/lib/actions/products'
import { ProductTableClient } from '@/components/admin/ProductTableClient'
import { AddProductDialog } from '@/components/admin/AddProductDialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package } from 'lucide-react'
import { deleteProduct } from '@/lib/actions/products'
import { revalidatePath } from 'next/cache'
import { Skeleton } from '@/components/ui/skeleton'

async function ProductManagement() {
  const [allProducts, clothesProducts, shoesProducts, accessoriesProducts] = await Promise.all([
    getProducts(),
    getProducts('clothes'),
    getProducts('shoes'),
    getProducts('accessories'),
  ])

  async function handleDelete(id: string) {
    'use server'
    await deleteProduct(id)
    revalidatePath('/admin')
  }

  async function handleRefresh() {
    'use server'
    revalidatePath('/admin')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
          <p className="text-muted-foreground">
            Manage your inventory of clothes, shoes, and accessories
          </p>
        </div>
        <AddProductDialog />
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Products</TabsTrigger>
          <TabsTrigger value="clothes">Clothes</TabsTrigger>
          <TabsTrigger value="shoes">Shoes</TabsTrigger>
          <TabsTrigger value="accessories">Accessories</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <ProductTableClient
            products={allProducts.data || []}
            onDelete={handleDelete}
            onUpdate={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="clothes" className="space-y-4">
          <ProductTableClient
            products={clothesProducts.data || []}
            onDelete={handleDelete}
            onUpdate={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="shoes" className="space-y-4">
          <ProductTableClient
            products={shoesProducts.data || []}
            onDelete={handleDelete}
            onUpdate={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="accessories" className="space-y-4">
          <ProductTableClient
            products={accessoriesProducts.data || []}
            onDelete={handleDelete}
            onUpdate={handleRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatsCard() {
  return (
    <div className="grid gap-4 md:grid-cols-3 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Products</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Suspense fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-9 w-64 mb-2" />
              <Skeleton className="h-5 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      }>
        <StatsCard />
        <ProductManagement />
      </Suspense>
    </div>
  )
}

