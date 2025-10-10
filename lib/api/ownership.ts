import { NextResponse } from "next/server";

import { resolveAccountContext, type ResolvedAccountContext } from "./account-context";

interface AccountAccessParams {
  request: Request;
  params: Promise<{ account: string }> | { account: string };
  requireOwner?: boolean;
}

interface OwnershipOptions {
  resourceName?: string;
  requireOwner?: boolean;
  forbiddenMessage?: string;
}

interface OwnershipResult<T> {
  resource: T;
}

interface OwnershipFailure {
  response: NextResponse;
}

type AuthorizationResult = { context: ResolvedAccountContext } | { response: NextResponse };

type OwnershipCheckResult<T> = OwnershipResult<T> | OwnershipFailure;

const DEFAULT_NOT_FOUND_MESSAGE = "Resource not found";
const DEFAULT_FORBIDDEN_MESSAGE = "Forbidden";

function isPromise<T>(value: Promise<T> | { account: string }): value is Promise<T> {
  return typeof value === "object" && value !== null && typeof (value as Promise<T>).then === "function";
}

async function extractAccountSlug(params: Promise<{ account: string }> | { account: string }): Promise<string> {
  if (isPromise(params)) {
    const resolved = await params;
    return resolved?.account ?? "";
  }

  return params?.account ?? "";
}

export async function authorizeAccountAccess({ request, params, requireOwner = false }: AccountAccessParams): Promise<AuthorizationResult> {
  const accountSlug = await extractAccountSlug(params);
  return resolveAccountContext(request, accountSlug, { requireOwner });
}

export function ensureResourceOwnership<T extends { accountId: string | null | undefined }>(
  resource: T | null | undefined,
  context: ResolvedAccountContext,
  options: OwnershipOptions = {},
): OwnershipCheckResult<T> {
  const label = options.resourceName ?? DEFAULT_NOT_FOUND_MESSAGE;
  const forbiddenMessage = options.forbiddenMessage ?? DEFAULT_FORBIDDEN_MESSAGE;

  if (!resource) {
    return {
      response: NextResponse.json({ error: label }, { status: 404 }),
    };
  }

  if (!resource.accountId || resource.accountId !== context.account.id) {
    return {
      response: NextResponse.json({ error: label }, { status: 404 }),
    };
  }

  if (options.requireOwner && context.membershipRole !== "owner") {
    return {
      response: NextResponse.json({ error: forbiddenMessage }, { status: 403 }),
    };
  }

  return { resource };
}
