import { toNextJsHandler } from "better-auth/next-js";

import type { createAuth } from "./server";

type AuthInstance = ReturnType<typeof createAuth>;

export function createNextAuthHandlers(auth: AuthInstance) {
  return toNextJsHandler(auth);
}
