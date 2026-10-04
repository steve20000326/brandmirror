import { getDeepSeekConfig, isDeepSeekConfigured } from "@/lib/env";
import { CONSUMER_BASELINE_SYSTEM_PROMPT } from "@/ai/prompts/consumer-baseline";
import { ProviderError } from "./errors";
import { chatCompletions } from "./openai-compatible";
import type {
  ConnectionTestResult,
  ModelProvider,
  ModelRequest,
  ModelResponse,
  ProviderId,
} from "./types";

export class DeepSeekProvider implements ModelProvider {
  readonly provider: ProviderId = "deepseek";

  get model(): string {
    return getDeepSeekConfig().model;
  }

  isConfigured(): boolean {
    return isDeepSeekConfigured();
  }

  async chat(request: ModelRequest): Promise<ModelResponse> {
    if (!this.isConfigured()) {
      throw new ProviderError({
        message: "DeepSeek尚未配置",
        code: "config",
        retryable: false,
      });
    }

    const cfg = getDeepSeekConfig();
    const result = await chatCompletions({
      baseURL: cfg.baseURL,
      apiKey: cfg.apiKey,
      model: cfg.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.3,
      maxTokens: request.maxTokens ?? 800,
      extraBody: {
        thinking: { type: "disabled" },
      },
    });

    return {
      provider: this.provider,
      model: cfg.model,
      content: result.content,
      usage: result.usage,
      responseId: result.responseId,
      latencyMs: result.latencyMs,
    };
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const started = Date.now();
    try {
      const result = await this.chat({
        messages: [
          { role: "system", content: CONSUMER_BASELINE_SYSTEM_PROMPT },
          { role: "user", content: "请只回复：OK" },
        ],
        maxTokens: 16,
        temperature: 0,
      });
      return { ok: true, latencyMs: result.latencyMs ?? Date.now() - started };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Date.now() - started,
        error: err instanceof Error ? err.message : "Connection Failed",
      };
    }
  }
}
