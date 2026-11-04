import { PageHeader } from "@/components/page-header";
import Link from "next/link";
export default function NotFound() { return <main className="mx-auto max-w-xl space-y-5 px-4 py-16"><PageHeader title={<>Page or record not found</>} description={<>The link may be outdated, or this record isn’t available to your account.</>} /><Link className="underline" href="/">Back to SafariNexa</Link></main>; }
