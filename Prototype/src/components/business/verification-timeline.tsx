import { Check, Clock, FileText, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export type VerificationStatus = "SUBMITTED" | "UNDER_REVIEW" | "NEEDS_CHANGES" | "APPROVED" | "REJECTED";

interface VerificationTimelineProps {
  status: VerificationStatus;
  submittedAt?: Date | null;
}

export function VerificationTimeline({ status, submittedAt }: VerificationTimelineProps) {
  const isApproved = status === "APPROVED";
  const isNeedsChanges = status === "NEEDS_CHANGES";
  const isUnderReview = status === "UNDER_REVIEW" || isNeedsChanges;
  const isSubmitted = status === "SUBMITTED" || isUnderReview || isApproved;
  const isRejected = status === "REJECTED";

  const steps = [
    {
      id: "submitted",
      label: "Submitted",
      subLabel: submittedAt ? format(new Date(submittedAt), "dd MMM yyyy") : "Pending",
      isCompleted: isUnderReview || isApproved,
      isCurrent: status === "SUBMITTED",
      icon: Check,
    },
    {
      id: "review",
      label: "Under review",
      subLabel: status === "UNDER_REVIEW" ? "In progress" : (isApproved || isNeedsChanges ? "Completed" : "Pending"),
      isCompleted: isNeedsChanges || isApproved,
      isCurrent: status === "UNDER_REVIEW",
      icon: Clock,
    },
    {
      id: "info",
      label: "Additional info",
      subLabel: isNeedsChanges ? "Action required" : "If needed",
      isCompleted: isApproved,
      isCurrent: isNeedsChanges,
      icon: isNeedsChanges ? AlertCircle : FileText,
      isWarning: isNeedsChanges,
    },
    {
      id: "approved",
      label: "Approved",
      subLabel: isApproved ? "Completed" : (isRejected ? "Rejected" : "Pending"),
      isCompleted: isApproved,
      isCurrent: isApproved,
      icon: Check,
      isError: isRejected,
    },
  ];

  return (
    <div className="flex w-full max-w-2xl items-start justify-between relative mt-4">
      <div className="absolute top-5 left-[10%] right-[10%] h-[2px] bg-slate-200" />
      <div 
        className="absolute top-5 left-[10%] h-[2px] transition-all duration-500" 
        style={{
          width: isApproved ? "80%" : isNeedsChanges ? "53%" : isUnderReview ? "26%" : "0%",
          backgroundColor: isNeedsChanges ? "#eab308" : "#16a34a"
        }}
      />
      
      {steps.map((step, index) => (
        <div key={step.id} className="relative z-10 flex flex-col items-center flex-1">
          <div 
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white transition-colors duration-300",
              step.isCompleted ? "border-green-600 bg-green-600 text-white" :
              step.isCurrent && step.isWarning ? "border-warning bg-warning text-white" :
              step.isCurrent && step.isError ? "border-destructive bg-destructive text-white" :
              step.isCurrent ? "border-warning bg-warning text-white" :
              "border-slate-200 text-slate-400"
            )}
          >
            <step.icon className="h-5 w-5" />
          </div>
          <div className="mt-3 text-center">
            <p className={cn("text-sm font-bold", step.isCurrent || step.isCompleted ? "text-slate-900" : "text-slate-500")}>
              {step.label}
            </p>
            <p className={cn("text-xs mt-0.5", step.isCurrent || step.isCompleted ? "text-slate-500" : "text-slate-400")}>
              {step.subLabel}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
