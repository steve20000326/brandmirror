export type ModelMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ModelResponse = {
  provider: string;
  model: string;
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
};

/** Shared interface — all vendors must implement this. */
export interface ModelProvider {
  readonly provider: string;

  chat(params: {
    model?: string;
    messages: ModelMessage[];
    temperature?: number;
  }): Promise<ModelResponse>;
}
