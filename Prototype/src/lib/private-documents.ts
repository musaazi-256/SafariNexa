import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
export const DOCUMENT_DIRECTORY = process.env.PRIVATE_DOCUMENT_DIRECTORY || path.join(process.cwd(), ".private", "verification");
export async function saveVerificationFile(file: File) {
  if (process.env.NODE_ENV === "production" && !process.env.PRIVATE_DOCUMENT_DIRECTORY) throw new Error("Private persistent document storage is not configured.");
  if (file.size < 1 || file.size > 5 * 1024 * 1024) throw new Error("Documents must be between 1 byte and 5 MB.");
  const data = Buffer.from(await file.arrayBuffer());
  const extension = data.subarray(0, 5).toString() === "%PDF-" ? "pdf"
    : data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff ? "jpg"
    : data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? "png" : null;
  if (!extension) throw new Error("Only PDF, JPEG and PNG documents are accepted.");
  await fs.mkdir(DOCUMENT_DIRECTORY, { recursive: true, mode: 0o700 });
  const name = `${randomUUID()}.${extension}`;
  await fs.writeFile(path.join(DOCUMENT_DIRECTORY, name), data, { mode: 0o600, flag: "wx" });
  return `/api/documents/${name}`;
}
