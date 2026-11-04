"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from "@/components/ui/field";
import { Label } from "@/components/ui/label";

/** shadcn checkbox demo with Field layouts: plain, with description, disabled, and a selectable card. */
export function CheckboxFields() {
  return (
    <FieldGroup className="max-w-sm">
      <Field orientation="horizontal">
        <Checkbox id="terms-checkbox" name="terms" />
        <Label htmlFor="terms-checkbox">Accept terms and conditions</Label>
      </Field>
      <Field orientation="horizontal">
        <Checkbox id="terms-checkbox-2" name="terms2" defaultChecked />
        <FieldContent>
          <FieldLabel htmlFor="terms-checkbox-2">Accept terms and conditions</FieldLabel>
          <FieldDescription>By ticking this box, you agree to the booking terms.</FieldDescription>
        </FieldContent>
      </Field>
      <Field orientation="horizontal" data-disabled="true">
        <Checkbox id="toggle-checkbox" name="toggle" disabled />
        <FieldLabel htmlFor="toggle-checkbox">Enable notifications</FieldLabel>
      </Field>
      <FieldLabel htmlFor="toggle-checkbox-2">
        <Field orientation="horizontal">
          <Checkbox id="toggle-checkbox-2" name="toggle2" />
          <FieldContent>
            <FieldTitle>Enable notifications</FieldTitle>
            <FieldDescription>You can enable or disable notifications at any time.</FieldDescription>
          </FieldContent>
        </Field>
      </FieldLabel>
    </FieldGroup>
  );
}
