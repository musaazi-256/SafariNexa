/** Seeded example.com files are fixtures, not downloadable documents. */
export function documentLink(fileUrl: string, type: string, demo: boolean, documentId?: string) {
  if (demo && fileUrl.startsWith("https://example.com/documents/")) return `/demo/document?${documentId ? `documentId=${encodeURIComponent(documentId)}` : `type=${encodeURIComponent(type)}`}`;
  return fileUrl;
}
