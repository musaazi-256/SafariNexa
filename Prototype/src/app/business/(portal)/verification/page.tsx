import { redirect } from "next/navigation";

export default function BusinessVerificationRedirect() {
  redirect("/business/settings/verification");
}
