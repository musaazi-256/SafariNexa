import { LogOut } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/actions";

export function SignOutMenuItem() {
  return (
    <form action={signOutAction}>
      <DropdownMenuItem asChild>
        <button type="submit" className="w-full text-destructive">
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </DropdownMenuItem>
    </form>
  );
}
