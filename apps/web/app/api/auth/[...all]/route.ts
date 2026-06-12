import { createNextAuthHandlers } from "@workspace/auth/next";

import { auth } from "@/lib/auth";

export const { GET, POST } = createNextAuthHandlers(auth);
