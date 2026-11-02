"use client";

import { RemoteImage } from "@/components/remote-image";
import * as React from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // Uploaded separately, never embedded in server-action bodies
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
  const [uploading,setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const atLimit = multiple && images.length >= maxImages;
  React.useEffect(() => {
    if (!uploading) return;
    const form = fileInputRef.current?.form;
    const block = (event: Event) => {event.preventDefault();event.stopPropagation();setError("Please wait for image uploads to finish before saving.");};
    form?.addEventListener("submit",block,true);
    return () => form?.removeEventListener("submit",block,true);
  },[uploading]);
  const removeImage = (index:number) => setImages(current=>current.filter((_,i)=>i!==index));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setError(null); setUploading(true);
    const uploaded:string[]=[];
    for(const file of files.slice(0,multiple?Math.max(0,maxImages-images.length):1)){
      if(file.size>MAX_FILE_SIZE_BYTES || !["image/jpeg","image/png","image/webp"].includes(file.type)){setError("Choose JPEG, PNG or WebP images up to 5 MB.");continue;}
      try{
        const form=new FormData();form.set("file",file);
        const response=await fetch("/api/images",{method:"POST",body:form});
        if(!response.ok){setError("Image upload failed. Check your permissions and storage configuration, then try again.");continue;}
        const result=await response.json();uploaded.push(result.url);
      }catch{setError("Could not upload this image. Please try again.");}
    }
    if(uploaded.length)setImages(current=>multiple?[...current,...uploaded].slice(0,maxImages):uploaded.slice(0,1));
    setUploading(false);if(fileInputRef.current)fileInputRef.current.value="";
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Hidden inputs to pass data to the server form action */}
      {images.map((img, index) => (
        <input key={index} type="hidden" name={name} value={img} />
      ))}
      
      {/* Drag & Drop Zone */}
      <div
        role="button"
        tabIndex={atLimit || uploading ? -1 : 0}
        aria-label="Upload listing images"
        aria-disabled={atLimit || uploading}
        onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();if(!atLimit&&!uploading)fileInputRef.current?.click();}}}
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
          accept="image/jpeg,image/png,image/webp"
          multiple={multiple}
          disabled={atLimit || uploading}
          className="hidden"
        />
        <Upload className="h-6 w-6 text-slate-400 mb-2" />
        <p className="text-sm font-semibold text-slate-700">
          {atLimit ? `Limit reached (${maxImages} photos)` : `Upload ${multiple ? "photos" : "a photo"}`}
        </p>
        <p className="text-xs text-slate-500 mt-1">Click to select files<br/>JPG, PNG, WebP up to 5MB{multiple ? `, up to ${maxImages} photos` : ""}</p>
      </div>

      {uploading && <p role="status" className="text-sm text-primary">Uploading images… wait for previews before saving.</p>}
      {error ? <p role="alert" className="text-xs font-semibold text-destructive">{error}</p> : null}

      {/* Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {images.map((img, index) => (
            <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <RemoteImage src={img} alt={`Preview ${index + 1}`} className="object-cover w-full h-full" />
              <button
                type="button"
                aria-label={`Remove image ${index+1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
                className="absolute top-2 right-2 h-9 w-9 bg-white/90 hover:bg-white text-red-600 rounded-full flex items-center justify-center shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity"
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
