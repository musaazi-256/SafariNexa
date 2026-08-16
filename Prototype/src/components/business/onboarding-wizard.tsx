"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, MapPin, Upload, User, Building2, Tent, TrendingUp, HeadphonesIcon, Settings } from "lucide-react";

import { submitBusinessOnboarding } from "@/lib/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/logo";

const steps = [
  { id: "profile", title: "Business Profile" },
  { id: "contact", title: "Contact Person" },
  { id: "documents", title: "Verification" },
];

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    businessName: "",
    registrationNumber: "",
    address: "",
    description: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactRole: "",
  });
  const [documents, setDocuments] = useState<Record<string, File[]>>({});

  const requiredDocs = useMemo(() => {
    return [{ id: "incorporation", label: "Certificate of Incorporation", desc: "PDF, JPG, or PNG up to 10MB." }];
  }, []);

  const updateForm = (key: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((c) => c + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((c) => c - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.append("businessName", formData.businessName);
      form.append("contactEmail", formData.contactEmail);
      form.append("contactPhone", formData.contactPhone);
      form.append("city", formData.address);
      
      Object.entries(documents).forEach(([key, files]) => {
        files.forEach((file) => {
          form.append(`doc_${key}`, file);
        });
      });
      
      const result = await submitBusinessOnboarding(form);
      if (result && result.success) {
        window.location.href = "/business/dashboard";
      }
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[750px] w-full max-w-[1200px] flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl lg:flex-row">
      
      {/* Left Pane - Brand & Value Prop */}
      <div className="relative flex flex-col justify-between bg-[#0B4928] p-8 text-white lg:w-[40%] lg:p-12">
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-2">
            <Logo size="lg" />
          </div>

          <div className="pt-10">
            <h1 className="text-3xl font-bold leading-tight lg:text-4xl">
              Join the SafariNexa Partner Programme today
            </h1>
            <p className="mt-4 text-lg text-white/80">
              Start earning revenue by promoting your travel offerings—register today to reach thousands of global travelers.
            </p>
          </div>

          <div className="space-y-6 pt-10">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <TrendingUp className="h-6 w-6 text-[#FFCE06]" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Convert traffic into revenue</h3>
                <p className="mt-1 text-sm text-white/70">Earn money by promoting accommodations, tours, and transport in our ecosystem.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Settings className="h-6 w-6 text-[#FFCE06]" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Easy-to-use tools</h3>
                <p className="mt-1 text-sm text-white/70">We optimize our platform to be simple to use so you can focus on your business.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <HeadphonesIcon className="h-6 w-6 text-[#FFCE06]" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Customer-driven service</h3>
                <p className="mt-1 text-sm text-white/70">State-of-the-art technology and support to make it easy for your customers.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-12 text-sm text-white/50">
          © {new Date().getFullYear()} SafariNexa Partner Network
        </div>
      </div>

      {/* Right Pane - The Wizard */}
      <div className="flex flex-1 flex-col p-8 lg:p-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{steps[currentStep].title}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {currentStep === 0 && "Tell us about your business."}
              {currentStep === 1 && "Who should we contact for operations and support?"}
              {currentStep === 2 && "Upload registration documents to verify your business."}
            </p>
          </div>
          <div className="text-sm font-medium text-muted-foreground bg-slate-100 px-3 py-1 rounded-full shrink-0">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative mb-12">
          <div className="absolute left-0 top-1/2 h-[3px] w-full -translate-y-1/2 bg-slate-100 rounded-full"></div>
          <div 
            className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 bg-primary transition-all duration-500 rounded-full"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          ></div>
          <div className="relative flex justify-between">
            {steps.map((step, index) => (
              <div 
                key={step.id} 
                className={`flex h-8 w-8 items-center justify-center rounded-full border-[3px] transition-all duration-300 ${
                  index <= currentStep ? "border-primary bg-primary text-white shadow-[0_0_0_4px_rgba(12,118,58,0.1)]" : "border-slate-100 bg-white text-slate-400"
                }`}
              >
                {index < currentStep ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-6">
          
          {/* Step 1: Business Profile */}
          {currentStep === 0 && (
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-slate-900">Registered Business Name</Label>
                <Input 
                  id="businessName" 
                  value={formData.businessName} 
                  onChange={(e) => updateForm("businessName", e.target.value)}
                  placeholder="e.g. Kampala Serena Hotel" 
                  className="bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="registrationNumber" className="text-slate-900">Registration / TIN Number</Label>
                <Input 
                  id="registrationNumber" 
                  value={formData.registrationNumber} 
                  onChange={(e) => updateForm("registrationNumber", e.target.value)}
                  placeholder="Enter business registration number" 
                  className="bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-slate-900">Physical Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="address" 
                    value={formData.address} 
                    onChange={(e) => updateForm("address", e.target.value)}
                    className="pl-9 bg-slate-50 border-slate-200 focus:bg-white" 
                    placeholder="Enter full physical address" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-900">Brief Description</Label>
                <Textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={(e) => updateForm("description", e.target.value)}
                  placeholder="Tell us a little bit about what you offer..." 
                  rows={4} 
                  className="bg-slate-50 border-slate-200 focus:bg-white resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Contact Person */}
          {currentStep === 1 && (
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contactName" className="text-slate-900">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="contactName" 
                    value={formData.contactName} 
                    onChange={(e) => updateForm("contactName", e.target.value)}
                    className="pl-9 bg-slate-50 border-slate-200 focus:bg-white" 
                    placeholder="Jane Doe" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactRole" className="text-slate-900">Role / Title</Label>
                <Input 
                  id="contactRole" 
                  value={formData.contactRole} 
                  onChange={(e) => updateForm("contactRole", e.target.value)}
                  placeholder="e.g. General Manager" 
                  className="bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone" className="text-slate-900">Phone Number</Label>
                <Input 
                  id="contactPhone" 
                  value={formData.contactPhone} 
                  onChange={(e) => updateForm("contactPhone", e.target.value)}
                  type="tel" 
                  placeholder="+256 700 000000" 
                  className="bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contactEmail" className="text-slate-900">Work Email</Label>
                <Input 
                  id="contactEmail" 
                  value={formData.contactEmail} 
                  onChange={(e) => updateForm("contactEmail", e.target.value)}
                  type="email" 
                  placeholder="jane@example.com" 
                  className="bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {requiredDocs.map((doc) => (
                <div key={doc.id} className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 sm:p-10 text-center transition-colors hover:bg-slate-100/50 hover:border-slate-300">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">Upload {doc.label}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {doc.desc}
                  </p>
                  <div className="mt-6 flex justify-center">
                    <Input 
                      type="file" 
                      multiple
                      accept=".pdf,image/png,image/jpeg"
                      className="max-w-xs cursor-pointer bg-white"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          setDocuments(prev => ({ ...prev, [doc.id]: files }));
                        }
                      }}
                    />
                  </div>
                  {documents[doc.id] && documents[doc.id].length > 0 && (
                    <div className="mt-4 flex flex-col items-center gap-2">
                      {documents[doc.id].map((file, i) => (
                        <p key={i} className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          <Check className="h-4 w-4" />
                          {file.name}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer Buttons */}
        <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-100">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
            className="text-slate-500 hover:text-slate-900"
          >
            Back
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button 
              onClick={handleNext}
              className="bg-primary hover:bg-primary/90 px-8"
              disabled={
                (currentStep === 0 && (!formData.businessName || !formData.address)) ||
                (currentStep === 1 && (!formData.contactName || !formData.contactEmail))
              }
            >
              Continue <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              className="bg-primary hover:bg-primary/90 px-8"
              disabled={isSubmitting || requiredDocs.some(doc => !documents[doc.id] || documents[doc.id].length === 0)}
            >
              {isSubmitting ? "Submitting..." : "Submit for Verification"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
