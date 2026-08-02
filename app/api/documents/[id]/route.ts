import { error, json } from "@/lib/http";
import { canRead, canWrite, isOwner } from "@/lib/permissions";
import {
  deleteDocument,
  getDocumentById,
  updateDocument,
} from "@/lib/queries";
import { invalidUuidError, isUuid, parseJsonBody } from "@/lib/request";
import { getCurrentUserId } from "@/lib/session";
import type { DocumentContent } from "@/lib/types";
import { validateContent, validateTitle } from "@/lib/validation";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: { id: string };
};

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

    if (!(await canRead(doc.id, userId))) {
      return error("Forbidden", 403);
    }

    return json(doc);
  } catch (err) {
    console.error(err);
    return error("Internal server error", 500);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    if (!isUuid(context.params.id)) {
      return invalidUuidError("document id");
    }

    const userId = getCurrentUserId();
    const doc = await getDocumentById(context.params.id);

    if (!doc) {
      return error("Document not found", 404);
    }

    if (!(await canWrite(doc.id, userId))) {
      return error("Forbidden", 403);
    }

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) {
      return parsed.response;
    }

    const body = parsed.value;
    if (typeof body !== "object" || body === null) {
      return error("Invalid request body", 400);
    }

    const payload = body as {
      title?: unknown;
      content?: unknown;
      version?: unknown;
    };

    if (payload.version === undefined) {
      return error("version is required", 400);
    }

    if (typeof payload.version !== "number" || !Number.isInteger(payload.version)) {
      return error("version must be an integer", 400);
    }

    let nextTitle = doc.title;
    if (payload.title !== undefined) {
      if (typeof payload.title !== "string") {
        return error("title must be a string", 400);
      }
      const titleCheck = validateTitle(payload.title);
      if (!titleCheck.ok) {
        return error(titleCheck.error, 400);
      }
      nextTitle = payload.title.trim();
    }

    let nextContent: DocumentContent = doc.content;
    if (payload.content !== undefined) {
      const contentCheck = validateContent(payload.content);
      if (!contentCheck.ok) {
        return error(contentCheck.error, 400);
      }
      const content = payload.content as DocumentContent;
      nextContent = {
        type: "doc",
        content: Array.isArray(content.content) ? content.content : [],
      };
    }

    const updated = await updateDocument(
      doc.id,
      nextTitle,
      nextContent,
      payload.version
    );

    if (!updated) {
      const current = await getDocumentById(doc.id);
      return json(
        {
          error: "Version conflict",
          currentVersion: current?.version ?? payload.version,
        },
        409
      );
    }

    return json(updated);
  } catch (err) {
    console.error(err);
    return error("Internal server error", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
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

    await deleteDocument(doc.id);
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return error("Internal server error", 500);
  }
}
