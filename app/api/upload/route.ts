import { error, json } from "@/lib/http";
import { parseMarkdownToDoc, parseTextToDoc } from "@/lib/parse";
import { createDocument } from "@/lib/queries";
import { getCurrentUserId } from "@/lib/session";
import { validateTitle } from "@/lib/validation";

export const dynamic = "force-dynamic";

const MAX_BYTES = 1024 * 1024;

function extensionOf(filename: string): string | null {
  const match = /\.([^.]+)$/.exec(filename.toLowerCase());
  return match ? match[1] : null;
}

function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").trim();
  return base.length > 0 ? base : "Untitled document";
}

export async function POST(request: Request) {
  try {
    const userId = getCurrentUserId();
    const formData = await request.formData();
    const entry = formData.get("file");

    // 1. A file is present
    if (!(entry instanceof File)) {
      return error("A file is required", 400);
    }

    const filename = entry.name || "";

    // 2. Extension is .txt or .md (do not trust MIME type alone)
    const extension = extensionOf(filename);
    if (extension !== "txt" && extension !== "md") {
      return error("Only .txt and .md files are supported", 400);
    }

    // 3. Size is under 1MB
    if (entry.size > MAX_BYTES) {
      return error("File must be under 1MB", 400);
    }

    // Read into memory as text. Do NOT write to disk — the production target
    // is serverless and has no persistent filesystem.
    const text = Buffer.from(await entry.arrayBuffer()).toString("utf8");

    // 4. Decoded text is not empty after trimming
    if (text.trim().length === 0) {
      return error("File is empty", 400);
    }

    const content =
      extension === "md" ? parseMarkdownToDoc(text) : parseTextToDoc(text);

    let title = titleFromFilename(filename);
    const titleCheck = validateTitle(title);
    if (!titleCheck.ok) {
      title = "Untitled document";
    }

    const document = await createDocument(userId, title, content);
    return json(document, 201);
  } catch (err) {
    console.error(err);
    return error("Internal server error", 500);
  }
}
