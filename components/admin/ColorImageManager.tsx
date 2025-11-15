"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImageIcon, X, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ColorImage {
  id?: string;
  color: string;
  color_code: string;
  file?: File;
  preview?: string;
  image_url?: string;
  is_primary?: boolean;
}

interface ColorImageManagerProps {
  colorImages: ColorImage[];
  availableColors: Array<{ color: string; color_code: string }>;
  onChange: (images: ColorImage[]) => void;
}

export function ColorImageManager({
  colorImages,
  availableColors,
  onChange,
}: ColorImageManagerProps) {
  const [selectedColor, setSelectedColor] = useState<string>("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, color: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const colorData = availableColors.find((c) => c.color === color);
      const newImage: ColorImage = {
        color,
        color_code: colorData?.color_code || "#000000",
        file,
        preview: reader.result as string,
        is_primary: colorImages.length === 0,
      };
      onChange([...colorImages, newImage]);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number) => {
    onChange(colorImages.filter((_, i) => i !== index));
  };

  const setPrimaryImage = (index: number) => {
    const updated = colorImages.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
    onChange(updated);
  };

  const getImagesForColor = (color: string) => {
    return colorImages.filter((img) => img.color === color);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Color Images</CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload images for each color variant. Each color can have multiple images.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        {availableColors.length > 0 && (
          <div className="space-y-2">
            <Label>Select Color to Upload Image</Label>
            <div className="flex gap-2">
              <Select value={selectedColor} onValueChange={setSelectedColor}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a color" />
                </SelectTrigger>
                <SelectContent>
                  {availableColors.map((color) => (
                    <SelectItem key={color.color} value={color.color}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: color.color_code }}
                        />
                        {color.color}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                disabled={!selectedColor}
                onClick={() => {
                  const input = document.getElementById(
                    `image-upload-${selectedColor}`
                  ) as HTMLInputElement;
                  input?.click();
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
              {availableColors.map((color) => (
                <input
                  key={color.color}
                  id={`image-upload-${color.color}`}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, color.color)}
                  className="hidden"
                />
              ))}
            </div>
          </div>
        )}

        {/* Display Images by Color */}
        {availableColors.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Add product variants first to upload color-specific images
            </p>
          </div>
        )}

        {availableColors.length > 0 && colorImages.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No images uploaded yet. Select a color and upload images.
            </p>
          </div>
        )}

        {availableColors.map((color) => {
          const images = getImagesForColor(color.color);
          if (images.length === 0) return null;

          return (
            <div key={color.color} className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: color.color_code }}
                />
                <Label className="text-sm font-medium">{color.color}</Label>
                <Badge variant="secondary" className="text-xs">
                  {images.length} {images.length === 1 ? "image" : "images"}
                </Badge>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, imgIndex) => {
                  const globalIndex = colorImages.indexOf(image);
                  const imageUrl = image.preview || image.image_url;

                  return (
                    <div key={imgIndex} className="relative group">
                      <div className="aspect-square rounded-lg border overflow-hidden bg-muted">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={`${color.color} variant`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!image.is_primary && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setPrimaryImage(globalIndex)}
                            title="Set as primary"
                          >
                            <span className="text-xs">★</span>
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeImage(globalIndex)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      {image.is_primary && (
                        <Badge
                          className="absolute bottom-1 left-1 text-xs"
                          variant="default"
                        >
                          Primary
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

