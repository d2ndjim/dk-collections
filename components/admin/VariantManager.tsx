"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ProductVariantInput {
  id?: string;
  size: string;
  color: string;
  color_code: string;
  stock: number;
  sku: string;
  price_override?: number;
}

interface VariantManagerProps {
  variants: ProductVariantInput[];
  onChange: (variants: ProductVariantInput[]) => void;
}

export function VariantManager({ variants, onChange }: VariantManagerProps) {
  const [newVariant, setNewVariant] = useState<ProductVariantInput>({
    size: "",
    color: "",
    color_code: "#000000",
    stock: 0,
    sku: "",
  });

  const addVariant = () => {
    if (!newVariant.size || !newVariant.color) {
      return;
    }
    onChange([...variants, newVariant]);
    setNewVariant({
      size: "",
      color: "",
      color_code: "#000000",
      stock: 0,
      sku: "",
    });
  };

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof ProductVariantInput, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product Variants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Variants */}
          {variants.length > 0 && (
            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50"
                >
                  <div className="flex-1 grid grid-cols-5 gap-2">
                    <div>
                      <Label className="text-xs">Size</Label>
                      <Input
                        value={variant.size}
                        onChange={(e) =>
                          updateVariant(index, "size", e.target.value)
                        }
                        placeholder="M"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Color</Label>
                      <div className="flex gap-1">
                        <Input
                          value={variant.color}
                          onChange={(e) =>
                            updateVariant(index, "color", e.target.value)
                          }
                          placeholder="Black"
                          className="h-8"
                        />
                        <Input
                          type="color"
                          value={variant.color_code}
                          onChange={(e) =>
                            updateVariant(index, "color_code", e.target.value)
                          }
                          className="h-8 w-12 p-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Stock</Label>
                      <Input
                        type="number"
                        value={variant.stock}
                        onChange={(e) =>
                          updateVariant(index, "stock", parseInt(e.target.value) || 0)
                        }
                        placeholder="0"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">SKU</Label>
                      <Input
                        value={variant.sku}
                        onChange={(e) =>
                          updateVariant(index, "sku", e.target.value)
                        }
                        placeholder="SKU-001"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Price Override</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={variant.price_override || ""}
                        onChange={(e) =>
                          updateVariant(
                            index,
                            "price_override",
                            e.target.value ? parseFloat(e.target.value) : undefined
                          )
                        }
                        placeholder="Optional"
                        className="h-8"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeVariant(index)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Variant */}
          <div className="border-t pt-4">
            <div className="flex items-end gap-2">
              <div className="flex-1 grid grid-cols-5 gap-2">
                <div>
                  <Label className="text-xs">Size</Label>
                  <Input
                    value={newVariant.size}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, size: e.target.value })
                    }
                    placeholder="M"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Color</Label>
                  <div className="flex gap-1">
                    <Input
                      value={newVariant.color}
                      onChange={(e) =>
                        setNewVariant({ ...newVariant, color: e.target.value })
                      }
                      placeholder="Black"
                      className="h-8"
                    />
                    <Input
                      type="color"
                      value={newVariant.color_code}
                      onChange={(e) =>
                        setNewVariant({
                          ...newVariant,
                          color_code: e.target.value,
                        })
                      }
                      className="h-8 w-12 p-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Stock</Label>
                  <Input
                    type="number"
                    value={newVariant.stock}
                    onChange={(e) =>
                      setNewVariant({
                        ...newVariant,
                        stock: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">SKU</Label>
                  <Input
                    value={newVariant.sku}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, sku: e.target.value })
                    }
                    placeholder="SKU-001"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Price Override</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newVariant.price_override || ""}
                    onChange={(e) =>
                      setNewVariant({
                        ...newVariant,
                        price_override: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="Optional"
                    className="h-8"
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={addVariant}
                size="sm"
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {variants.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No variants added yet. Add size and color variants above.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

