import { error, json } from "@/lib/http";
import { isOwner } from "@/lib/permissions";
import {
  createShare,
  deleteShare,
  getDocumentById,
  getUserById,
  listSharesForDocument,
  listUsersNotSharedWith,
} from "@/lib/queries";
import { invalidUuidError, isUuid, parseJsonBody } from "@/lib/request";
import { getCurrentUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: { id: string };
};

function isSelfShareError(err: unknown): boolean {
  return (
    err instanceof Error &&
    err.message.includes("cannot share a document with its owner")
  );
}

function parseUserId(body: unknown): string | null {
  if (
    typeof body === "object" &&
    body !== null &&
    "userId" in body &&
    typeof (body as { userId: unknown }).userId === "string"
  ) {
    return (body as { userId: string }).userId;
  }
  return null;
}

async function shareListPayload(documentId: string, ownerId: string) {
  const [shares, candidates] = await Promise.all([
    listSharesForDocument(documentId),
    listUsersNotSharedWith(documentId, ownerId),
  ]);
  return { shares, candidates };
}

// Only the document owner can share or revoke. Shared users cannot re-share —
// role-based permission tiers are a deliberate scope cut.
export async function GET(_request: Request, context: RouteContext) {
  try {
    if (!isUuid(context.params.id)) {
      return invalidUuidError("document id");
    }

    const userId = getCurrentUserId();
    const doc = await getDocumentById(context.params.id);

    if (!doc) {
      return error("Document not found", 404);
    }

    if (!isOwner(doc, userId)) {
      return error("Forbidden", 403);
    }

    return json(await shareListPayload(doc.id, doc.owner_id));
  } catch (err) {
    console.error(err);
    return error("Internal server error", 500);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    if (!isUuid(context.params.id)) {
      return invalidUuidError("document id");
    }

    const userId = getCurrentUserId();
    const doc = await getDocumentById(context.params.id);

    if (!doc) {
      return error("Document not found", 404);
    }

    if (!isOwner(doc, userId)) {
      return error("Forbidden", 403);
    }

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) {
      return parsed.response;
    }

    const targetUserId = parseUserId(parsed.value);
    if (!targetUserId) {
      return error("userId is required", 400);
    }

    if (!isUuid(targetUserId)) {
      return invalidUuidError("userId");
    }

    const targetUser = await getUserById(targetUserId);
    if (!targetUser) {
      return error("User not found", 400);
    }

    try {
      await createShare(doc.id, targetUserId);
    } catch (err) {
      if (isSelfShareError(err)) {
        return error("Cannot share a document with its owner", 400);
      }
      throw err;
    }

    return json(await shareListPayload(doc.id, doc.owner_id));
  } catch (err) {
    console.error(err);
    return error("Internal server error", 500);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    if (!isUuid(context.params.id)) {
      return invalidUuidError("document id");
    }

    const userId = getCurrentUserId();
    const doc = await getDocumentById(context.params.id);

    if (!doc) {
      return error("Document not found", 404);
    }

    if (!isOwner(doc, userId)) {
      return error("Forbidden", 403);
    }

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) {
      return parsed.response;
    }

    const targetUserId = parseUserId(parsed.value);
    if (!targetUserId) {
      return error("userId is required", 400);
    }

    if (!isUuid(targetUserId)) {
      return invalidUuidError("userId");
    }

    await deleteShare(doc.id, targetUserId);
    return json(await shareListPayload(doc.id, doc.owner_id));
  } catch (err) {
    console.error(err);
    return error("Internal server error", 500);
  }
}
