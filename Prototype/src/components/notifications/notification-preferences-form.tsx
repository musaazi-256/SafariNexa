"use client";

import { useFormState } from "react-dom";
import { saveNotificationPreferences } from "@/lib/actions/notifications";
import { NOTIFICATION_TYPES,NOTIFICATION_TYPE_LABELS,type NotificationPreferences } from "@/lib/preferences";
import { Button } from "@/components/ui/button";

export function NotificationPreferencesForm({notify}:{notify:NotificationPreferences}) {
  const [state,action]=useFormState(saveNotificationPreferences,{message:""});
  return <form action={action} className="space-y-5"><p className="text-sm leading-relaxed text-muted-foreground">Choose what appears under My categories in your notification centre. These categories are shared across your account; All and Unread continue to show every update.</p><div className="grid gap-3 sm:grid-cols-2">{NOTIFICATION_TYPES.map(type=><label key={type} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border p-4 text-sm text-slate-700 has-[:checked]:border-primary/25 has-[:checked]:bg-primary/5"><span>{NOTIFICATION_TYPE_LABELS[type]}</span><input type="checkbox" name={`notify_${type}`} defaultChecked={notify[type]} className="h-4 w-4 accent-primary"/></label>)}</div><p className="text-xs leading-relaxed text-muted-foreground">Updates appear in the app. These settings do not subscribe you to email, SMS or weekly reports.</p><Button type="submit" size="sm" className="rounded-lg">Save categories</Button>{state.message&&<p role={state.error?"alert":"status"} className={state.error?"text-sm text-destructive leading-relaxed":"text-sm text-muted-foreground leading-relaxed"}>{state.message}</p>}</form>;
}
