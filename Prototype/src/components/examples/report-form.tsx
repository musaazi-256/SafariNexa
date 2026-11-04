"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupTextarea } from "@/components/ui/input-group";
import { toast } from "@/components/ui/toast";

/**
 * The pasted react-hook-form example rebuilt without new form libraries: Field + InputGroup layout,
 * native validation (required/minLength/maxLength) and FieldError messages. In the app, point
 * `action` at a server action instead of the demo handler.
 */
export function ReportProblemForm() {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function validate(form: HTMLFormElement) {
    const next: Record<string, string> = {};
    for (const el of Array.from(form.elements) as HTMLInputElement[]) {
      if (el.name && !el.validity.valid) next[el.name] = el.dataset.message ?? el.validationMessage;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Report a problem</CardTitle>
        <CardDescription>Help us improve by reporting problems you run into.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="report-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!validate(event.currentTarget)) return;
            toast.add({ title: "Report sent", description: title, type: "success" });
            setTitle(""); setDescription(""); setErrors({});
          }}
        >
          <FieldGroup>
            <Field data-invalid={!!errors.title}>
              <FieldLabel htmlFor="report-title">Title</FieldLabel>
              <Input id="report-title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={5} maxLength={32} data-message="Title must be 5–32 characters." aria-invalid={!!errors.title} placeholder="Payment page won't load on mobile" autoComplete="off" />
              <FieldError>{errors.title}</FieldError>
            </Field>
            <Field data-invalid={!!errors.description}>
              <FieldLabel htmlFor="report-description">Description</FieldLabel>
              <InputGroup>
                <InputGroupTextarea id="report-description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} required minLength={20} maxLength={100} data-message="Description must be 20–100 characters." aria-invalid={!!errors.description} rows={5} className="min-h-24" placeholder="What happened, and what did you expect?" />
                <InputGroupAddon align="block-end"><InputGroupText className="tabular-nums">{description.length}/100 characters</InputGroupText></InputGroupAddon>
              </InputGroup>
              <FieldDescription>Include steps to reproduce, what you expected and what actually happened.</FieldDescription>
              <FieldError>{errors.description}</FieldError>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onClick={() => { setTitle(""); setDescription(""); setErrors({}); }}>Reset</Button>
          <Button type="submit" form="report-form">Submit</Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
