import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/** shadcn NativeSelect: a styled native <select> (keyboard + mobile pickers for free). */
const NativeSelect = React.forwardRef<HTMLSelectElement, React.ComponentPropsWithoutRef<"select">>(
  ({ className, children, ...props }, ref) => (
    <div data-slot="native-select-wrapper" className={cn("relative inline-flex", className)}>
      <select
        ref={ref}
        data-slot="native-select"
        className="filter-select w-full appearance-none pr-9"
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
);
NativeSelect.displayName = "NativeSelect";

const NativeSelectOption = React.forwardRef<HTMLOptionElement, React.ComponentPropsWithoutRef<"option">>(
  (props, ref) => <option ref={ref} data-slot="native-select-option" {...props} />
);
NativeSelectOption.displayName = "NativeSelectOption";

export { NativeSelect, NativeSelectOption };
