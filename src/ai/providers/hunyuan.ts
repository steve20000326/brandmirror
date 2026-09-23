import type { ModelProvider, ModelResponse } from "./types";

/** Day 1 stub — real Hunyuan calls land in Day 3. */
export class HunyuanProvider implements ModelProvider {
  readonly provider = "hunyuan";

  async chat(): Promise<ModelResponse> {
    throw new Error("Hunyuan provider is not configured yet.");
  }
}
