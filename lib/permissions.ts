import { getDocumentById, hasDocumentShare } from "@/lib/queries";
import type { Document } from "@/lib/types";

export function isOwner(doc: Document, userId: string): boolean {
  return doc.owner_id === userId;
}

export async function canRead(docId: string, userId: string): Promise<boolean> {
  const doc = await getDocumentById(docId);
  if (!doc) return false;
  if (isOwner(doc, userId)) return true;
  return hasDocumentShare(docId, userId);
}

// View-only roles are a deliberate scope cut; shared users can edit for now.
export async function canWrite(docId: string, userId: string): Promise<boolean> {
  return canRead(docId, userId);
}
