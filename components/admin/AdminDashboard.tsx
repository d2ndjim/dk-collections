"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Copy,
  Download,
  Droplet,
  Filter,
  Layers,
  Palette,
  Printer,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteProductDialog } from "@/components/admin/DeleteProductDialog";
import { AddProductDialog } from "@/components/admin/AddProductDialog";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductWithDetails } from "@/lib/types/database";
import { formatCurrency, cn, slugify } from "@/lib/utils";
import { toast } from "sonner";
import { deleteProduct } from "@/lib/actions/products";

type InventorySummary = {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  totalStockUnits: number;
  featuredProducts: number;
  inventoryValue: number;
  typeBreakdown: Record<string, number>;
  lowStockVariants: number;
};

const LOW_STOCK_THRESHOLD = 5;

const SIDENAV_LINKS = [
  { label: "Dashboard", isActive: false },
  { label: "Orders", isActive: false },
  { label: "Inventory", isActive: true },
  { label: "Payments", isActive: false },
  { label: "Customers", isActive: false },
  { label: "Settings", isActive: false },
];

export function AdminDashboard({ products }: { products: ProductWithDetails[] }) {
  const summary = useMemo(() => buildSummary(products), [products]);

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-slate-900">
      <div className="mx-auto flex max-w-[1600px] flex-col lg:flex-row">
        <aside className="bg-[#070b16] px-6 py-10 text-white lg:min-h-screen lg:w-64">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/50">Mate Admin</p>
              <h1 className="text-xl font-semibold">Collections</h1>
            </div>
            <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              v2.3
            </div>
          </div>
          <nav className="space-y-2">
            {SIDENAV_LINKS.map((link) => (
              <button
                key={link.label}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition",
                  link.isActive
                    ? "bg-white text-slate-900 shadow"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                )}
              >
                {link.label}
              </button>
            ))}
          </nav>
          <div className="mt-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/10 p-4 text-sm">
            <p className="mb-2 text-xs uppercase tracking-wide text-white/60">Storage</p>
            <p className="text-lg font-semibold">Supabase</p>
            <p className="text-white/70">
              Secure media uploads are available through the Supabase Storage bucket that powers the
              storefront.
            </p>
          </div>
        </aside>

        <div className="flex-1 bg-white/0">
          <header className="flex flex-col gap-4 border-b bg-white/80 px-6 py-4 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-slate-500">Inventory Overview</p>
              <h2 className="text-2xl font-semibold">Orders & Stock</h2>
            </div>
            <div className="flex flex-1 items-center gap-3 lg:max-w-xl">
              <div className="relative w-full">
                <Search className="text-slate-400 absolute left-3 top-2.5 h-4 w-4" />
                <Input className="pl-9" placeholder="Search products, SKU, colors..." />
              </div>
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="h-10 w-10 rounded-full bg-slate-900/80 text-center text-lg font-semibold text-white">
                OW
              </div>
            </div>
          </header>

          <main className="space-y-6 px-6 py-8">
            <DashboardSummary summary={summary} />
            <InventoryWorkspace products={products} summary={summary} />
          </main>
        </div>
      </div>
    </div>
  );
}

