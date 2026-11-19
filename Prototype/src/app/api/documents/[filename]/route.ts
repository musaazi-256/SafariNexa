import fs from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DOCUMENT_DIRECTORY } from "@/lib/private-documents";
export const runtime = "nodejs";
export async function GET(req: Request, { params }: { params: { filename: string } }) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const legacy = /^doc_[a-z0-9_]+\.(pdf|jpg|png)$/.test(params.filename);
  if (!legacy && !/^[a-f0-9-]{36}\.(pdf|jpg|png)$/.test(params.filename)) return new Response("Not found", { status: 404 });
  const doc = await db.businessDocument.findFirst({
    where: { fileUrl: { in: [`/api/documents/${params.filename}`, ...(legacy ? [`/uploads/${params.filename}`] : [])] } },
    include: { verification: true }
  });
  const admin = await db.adminUser.findUnique({ where: { userId: session.user.id } });
  const membership = doc ? await db.businessUser.findFirst({ where: { businessId: doc.verification.businessId, userId: session.user.id, role: { in: ["OWNER", "MANAGER"] } } }) : null;
  if (!doc || !(admin?.status === "ACTIVE" || membership)) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(path.join(DOCUMENT_DIRECTORY, params.filename));
    const ext = path.extname(params.filename);
    return new Response(data, { headers: {
      "Content-Type": ext === ".pdf" ? "application/pdf" : ext === ".jpg" ? "image/jpeg" : "image/png",
      // ?view=inline lets the admin review screen show the file in-page (same-origin frame); default stays a download.
      "Content-Disposition": `${new URL(req.url).searchParams.get("view") === "inline" ? "inline" : "attachment"}; filename="verification${ext}"`,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"
    } });
  } catch { return new Response("Not found", { status: 404 }); }
}
