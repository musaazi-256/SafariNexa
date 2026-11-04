import * as React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/** shadcn Spinner. Announced as "Loading" unless aria-hidden is passed. */
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return <Loader2 role="status" aria-label="Loading" className={cn("h-4 w-4 animate-spin motion-reduce:animate-none", className)} {...props} />;
}

export { Spinner };
