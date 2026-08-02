import { error, json } from "@/lib/http";
import { createDocument, listOwnedDocuments, listSharedDocuments } from "@/lib/queries";
import { parseOptionalJsonBody } from "@/lib/request";
import { getCurrentUserId } from "@/lib/session";
import type { DocumentContent } from "@/lib/types";
import { validateTitle } from "@/lib/validation";

export const dynamic = "force-dynamic";

const EMPTY_CONTENT: DocumentContent = { type: "doc", content: [] };

export async function GET() {
  try {
    const userId = getCurrentUserId();
    const [owned, shared] = await Promise.all([
      listOwnedDocuments(userId),
      listSharedDocuments(userId),
    ]);
    return json({ owned, shared });
  } catch (err) {
    console.error(err);
    return error("Internal server error", 500);
  }
}

export async function POST(request: Request) {
  try {
    const userId = getCurrentUserId();

    const parsed = await parseOptionalJsonBody(request);
    if (!parsed.ok) {
      return parsed.response;
    }

    let title = "Untitled document";
    const body = parsed.value;
    if (
      typeof body === "object" &&
      body !== null &&
      "title" in body &&
      (body as { title: unknown }).title !== undefined
    ) {
      const rawTitle = (body as { title: unknown }).title;
      if (typeof rawTitle !== "string") {
        return error("title must be a string", 400);
      }
      const titleCheck = validateTitle(rawTitle);
      if (!titleCheck.ok) {
        return error(titleCheck.error, 400);
      }
      title = rawTitle.trim();
    }

    const document = await createDocument(userId, title, EMPTY_CONTENT);
    return json(document, 201);
  } catch (err) {
    console.error(err);
    return error("Internal server error", 500);
  }
}
