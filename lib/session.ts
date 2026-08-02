// Authentication is deliberately simulated per the assignment brief;
// authorization is enforced server-side on every request.

import { cookies } from "next/headers";

export const DEFAULT_USER_ID = "11111111-1111-1111-1111-111111111111";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getCurrentUserId(): string {
  const value = cookies().get("userId")?.value;
  if (!value || !UUID_RE.test(value)) {
    return DEFAULT_USER_ID;
  }
  return value;
}

export function setCurrentUser(userId: string): void {
  cookies().set("userId", userId, {
    httpOnly: false,
    path: "/",
  });
}
