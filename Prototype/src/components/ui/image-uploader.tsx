"use client";

import * as React from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB, matching the uploader's own copy
const DEFAULT_MAX_IMAGES = 10;

interface ImageUploaderProps {
  name: string;
  multiple?: boolean;
  defaultValue?: string | string[];
  maxImages?: number;
}

export function ImageUploader({ name, multiple = false, defaultValue, maxImages = DEFAULT_MAX_IMAGES }: ImageUploaderProps) {
  const [images, setImages] = React.useState<string[]>(() => {
    if (!defaultValue) return [];
    if (Array.isArray(defaultValue)) return defaultValue.filter(Boolean);
    return [defaultValue].filter(Boolean);
  });
  const [error, setError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const atLimit = multiple && images.length >= maxImages;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);

    Array.from(files).forEach((file) => {
      if (multiple && images.length >= maxImages) {
        setError(`You can upload up to ${maxImages} photos.`);
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError(`"${file.name}" isn't an image file.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`"${file.name}" is over the 10MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          if (multiple) {
            setImages((prev) => (prev.length >= maxImages ? prev : [...prev, result]));
          } else {
            setImages([result]);
          }
        }
      };
      reader.onerror = () => setError(`Couldn't read "${file.name}". Try another file.`);
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
        onClick={() => !atLimit && fileInputRef.current?.click()}
        className={cn(
          "w-full shrink-0 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center bg-slate-50 text-center p-6 transition-colors",
          atLimit ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-slate-100",
          !multiple && images.length > 0 ? "hidden" : "flex h-32"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple={multiple}
          disabled={atLimit}
          className="hidden"
        />
        <Upload className="h-6 w-6 text-slate-400 mb-2" />
        <p className="text-sm font-semibold text-slate-700">
          {atLimit ? `Limit reached (${maxImages} photos)` : `Upload ${multiple ? "photos" : "a photo"}`}
        </p>
        <p className="text-xs text-slate-500 mt-1">Click to select files<br/>JPG, PNG up to 10MB{multiple ? `, up to ${maxImages} photos` : ""}</p>
      </div>

      {error ? <p className="text-xs font-semibold text-destructive">{error}</p> : null}

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
