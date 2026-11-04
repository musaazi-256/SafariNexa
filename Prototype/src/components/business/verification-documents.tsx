"use client";

import { FilterControl } from "@/components/ui/filter-control";

import { useAsyncTask } from "@/hooks/use-async-task";

import { documentLink } from "@/lib/document-link";
import { useState, useRef } from "react";
import { format } from "date-fns";
import { UploadCloud, FileText, Check, MoreVertical, ShieldCheck, Loader2, Trash2 } from "lucide-react";

import { submitVerificationDocument, deleteVerificationDocument } from "@/lib/actions/verification";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  demo?: boolean;
}

export function VerificationDocuments({ documents, demo = false }: VerificationDocumentsProps) {
  const [activeTab, setActiveTab] = useState(CATEGORIES[0].id);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [isDeleting, startDeleteTransition] = useAsyncTask();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = (documentId: string) => {
    setError("");
    startDeleteTransition(async () => {
      try {
        await deleteVerificationDocument(documentId);
      } catch (error) {
        console.error(error);
        setError("The document could not be deleted. Please try again.");
      }
    });
  };

  const activeDocuments = documents.filter(d =>
    (d.type === activeTab) ||
    (activeTab === "OTHER" && !CATEGORIES.some(c => c.id === d.type && c.id !== "OTHER"))
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("type", activeTab);
      formData.append("file", file);
      await submitVerificationDocument(formData);
    } catch (error) {
      console.error(error);
      setError("The document could not be uploaded. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Documents</h2>

      <div className="mb-6">
        <FilterControl label="Document type" value={activeTab} defaultValue="INCORPORATION"
          disabled={isUploading} onValueChange={setActiveTab}
          options={CATEGORIES.map(category=>({value:category.id,label:category.label,count:documents.filter(document=>document.type===category.id || (category.id==="OTHER" && !CATEGORIES.some(item=>item.id===document.type))).length}))} />
      </div>

      {/* Info Alert */}
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex gap-3 mb-8">
        <ShieldCheck className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-green-900">Why we need these documents</h4>
          <p className="text-sm text-green-700 mt-1 flex items-center justify-between leading-relaxed">
            <span>These help us verify your business is legitimate and compliant with local regulations.</span>
            <a href="/docs/overview" className="font-semibold text-green-800 hover:underline shrink-0 ml-4 hidden sm:inline">Learn more ↗</a>
          </p>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-slate-900 mb-3">Uploaded documents</h3>

      <div className="space-y-4">
        {activeDocuments.map(doc => (
          <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-white shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center h-12 w-10 rounded bg-red-50 text-red-600 border border-red-100 shrink-0">
                <FileText className="h-5 w-5" />
                <span className="text-xs font-medium mt-0.5 uppercase">{doc.fileUrl.split('.').pop() || 'PDF'}</span>
              </div>
              <div>
                <a href={documentLink(doc.fileUrl, doc.type, demo, doc.id)} target="_blank" rel="noreferrer" className="font-medium text-slate-900 hover:underline text-sm sm:text-base">
                  {doc.fileUrl.split('/').pop() || "Document"}
                </a>
                <p className="text-xs text-slate-500 mt-0.5">
                  Uploaded on {format(new Date(doc.uploadedAt), "dd MMM yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex rounded-md border border-border bg-slate-50 px-2 py-1 text-xs text-slate-600">Attached</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-label={`Actions for ${doc.type.replaceAll("_", " ")}`} variant="ghost" size="icon" className="h-8 w-8 text-slate-400" loading={isDeleting}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(doc.id)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete document
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}

        <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
          />
        {/* Upload Zone */}
        <button type="button" disabled={isUploading} aria-busy={isUploading} aria-label="Choose a verification document to upload"
          className="w-full relative rounded-xl border border-dashed border-border bg-slate-50 hover:bg-slate-100 transition-colors p-8 text-center flex flex-col items-center justify-center"
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >

          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 text-green-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-900 leading-relaxed">Uploading document...</p>
            </>
          ) : (
            <>
              <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                <UploadCloud className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                Choose a file to upload
              </p>
              <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG up to 5MB</p>
            </>
          )}
        </button>
        {error && <p role="alert" className="text-sm text-destructive leading-relaxed">{error}</p>}
      </div>
    </div>
  );
}
