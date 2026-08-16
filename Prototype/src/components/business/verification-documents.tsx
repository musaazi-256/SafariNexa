"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { UploadCloud, FileText, Check, MoreVertical, ShieldCheck, Loader2 } from "lucide-react";

import { submitVerificationDocument } from "@/lib/actions/verification";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "INCORPORATION", label: "Incorporation", icon: FileText },
  { id: "LICENSES", label: "Licenses & permits", icon: ShieldCheck },
  { id: "TAX", label: "Tax documents", icon: FileText },
  { id: "IDENTITY", label: "Identity documents", icon: FileText },
  { id: "OTHER", label: "Other", icon: FileText },
];

interface BusinessDocument {
  id: string;
  type: string;
  fileUrl: string;
  uploadedAt: Date;
}

interface VerificationDocumentsProps {
  documents: BusinessDocument[];
}

export function VerificationDocuments({ documents }: VerificationDocumentsProps) {
  const [activeTab, setActiveTab] = useState(CATEGORIES[0].id);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeDocuments = documents.filter(d => 
    (d.type === activeTab) || 
    (activeTab === "OTHER" && !CATEGORIES.some(c => c.id === d.type && c.id !== "OTHER"))
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("type", activeTab);
      formData.append("file", file);
      await submitVerificationDocument(formData);
    } catch (error) {
      console.error(error);
      alert("Failed to upload document");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Documents</h2>
      
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(category => {
          const isActive = activeTab === category.id;
          return (
            <button
              key={category.id}
              onClick={() => setActiveTab(category.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors",
                isActive 
                  ? "border-green-600 text-green-700 bg-white shadow-sm ring-1 ring-green-600/20" 
                  : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
              )}
            >
              <category.icon className={cn("h-4 w-4", isActive ? "text-green-600" : "text-slate-400")} />
              {category.label}
            </button>
          );
        })}
      </div>

      {/* Info Alert */}
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex gap-3 mb-8">
        <ShieldCheck className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-green-900">Why we need these documents</h4>
          <p className="text-sm text-green-700 mt-1 flex items-center justify-between">
            <span>These help us verify your business is legitimate and compliant with local regulations.</span>
            <a href="#" className="font-semibold text-green-800 hover:underline shrink-0 ml-4 hidden sm:inline">Learn more ↗</a>
          </p>
        </div>
      </div>

      <h3 className="text-sm font-bold text-slate-900 mb-3">Uploaded documents</h3>
      
      <div className="space-y-4">
        {activeDocuments.map(doc => (
          <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center h-12 w-10 rounded bg-red-50 text-red-600 border border-red-100 shrink-0">
                <FileText className="h-5 w-5" />
                <span className="text-[10px] font-bold mt-0.5 uppercase">{doc.fileUrl.split('.').pop() || 'PDF'}</span>
              </div>
              <div>
                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="font-bold text-slate-900 hover:underline text-sm sm:text-base">
                  {doc.fileUrl.split('/').pop() || "Document"}
                </a>
                <p className="text-xs text-slate-500 mt-0.5">
                  Uploaded on {format(new Date(doc.uploadedAt), "dd MMM yyyy")} • 245 KB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold">
                <ClockIcon className="h-3.5 w-3.5" /> Under review
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {/* Upload Zone */}
        <div 
          className="relative rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors p-8 text-center flex flex-col items-center justify-center"
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
          />
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 text-green-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-900">Uploading document...</p>
            </>
          ) : (
            <>
              <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                <UploadCloud className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900">
                Drag and drop files here, or <span className="text-green-600 cursor-pointer">browse</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG up to 10MB</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ClockIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
