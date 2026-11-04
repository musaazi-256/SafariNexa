import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function TableActionLink({ href, label = "View", description }: { href: string; label?: string; description: string }) {
  return <Link href={href} className="table-action" aria-label={description} title={description}>{label}<ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>;
}
