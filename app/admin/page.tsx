import { Suspense } from "react";
import {
  getProducts,
  deleteProduct,
  deleteAllProducts,
} from "@/lib/actions/products";
import { ProductTabs } from "@/components/admin/ProductTabs";
import { AddProductDialog } from "@/components/admin/AddProductDialog";
import { DeleteAllProductsDialog } from "@/components/admin/DeleteAllProductsDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, AlertCircle } from "lucide-react";
import { revalidatePath } from "next/cache";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminLayout } from "@/components/admin/AdminLayout";

async function ProductManagement() {
  const [allProducts, clothesProducts, shoesProducts, accessoriesProducts] =
    await Promise.all([
      getProducts(),
      getProducts("clothes"),
      getProducts("shoes"),
      getProducts("accessories"),
    ]);

  async function handleDelete(id: string) {
    "use server";
    await deleteProduct(id);
    revalidatePath("/admin");
  }

  async function handleRefresh() {
    "use server";
    revalidatePath("/admin");
  }

  async function handleDeleteAll() {
    "use server";
    const { error, deletedCount } = await deleteAllProducts();
    if (error) {
      throw new Error(error.message || "Failed to delete all products");
    }
    revalidatePath("/admin");
    return { success: true, deletedCount };
  }

  const totalProductCount = allProducts.data?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Product Management
          </h1>
          <p className="text-muted-foreground">
            Manage your inventory of clothes, shoes, and accessories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DeleteAllProductsDialog
            onConfirm={handleDeleteAll}
            productCount={totalProductCount}
          />
          <AddProductDialog />
        </div>
      </div>

      <ProductTabs
        allProducts={allProducts.data || []}
        clothesProducts={clothesProducts.data || []}
        shoesProducts={shoesProducts.data || []}
        accessoriesProducts={accessoriesProducts.data || []}
        onDelete={handleDelete}
        onUpdate={handleRefresh}
      />
    </div>
  );
}

async function StatsCards() {
  const { data: products } = await getProducts();

  const totalProducts = products?.length || 0;
  const activeProducts = products?.filter((p) => p.is_active).length || 0;

  // Calculate low stock products (total stock across variants < 10)
  const lowStockProducts =
    products?.filter((product) => {
      const totalStock =
        product.product_variants?.reduce(
          (sum: number, variant: { stock?: number }) =>
            sum + (variant.stock || 0),
          0,
        ) || 0;
      return totalStock > 0 && totalStock < 10;
    }).length || 0;

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProducts}</div>
          <p className="text-xs text-muted-foreground">
            All products in inventory
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Products</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeProducts}</div>
          <p className="text-xs text-muted-foreground">
            Available for purchase
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{lowStockProducts}</div>
          <p className="text-xs text-muted-foreground">
            Products with stock &lt; 10
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminLayout>
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-9 w-64 mb-2" />
                <Skeleton className="h-5 w-96" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        }
      >
        <StatsCards />
        <ProductManagement />
      </Suspense>
    </AdminLayout>
  );
}
