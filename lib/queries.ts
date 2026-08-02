import { query } from "@/lib/db";
import type {
  Document,
  DocumentContent,
  ShareUser,
  SharedDocument,
  User,
} from "@/lib/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export async function listUsers(): Promise<User[]> {
  const result = await query<User>(
    `SELECT id, name, email, created_at FROM users ORDER BY name ASC`
  );
  return result.rows;
}

export async function getUserById(id: string): Promise<User | null> {
  if (!isUuid(id)) {
    return null;
  }

  const result = await query<User>(
    `SELECT id, name, email, created_at FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function getDocumentById(id: string): Promise<Document | null> {
  if (!isUuid(id)) {
    return null;
  }

  const result = await query<Document>(
    `SELECT id, owner_id, title, content, version, created_at, updated_at
     FROM documents WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function listOwnedDocuments(userId: string): Promise<Document[]> {
  const result = await query<Document>(
    `SELECT id, owner_id, title, content, version, created_at, updated_at
     FROM documents
     WHERE owner_id = $1
     ORDER BY updated_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function listSharedDocuments(
  userId: string
): Promise<SharedDocument[]> {
  const result = await query<SharedDocument>(
    `SELECT d.id, d.owner_id, d.title, d.content, d.version, d.created_at, d.updated_at,
            u.name AS owner_name
     FROM documents d
     INNER JOIN document_shares s ON s.document_id = d.id
     INNER JOIN users u ON u.id = d.owner_id
     WHERE s.user_id = $1
     ORDER BY d.updated_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function hasDocumentShare(
  documentId: string,
  userId: string
): Promise<boolean> {
  if (!isUuid(documentId) || !isUuid(userId)) {
    return false;
  }

  const result = await query(
    `SELECT 1 FROM document_shares
     WHERE document_id = $1 AND user_id = $2
     LIMIT 1`,
    [documentId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function listSharesForDocument(
  documentId: string
): Promise<ShareUser[]> {
  if (!isUuid(documentId)) {
    return [];
  }

  const result = await query<ShareUser>(
    `SELECT u.id, u.name, u.email, s.created_at
     FROM document_shares s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.document_id = $1
     ORDER BY u.name ASC`,
    [documentId]
  );
  return result.rows;
}

export async function listUsersNotSharedWith(
  documentId: string,
  ownerId: string
): Promise<User[]> {
  if (!isUuid(documentId) || !isUuid(ownerId)) {
    return [];
  }

  const result = await query<User>(
    `SELECT u.id, u.name, u.email, u.created_at
     FROM users u
     WHERE u.id <> $2
       AND NOT EXISTS (
         SELECT 1 FROM document_shares s
         WHERE s.document_id = $1 AND s.user_id = u.id
       )
     ORDER BY u.name ASC`,
    [documentId, ownerId]
  );
  return result.rows;
}

export async function createShare(
  documentId: string,
  userId: string
): Promise<void> {
  await query(
    `INSERT INTO document_shares (document_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [documentId, userId]
  );
}

export async function deleteShare(
  documentId: string,
  userId: string
): Promise<boolean> {
  if (!isUuid(documentId) || !isUuid(userId)) {
    return false;
  }

  const result = await query(
    `DELETE FROM document_shares
     WHERE document_id = $1 AND user_id = $2`,
    [documentId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function createDocument(
  ownerId: string,
  title: string,
  content: DocumentContent
): Promise<Document> {
  const result = await query<Document>(
    `INSERT INTO documents (owner_id, title, content)
     VALUES ($1, $2, $3)
     RETURNING id, owner_id, title, content, version, created_at, updated_at`,
    [ownerId, title, content]
  );
  return result.rows[0];
}

export async function updateDocument(
  id: string,
  title: string,
  content: DocumentContent,
  expectedVersion: number
): Promise<Document | null> {
  if (!isUuid(id)) {
    return null;
  }

  const result = await query<Document>(
    `UPDATE documents
     SET title = $1,
         content = $2,
         version = version + 1,
         updated_at = now()
     WHERE id = $3 AND version = $4
     RETURNING id, owner_id, title, content, version, created_at, updated_at`,
    [title, content, id, expectedVersion]
  );
  return result.rows[0] ?? null;
}

export async function deleteDocument(id: string): Promise<boolean> {
  if (!isUuid(id)) {
    return false;
  }

  const result = await query(`DELETE FROM documents WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}
