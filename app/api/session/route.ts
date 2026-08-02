import { error, json } from "@/lib/http";
import { listUsers } from "@/lib/queries";
import { isUuid, parseJsonBody } from "@/lib/request";
import { setCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const parsed = await parseJsonBody(request);
    if (!parsed.ok) {
      return parsed.response;
    }

    const body = parsed.value;
    const userId =
      typeof body === "object" &&
      body !== null &&
      "userId" in body &&
      typeof (body as { userId: unknown }).userId === "string"
        ? (body as { userId: string }).userId
        : null;

    if (!userId) {
      return error("userId is required", 400);
    }

    if (!isUuid(userId)) {
      return error("Invalid userId", 400);
    }

    const users = await listUsers();
    const exists = users.some((user) => user.id === userId);
    if (!exists) {
      return error("User not found", 404);
    }

    setCurrentUser(userId);
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return error("Internal server error", 500);
  }
}
