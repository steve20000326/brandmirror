import { ProviderError, isNonRetryableStatus } from "./errors";
import type { ModelMessage, ModelUsageData } from "./types";

export type OpenAICompatibleParams = {
  baseURL: string;
  apiKey: string;
  model: string;
  messages: ModelMessage[];
  temperature?: number;
  maxTokens?: number;
  extraBody?: Record<string, unknown>;
  timeoutMs?: number;
};

export type OpenAICompatibleResult = {
  content: string;
  usage?: ModelUsageData;
  responseId?: string;
  latencyMs: number;
};

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function extractContent(message: unknown): string {
  if (!message || typeof message !== "object") return "";
  const content = (message as { content?: unknown }).content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: unknown }).text ?? "");
        }
        return "";
      })
      .join("")
      .trim();
  }
  return "";
}

/**
 * Shared OpenAI-compatible chat/completions caller.
 * Providers only add extra body fields (thinking, etc.).
 */
export async function chatCompletions(
  params: OpenAICompatibleParams,
): Promise<OpenAICompatibleResult> {
  if (!params.apiKey) {
    throw new ProviderError({
      message: "模型尚未配置",
      code: "config",
      retryable: false,
    });
  }

  const url = joinUrl(params.baseURL, "/chat/completions");
  const timeoutMs = params.timeoutMs ?? 30_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  const body: Record<string, unknown> = {
    model: params.model,
    messages: params.messages,
    stream: false,
    ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
    ...(params.maxTokens !== undefined ? { max_tokens: params.maxTokens } : {}),
    ...(params.extraBody ?? {}),
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const latencyMs = Date.now() - started;
    const rawText = await res.text();
    let json: unknown = null;
    try {
      json = rawText ? JSON.parse(rawText) : null;
    } catch {
      json = null;
    }

    if (!res.ok) {
      const retryable = !isNonRetryableStatus(res.status) && (res.status === 429 || res.status >= 500);
      throw new ProviderError({
        message: `模型请求失败（HTTP ${res.status}）`,
        code: "http",
        status: res.status,
        retryable,
      });
    }

    const data = json as {
      id?: string;
      choices?: Array<{ message?: unknown }>;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };

    const content = extractContent(data?.choices?.[0]?.message);
    if (!content) {
      throw new ProviderError({
        message: "模型返回空内容",
        code: "empty",
        retryable: true,
      });
    }

    const usage = data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined;

    return {
      content,
      usage,
      responseId: data.id,
      latencyMs,
    };
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new ProviderError({
        message: "模型请求超时",
        code: "timeout",
        retryable: true,
      });
    }
    throw new ProviderError({
      message: "模型网络错误",
      code: "network",
      retryable: true,
    });
  } finally {
    clearTimeout(timer);
  }
}
