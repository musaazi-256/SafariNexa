"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

type ConfirmSubmitProps = {
  /** The visible button. Rendered as type="button"; it opens the dialog instead of submitting. */
  trigger: React.ReactElement<{ onClick?: React.MouseEventHandler; type?: string }>;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  /** Submitter name/value, for forms that branch on which button was pressed. */
  name?: string;
  value?: string;
  /** Show what the admin typed in this form field (e.g. reviewer notes) inside the dialog. */
  previewField?: string;
  previewLabel?: string;
  destructive?: boolean;
};

/**
 * Wraps a submit button inside a server-action <form> with an "Are you sure?" step.
 * Must be rendered inside the <form>. The dialog is portalled out of the form, so the
 * real submission goes through a hidden submit button that carries name/value.
 */
export function ConfirmSubmit({
  trigger,
  title,
  description,
  confirmLabel,
  name,
  value,
  previewField,
  previewLabel = "Your notes",
  destructive = true
}: ConfirmSubmitProps) {
  const [open, setOpen] = React.useState(false);
  const [preview, setPreview] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const submitRef = React.useRef<HTMLButtonElement>(null);
  const { pending } = useFormStatus();
  const sawPending = React.useRef(false);

  // Close once the server action settles (success or error), so a failed action
  // doesn't leave the dialog stuck on a spinner.
  React.useEffect(() => {
    if (!submitting) return;
    if (pending) sawPending.current = true;
    else if (sawPending.current) {
      sawPending.current = false;
      setSubmitting(false);
      setOpen(false);
    }
  }, [pending, submitting]);

  const openDialog = (event: React.MouseEvent) => {
    trigger.props.onClick?.(event);
    const form = submitRef.current?.form;
    if (!form) return;
    // Surface missing required fields before asking for confirmation.
    if (!form.reportValidity()) return;
    if (previewField) {
      const field = form.elements.namedItem(previewField);
      setPreview(field && "value" in field ? String(field.value).trim() : "");
    }
    setOpen(true);
  };

  const confirm = () => {
    const button = submitRef.current;
    if (!button?.form) return;
    setSubmitting(true);
    button.form.requestSubmit(button);
  };

  return (
    <>
      {React.cloneElement(trigger, { type: "button", onClick: openDialog })}
      <button ref={submitRef} type="submit" name={name} value={value} hidden tabIndex={-1} aria-hidden />
      <Dialog open={open} onOpenChange={(next) => !submitting && setOpen(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {previewField && preview ? (
            <div className="rounded-xl border border-border bg-secondary/40 p-3 text-sm">
              <p className="mb-1 text-xs font-semibold text-muted-foreground">{previewLabel}</p>
              <p className="whitespace-pre-wrap">{preview}</p>
            </div>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant={destructive ? "destructive" : "default"}
              onClick={confirm}
              loading={submitting}
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