function DashboardSummary({ summary }: { summary: InventorySummary }) {
  const cards = [
    {
      title: "Inventory Value",
      value: formatCurrency(summary.inventoryValue),
      change: "+4.2%",
      icon: ShoppingBag,
      accent: "from-blue-500/20 to-blue-500/5",
    },
    {
      title: "Active SKUs",
      value: summary.activeProducts,
      change: `${summary.featuredProducts} featured`,
      icon: Layers,
      accent: "from-purple-500/20 to-purple-500/5",
    },
    {
      title: "Units On Hand",
      value: summary.totalStockUnits,
      change: `${summary.lowStockVariants} low stock`,
      icon: TrendingUp,
      accent: "from-emerald-500/20 to-emerald-500/5",
    },
    {
      title: "Low Stock Alerts",
      value: summary.lowStockProducts,
      change: "threshold < 5 units",
      icon: AlertTriangle,
      accent: "from-amber-500/20 to-amber-500/5",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ title, value, change, icon: Icon, accent }) => (
        <Card key={title} className="border-none bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
            <div className={cn("rounded-full p-2", `bg-gradient-to-br ${accent}`)}>
              <Icon className="h-4 w-4 text-slate-900" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function InventoryWorkspace({
  products,
  summary,
}: {
  products: ProductWithDetails[];
  summary: InventorySummary;
}) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<"all" | "clothes" | "shoes" | "accessories">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "low">("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(products[0]?.id ?? null);
  const [editingProduct, setEditingProduct] = useState<ProductWithDetails | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<ProductWithDetails | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) =>
        typeFilter === "all" ? true : product.product_type === typeFilter,
      )
      .filter((product) => {
        if (statusFilter === "all") return true;
        const stock = getProductStock(product);
        if (statusFilter === "low") return stock <= LOW_STOCK_THRESHOLD;
        return statusFilter === "active" ? product.is_active : !product.is_active;
      })
      .filter((product) => {
        if (!search) return true;
        const needle = search.toLowerCase();
        return (
          product.name.toLowerCase().includes(needle) ||
          product.slug.toLowerCase().includes(needle) ||
          (product.brand || "").toLowerCase().includes(needle)
        );
      });
  }, [products, typeFilter, statusFilter, search]);

  useEffect(() => {
    if (!filteredProducts.length) {
      setSelectedProductId(null);
      return;
    }

    if (!selectedProductId || !filteredProducts.some((p) => p.id === selectedProductId)) {
      setSelectedProductId(filteredProducts[0].id);
    }
  }, [filteredProducts, selectedProductId]);

  const selectedProduct =
    filteredProducts.find((product) => product.id === selectedProductId) ||
    filteredProducts[0] ||
    null;

  const allSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((product) => selectedIds.includes(product.id));

  const toggleRowSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredProducts.map((product) => product.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteProduct(deletingProduct.id);
      toast.success(`Deleted ${deletingProduct.name}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Unable to delete product", {
        description: "Please try again.",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setDeletingProduct(null);
    }
  };

  const handleEditSuccess = () => {
    setIsEditOpen(false);
    setEditingProduct(null);
    router.refresh();
  };

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-semibold">Products</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track stock by colorway, status, and inventory value
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" /> Export
                </Button>
                <AddProductDialog />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                variant={typeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter("all")}
              >
                All Types
              </Button>
              {["clothes", "shoes", "accessories"].map((type) => (
                <Button
                  key={type}
                  variant={typeFilter === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTypeFilter(type as typeof typeFilter)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
              <div className="flex flex-1 min-w-[200px] items-center gap-2">
                <Filter className="text-slate-400 h-4 w-4" />
                <select
                  className="h-9 flex-1 rounded-md border border-input bg-transparent px-3 text-sm"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                >
                  <option value="all">Status: All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="low">Low stock</option>
                </select>
              </div>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="text-slate-400 absolute left-3 top-2.5 h-4 w-4" />
                <Input
                  placeholder="Search products or SKU"
                  className="pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox checked={allSelected} onCheckedChange={(checked) => toggleSelectAll(!!checked)} />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Colors</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const stock = getProductStock(product);
                    const colorCount = getColorways(product).length;

                    return (
                      <TableRow
                        key={product.id}
                        className={cn(
                          "cursor-pointer transition",
                          selectedProductId === product.id && "bg-blue-50/70",
                        )}
                        onClick={() => setSelectedProductId(product.id)}
                      >
                        <TableCell onClick={(event) => event.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.includes(product.id)}
                            onCheckedChange={() => toggleRowSelection(product.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.slug}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getColorways(product)
                              .slice(0, 3)
                              .map((colorway) => (
                                <span
                                  key={colorway.slug}
                                  className="h-5 w-5 rounded-full border"
                                  title={colorway.name}
                                  style={{ backgroundColor: colorway.color_code }}
                                />
                              ))}
                            {colorCount > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{colorCount - 3}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{stock.toLocaleString()}</div>
                          <p className="text-xs text-muted-foreground">
                            {product.product_variants.length} variants
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.is_active ? "default" : "secondary"}>
                            {product.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {stock <= LOW_STOCK_THRESHOLD && (
                            <Badge variant="destructive" className="ml-2">
                              Low
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {new Intl.DateTimeFormat("en-US", {
                              month: "short",
                              day: "numeric",
                            }).format(new Date(product.updated_at))}
                          </p>
                        </TableCell>
                        <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingProduct(product);
                                setIsEditOpen(true);
                              }}
                            >
                              <Sparkles className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => {
                                setDeletingProduct(product);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!filteredProducts.length && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                        No products match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4 text-sm text-muted-foreground">
              <p>{selectedIds.length} selected</p>
              <div className="flex gap-2">
                <Button variant="ghost" className="gap-2">
                  <Printer className="h-4 w-4" /> Print
                </Button>
                <Button variant="ghost" className="gap-2">
                  <Copy className="h-4 w-4" /> Duplicate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="text-blue-600 h-5 w-5" />
                Stock Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Active vs Inactive</p>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{
                      width: `${(summary.activeProducts / Math.max(summary.totalProducts, 1)) * 100}%`,
                    }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>{summary.activeProducts} active</span>
                  <span>{summary.totalProducts - summary.activeProducts} inactive</span>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Droplet className="h-4 w-4 text-blue-500" />
                  <p className="text-sm font-medium">Stock by Category</p>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  {Object.entries(summary.typeBreakdown).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="capitalize text-muted-foreground">{type}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <ProductInspector
            product={selectedProduct}
            onEdit={() => {
              if (!selectedProduct) return;
              setEditingProduct(selectedProduct);
              setIsEditOpen(true);
            }}
          />
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[90vh] w-full max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product information, variants, and media.</DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <ProductForm
              product={editingProduct}
              onSuccess={handleEditSuccess}
              onCancel={() => {
                setIsEditOpen(false);
                setEditingProduct(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <DeleteProductDialog
        product={deletingProduct}
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingProduct(null);
            setIsDeleteDialogOpen(false);
          } else {
            setIsDeleteDialogOpen(true);
          }
        }}
        onConfirm={handleDeleteConfirm}
      />
      {isDeleting && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      )}
    </>
  );
}

function ProductInspector({
  product,
  onEdit,
}: {
  product: ProductWithDetails | null;
  onEdit: () => void;
}) {
  const [activeColorSlug, setActiveColorSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!product) {
      setActiveColorSlug(null);
      return;
    }
    const colorways = getColorways(product);
    const defaultColor =
      colorways.find((colorway) => colorway.is_default) || colorways[0] || null;
    setActiveColorSlug(defaultColor?.slug ?? null);
  }, [product]);

  if (!product) {
    return (
      <Card className="border-none shadow-sm">
        <CardContent className="py-10 text-center text-muted-foreground">
          Select a product to preview its colorways and stock.
        </CardContent>
      </Card>
    );
  }

  const colorways = getColorways(product);
  const activeColorway =
    colorways.find((colorway) => colorway.slug === activeColorSlug) || colorways[0] || null;
  const heroImage =
    product.product_images
      .filter((image) => image.colorway_id === activeColorway?.id)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .find((image) => image.is_primary) ||
    product.product_images.find((image) => !image.colorway_id) ||
    null;

  const variantsForColor = product.product_variants.filter((variant) => {
    if (activeColorway?.id) {
      return variant.colorway_id === activeColorway.id;
    }
    return !variant.colorway_id || variant.color === activeColorway?.name;
  });

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">{product.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{product.product_type}</p>
          </div>
          <Button size="sm" onClick={onEdit} className="gap-2">
            <Sparkles className="h-4 w-4" /> Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-square w-full rounded-2xl bg-slate-100">
          {heroImage ? (
            <img
              src={heroImage.image_url}
              alt={heroImage.alt_text || product.name}
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <Palette className="h-8 w-8" />
              <p className="mt-2 text-sm">No media yet</p>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground">Colorways</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {colorways.map((colorway) => (
              <button
                key={colorway.slug}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition",
                  activeColorway?.slug === colorway.slug
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
                onClick={() => setActiveColorSlug(colorway.slug)}
              >
                <span
                  className="h-4 w-4 rounded-full border"
                  style={{ backgroundColor: colorway.color_code }}
                />
                {colorway.name}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-medium">Variants</p>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            {variantsForColor.map((variant) => (
              <div
                key={variant.id}
                className="flex items-center justify-between rounded-lg bg-white px-3 py-2"
              >
                <span className="font-medium">{variant.size || variant.sku || "Variant"}</span>
                <Badge
                  variant={variant.stock <= LOW_STOCK_THRESHOLD ? "destructive" : "secondary"}
                >
                  {variant.stock} in stock
                </Badge>
              </div>
            ))}
            {!variantsForColor.length && (
              <p className="text-xs text-muted-foreground">
                No variants linked to this color yet.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function buildSummary(products: ProductWithDetails[]): InventorySummary {
  const totalProducts = products.length;
  const activeProducts = products.filter((product) => product.is_active).length;
  const totalStockUnits = products.reduce((sum, product) => sum + getProductStock(product), 0);
  const lowStockProducts = products.filter(
    (product) => getProductStock(product) <= LOW_STOCK_THRESHOLD,
  ).length;
  const featuredProducts = products.filter((product) => product.is_featured).length;
  const inventoryValue = products.reduce(
    (sum, product) => sum + getProductStock(product) * product.price,
    0,
  );
  const typeBreakdown = products.reduce<Record<string, number>>((acc, product) => {
    acc[product.product_type] = (acc[product.product_type] || 0) + 1;
    return acc;
  }, {});
  const lowStockVariants = products.reduce((count, product) => {
    return (
      count +
      product.product_variants.filter((variant) => variant.stock <= LOW_STOCK_THRESHOLD).length
    );
  }, 0);

  return {
    totalProducts,
    activeProducts,
    lowStockProducts,
    totalStockUnits,
    featuredProducts,
    inventoryValue,
    typeBreakdown,
    lowStockVariants,
  };
}

function getProductStock(product: ProductWithDetails) {
  if (!product.product_variants?.length) return 0;
  return product.product_variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
}

function getColorways(product: ProductWithDetails) {
  if (product.product_colorways?.length) {
    return product.product_colorways;
  }

  // Backfill colorways from variants/colors for older products.
  const uniqueColors = new Map<
    string,
    {
      id: string;
      product_id: string;
      name: string;
      slug: string;
      color_label: string | null;
      color_code: string;
      is_default: boolean;
      display_order: number;
      notes: string | null;
    }
  >();

  product.product_variants.forEach((variant, index) => {
    const key = variant.color || variant.color_code || `color-${index}`;
    if (!uniqueColors.has(key)) {
      uniqueColors.set(key, {
        id: key,
        product_id: product.id,
        name: variant.color || `Color ${index + 1}`,
        slug: slugify(variant.color || `color-${index + 1}`),
        color_label: variant.color,
        color_code: variant.color_code || "#d4d4d4",
        is_default: index === 0,
        display_order: index,
        notes: null,
      });
    }
  });

  if (!uniqueColors.size && product.product_images?.length) {
    uniqueColors.set("default", {
      id: "default",
      product_id: product.id,
      name: "Default",
      slug: "default",
      color_label: "Default",
      color_code: "#d4d4d4",
      is_default: true,
      display_order: 0,
      notes: null,
    });
  }

  return Array.from(uniqueColors.values());
}

