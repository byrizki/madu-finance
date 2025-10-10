export class UnauthorizedAccountError extends Error {
  readonly code = "ACCOUNT_FORBIDDEN" as const;

  constructor(message = "Unauthorized account") {
    super(message);
    this.name = "UnauthorizedAccountError";
  }
}

export const createUnauthorizedAccountError = (message?: string) => new UnauthorizedAccountError(message);

export const isUnauthorizedAccountError = (error: unknown): error is UnauthorizedAccountError => {
  if (error instanceof UnauthorizedAccountError) {
    return true;
  }

  if (typeof error === "object" && error !== null) {
    return (
      "code" in error &&
      (error as { code?: unknown }).code === "ACCOUNT_FORBIDDEN" &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    );
  }

  return false;
};
