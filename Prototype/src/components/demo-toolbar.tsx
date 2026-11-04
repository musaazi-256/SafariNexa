import { Button } from "@/components/ui/button";
import { signIn } from "@/auth";
import { isDemoMode } from "@/lib/dev-mode";
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts";

/** Demo switching uses the existing header navigation instead of a global banner. */
export function DemoToolbar({surfaces = ["customer", "business", "admin"]}: {surfaces?: Array<keyof typeof DEMO_ACCOUNTS>}) {
  if (!isDemoMode()) return null;
  async function switchPortal(data: FormData) {
    "use server";
    if (!isDemoMode()) throw new Error("Demo mode is disabled.");
    const surface = String(data.get("surface"));
    if (!Object.hasOwn(DEMO_ACCOUNTS, surface)) throw new Error("Unknown demo portal.");
    const account = DEMO_ACCOUNTS[surface as keyof typeof DEMO_ACCOUNTS];
    await signIn("demo", { surface, redirectTo: account.href });
  }
  return <form action={switchPortal} className="flex items-center gap-2">{surfaces.map(surface=><Button variant="ghost" type="submit" key={surface} name="surface" value={surface} title={`Switch to the ${surface} account`} className="h-9 px-2 text-xs font-medium capitalize text-muted-foreground hover:text-foreground">{surface}</Button>)}</form>;
}
