"use client";

import * as React from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  name: string;
  multiple?: boolean;
  defaultValue?: string | string[];
}

export function ImageUploader({ name, multiple = false, defaultValue }: ImageUploaderProps) {
  const [images, setImages] = React.useState<string[]>(() => {
    if (!defaultValue) return [];
    if (Array.isArray(defaultValue)) return defaultValue.filter(Boolean);
    return [defaultValue].filter(Boolean);
  });
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          if (multiple) {
            setImages((prev) => [...prev, result]);
          } else {
            setImages([result]);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Hidden inputs to pass data to the server form action */}
      {images.map((img, index) => (
        <input key={index} type="hidden" name={name} value={img} />
      ))}
      
      {/* Drag & Drop Zone */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "w-full shrink-0 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center bg-slate-50 text-center p-6 cursor-pointer hover:bg-slate-100 transition-colors",
          !multiple && images.length > 0 ? "hidden" : "flex h-32"
        )}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          multiple={multiple} 
          className="hidden" 
        />
        <Upload className="h-6 w-6 text-slate-400 mb-2" />
        <p className="text-sm font-semibold text-slate-700">Upload {multiple ? "photos" : "a photo"}</p>
        <p className="text-xs text-slate-500 mt-1">Click to select files<br/>JPG, PNG up to 10MB</p>
      </div>

      {/* Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {images.map((img, index) => (
            <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`Preview ${index + 1}`} className="object-cover w-full h-full" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
                className="absolute top-2 right-2 h-7 w-7 bg-white/90 hover:bg-white text-red-600 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
              {!img.startsWith("data:") && (
                <div className="absolute bottom-2 left-2 h-6 w-6 bg-black/50 rounded flex items-center justify-center">
                  <ImageIcon className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
