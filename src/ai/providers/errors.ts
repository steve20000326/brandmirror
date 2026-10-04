export type ProviderErrorCode = "timeout" | "http" | "network" | "config" | "empty";

export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly status?: number;
  readonly retryable: boolean;

  constructor(params: {
    message: string;
    code: ProviderErrorCode;
    status?: number;
    retryable: boolean;
  }) {
    super(params.message);
    this.name = "ProviderError";
    this.code = params.code;
    this.status = params.status;
    this.retryable = params.retryable;
  }
}

/** 401 / 403 / invalid request should not be retried. */
export function isNonRetryableStatus(status: number): boolean {
  return status === 400 || status === 401 || status === 403 || status === 404 || status === 422;
}

export function shouldRetry(error: unknown): boolean {
  if (error instanceof ProviderError) {
    return error.retryable;
  }
  return true;
}

/** Safe message for UI — never include secrets. */
export function publicErrorMessage(error: unknown): string {
  if (error instanceof ProviderError) {
    return error.message.replace(/sk-[A-Za-z0-9._-]+/g, "[redacted]");
  }
  if (error instanceof Error) {
    return error.message.replace(/sk-[A-Za-z0-9._-]+/g, "[redacted]").slice(0, 200);
  }
  return "模型调用失败";
}
