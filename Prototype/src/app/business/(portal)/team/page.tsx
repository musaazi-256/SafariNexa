import { redirect } from "next/navigation";

export default function BusinessTeamRedirectPage() {
  redirect("/business/settings?tab=team");
}
