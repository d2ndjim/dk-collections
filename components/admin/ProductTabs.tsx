"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductTableClient } from "@/components/admin/ProductTableClient";
import { ProductWithDetails } from "@/lib/types/database";

interface ProductTabsProps {
  allProducts: ProductWithDetails[];
  clothesProducts: ProductWithDetails[];
  shoesProducts: ProductWithDetails[];
  accessoriesProducts: ProductWithDetails[];
  onDelete: (id: string) => Promise<void>;
  onUpdate: () => Promise<void>;
}

export function ProductTabs({
  allProducts,
  clothesProducts,
  shoesProducts,
  accessoriesProducts,
  onDelete,
  onUpdate,
}: ProductTabsProps) {
  return (
    <Tabs defaultValue="all" className="space-y-4">
      <TabsList>
        <TabsTrigger value="all">All Products</TabsTrigger>
        <TabsTrigger value="clothes">Clothes</TabsTrigger>
        <TabsTrigger value="shoes">Shoes</TabsTrigger>
        <TabsTrigger value="accessories">Accessories</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="space-y-4">
        <ProductTableClient
          products={allProducts}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      </TabsContent>

      <TabsContent value="clothes" className="space-y-4">
        <ProductTableClient
          products={clothesProducts}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      </TabsContent>

      <TabsContent value="shoes" className="space-y-4">
        <ProductTableClient
          products={shoesProducts}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      </TabsContent>

      <TabsContent value="accessories" className="space-y-4">
        <ProductTableClient
          products={accessoriesProducts}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      </TabsContent>
    </Tabs>
  );
}
