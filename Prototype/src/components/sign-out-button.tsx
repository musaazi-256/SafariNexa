import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/actions/session";

export function SignOutMenuItem() {
  return (
    <form action={signOutAction}>
      <DropdownMenuItem asChild>
        <Button variant="ghost" type="submit" className="w-full text-destructive">
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </DropdownMenuItem>
    </form>
  );
}
