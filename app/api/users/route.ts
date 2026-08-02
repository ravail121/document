import { error, json } from "@/lib/http";
import { listUsers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await listUsers();
    return json(users);
  } catch (err) {
    console.error(err);
    return error("Internal server error", 500);
  }
}
