export type ProviderId = "deepseek" | "tencent-hy" | "qwen";

export type ModelMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface ModelUsageData {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface ModelResponse {
  provider: ProviderId;
  model: string;
  content: string;
  usage?: ModelUsageData;
  responseId?: string;
  latencyMs?: number;
}

export interface ModelRequest {
  messages: ModelMessage[];
  maxTokens?: number;
  temperature?: number;
}

export type ConnectionTestResult = {
  ok: boolean;
  latencyMs: number;
  error?: string;
};

export interface ModelProvider {
  readonly provider: ProviderId;
  readonly model: string;

  isConfigured(): boolean;

  chat(request: ModelRequest): Promise<ModelResponse>;

  testConnection(): Promise<ConnectionTestResult>;
}
