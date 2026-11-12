import type { User } from "@/interfaces/User";
import { ApiError } from "@/modules/api/client";
import request from "./_request";
import getUserData from "./getUserData";

/**
 * A user's full profile, including email and student number, for the user
 * themself or an admin. The public `/user/:id` stops returning those fields.
 * If this backend does not have `/user/:id/full` yet (404), fall back to the
 * public profile so admin pages keep working during the rollout.
 */
export default async function getFullUserData(
  userId: string,
  token: string,
  signal?: AbortSignal,
): Promise<User> {
  try {
    return await request.get("default", `/user/${userId}/full`, {
      token,
      requestOption: { signal },
    });
  } catch (error) {
    if (error instanceof ApiError && error.kind === "not-found") {
      return getUserData(userId, signal);
    }
    throw error;
  }
}
