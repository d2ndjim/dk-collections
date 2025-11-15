"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface DeleteAllProductsDialogProps {
  onConfirm: () => Promise<{ success: boolean; deletedCount?: number }>;
  productCount: number;
}

export function DeleteAllProductsDialog({
  onConfirm,
  productCount,
}: DeleteAllProductsDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      const result = await onConfirm();
      if (result?.success) {
        toast.success(`Successfully deleted ${result.deletedCount || productCount} products`);
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to delete all products", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={productCount === 0}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete All Products
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete All Products?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all {productCount} products, their variants, and images.
            This action cannot be undone. Are you absolutely sure?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete All"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

