"use client";
import type { ReactNode } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { PaymentActionState } from "@/lib/actions/payment-management";
function PendingContent({children}:{children:ReactNode}) {
  const {pending}=useFormStatus();
  return <fieldset disabled={pending} className="min-w-0 space-y-3 disabled:opacity-60">{children}{pending&&<p role="status" className="text-xs text-muted-foreground">Processing…</p>}</fieldset>;
}
export function PaymentOperationForm({action,children}:{action:(state:PaymentActionState,form:FormData)=>Promise<PaymentActionState>;children:ReactNode}) {
  const [state,formAction]=useFormState(action,{});
  return <form action={formAction} className="space-y-3"><PendingContent>{children}</PendingContent>{state.error&&<p role="alert" className="text-sm text-destructive">{state.error}</p>}{state.message&&<p role="status" className="text-sm text-slate-600">{state.message}</p>}</form>;
}
