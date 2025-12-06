"use client";

import { useRouter } from "next/navigation";
import { ProductTable } from "./ProductTable";
import { ProductWithDetails } from "@/lib/types/database";

interface ProductTableClientProps {
  products: ProductWithDetails[];
  onDelete: (id: string) => Promise<void>;
}

export function ProductTableClient({
  products,
  onDelete,
}: ProductTableClientProps) {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    await onDelete(id);
    router.refresh();
  };

  const handleUpdate = () => {
    router.refresh();
  };

  return (
    <ProductTable
      products={products}
      onDelete={handleDelete}
      onUpdate={handleUpdate}
    />
  );
}
