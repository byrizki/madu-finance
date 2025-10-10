import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";

import { getMemberAvatar } from "@/lib/db/queries";
import { requireSessionFromRequest } from "@/lib/auth/guard";

function buildDataUrlResponse(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    return NextResponse.json({ error: "Invalid avatar data" }, { status: 400 });
  }

  const [, type, payload] = match;
  const buffer = Buffer.from(payload, "base64");

  return new Response(buffer, {
    headers: {
      "Content-Type": type || "image/png",
      "Content-Length": buffer.length.toString(),
      "Cache-Control": "public, max-age=60",
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("id");

  const sessionResult = await requireSessionFromRequest(request);
  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  try {
    const avatar = await getMemberAvatar(userId || sessionResult.context.user.id);

    if (!avatar) {
      return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
    }

    if (avatar.startsWith("data:")) {
      return buildDataUrlResponse(avatar);
    }

    if (/^https?:\/\//i.test(avatar)) {
      const upstream = await fetch(avatar);
      if (!upstream.ok || !upstream.body) {
        console.error("Failed to fetch upstream avatar", upstream.status, upstream.statusText);
        return NextResponse.json({ error: "Failed to load avatar" }, { status: 502 });
      }

      const responseHeaders = new Headers();
      const contentType = upstream.headers.get("content-type") ?? "image/png";
      responseHeaders.set("Content-Type", contentType);
      const contentLength = upstream.headers.get("content-length");
      if (contentLength) {
        responseHeaders.set("Content-Length", contentLength);
      }
      responseHeaders.set("Cache-Control", "public, max-age=60");

      return new Response(upstream.body, {
        status: upstream.status,
        headers: responseHeaders,
      });
    }

    return NextResponse.json({ error: "Unsupported avatar format" }, { status: 400 });
  } catch (error) {
    console.error("Failed to fetch member avatar", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
