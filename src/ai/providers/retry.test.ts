import { afterEach, describe, expect, it, vi } from "vitest";
import { ProviderError, shouldRetry } from "./errors";
import { chatCompletions } from "./openai-compatible";

describe("retry policy", () => {
  it("retries 429", () => {
    const err = new ProviderError({
      message: "HTTP 429",
      code: "http",
      status: 429,
      retryable: true,
    });
    expect(shouldRetry(err)).toBe(true);
  });

  it("does not retry 401", () => {
    const err = new ProviderError({
      message: "HTTP 401",
      code: "http",
      status: 401,
      retryable: false,
    });
    expect(shouldRetry(err)).toBe(false);
  });

  it("does not retry 403", () => {
    const err = new ProviderError({
      message: "HTTP 403",
      code: "http",
      status: 403,
      retryable: false,
    });
    expect(shouldRetry(err)).toBe(false);
  });
});

describe("openai-compatible HTTP mapping", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("marks 429 as retryable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("rate limit", { status: 429 })),
    );
    await expect(
      chatCompletions({
        baseURL: "https://example.com/v1",
        apiKey: "test-key",
        model: "x",
        messages: [{ role: "user", content: "hi" }],
      }),
    ).rejects.toMatchObject({ status: 429, retryable: true });
  });

  it("marks 401 as not retryable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("unauthorized", { status: 401 })),
    );
    await expect(
      chatCompletions({
        baseURL: "https://example.com/v1",
        apiKey: "test-key",
        model: "x",
        messages: [{ role: "user", content: "hi" }],
      }),
    ).rejects.toMatchObject({ status: 401, retryable: false });
  });
});
