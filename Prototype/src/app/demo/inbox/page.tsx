import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/dev-mode";
export default async function DemoInbox() {
  if (!isDemoMode()) notFound();
  const messages = await db.auditLog.findMany({where:{action:"demo_email"},orderBy:{createdAt:"desc"},take:50});
  return <main className="mx-auto max-w-3xl space-y-4 p-6"><PageHeader title={<>Email inbox</>} description={<>View your invitations, password reset links and account verification messages.</>} />{messages.map(message=>{
    const meta = message.metadata as {subject?:string;text?:string};
    const parts = (meta.text ?? "").split(/(https?:\/\/[^\s]+)/g);
    return <article className="space-y-2 rounded border p-4" key={message.id}><h2 className="font-semibold">{meta.subject}</h2><p>To: {message.actorEmail}</p><p className="whitespace-pre-wrap break-words">{parts.map((part,i)=> /^https?:\/\//.test(part) ? <Link className="underline" key={i} href={new URL(part).pathname+new URL(part).search}>{part}</Link> : part)}</p></article>;
  })}{!messages.length && <p>No messages yet.</p>}</main>;
}
