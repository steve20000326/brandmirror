import type { ModelProvider, ModelResponse } from "./types";

/** Day 1 stub — real DeepSeek calls land in Day 3. */
export class DeepSeekProvider implements ModelProvider {
  readonly provider = "deepseek";

  async chat(): Promise<ModelResponse> {
    throw new Error("DeepSeek provider is not configured yet.");
  }
}
