"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  className?: string;
}

const PRESET_COLORS = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF",
  "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080",
  "#FFC0CB", "#A52A2A", "#808080", "#000080", "#008000",
];

export function ColorPicker({ value = "#000000", onChange, className }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [hexValue, setHexValue] = useState(value);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHexValue(value || "#000000");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleColorChange = (color: string) => {
    setHexValue(color);
    onChange(color);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setHexValue(newValue);
    if (/^#[0-9A-Fa-f]{0,6}$/.test(newValue) && newValue.length === 7) {
      onChange(newValue);
    }
  };

  return (
    <div className={cn("relative", className)} ref={popoverRef}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-12 h-10 p-1 border-2"
          style={{
            backgroundColor: hexValue || "#000000",
          }}
          onClick={() => setOpen(!open)}
        >
          <span className="sr-only">Pick a color</span>
        </Button>
        <Input
          type="text"
          value={hexValue || ""}
          onChange={handleInputChange}
          placeholder="#000000"
          className="flex-1 font-mono"
        />
      </div>
      {open && (
        <div className="absolute z-50 w-64 mt-2 p-4 bg-popover border rounded-md shadow-lg">
          <div className="space-y-3">
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "w-8 h-8 rounded border-2 cursor-pointer hover:scale-110 transition-transform",
                    hexValue === color ? "border-primary ring-2 ring-primary ring-offset-1" : "border-gray-300"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    handleColorChange(color);
                    setOpen(false);
                  }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Color</label>
              <input
                type="color"
                value={hexValue || "#000000"}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

