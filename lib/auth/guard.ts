import { NextResponse } from "next/server";

import { auth, type Auth } from "./index";

export type AuthSession = Auth["$Infer"]["Session"];

interface RequireSessionSuccess {
  context: {
    session: AuthSession;
    user: AuthSession["user"];
  };
}

export function createRequestFromHeaders(headers: Headers): Request {
  return new Request("http://localhost", {
    headers,
  });
}

interface RequireSessionFailure {
  response: NextResponse;
}

export type RequireSessionResult = RequireSessionSuccess | RequireSessionFailure;

export async function requireSessionFromRequest(request: Request): Promise<RequireSessionResult> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    context: {
      session,
      user: session.user,
    },
  };
}
