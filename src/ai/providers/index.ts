import type { ModelProvider, ProviderId } from "./types";
import { DeepSeekProvider } from "./deepseek";
import { TencentHyProvider } from "./hunyuan";
import { QwenProvider } from "./qwen";

export type { ModelMessage, ModelProvider, ModelRequest, ModelResponse, ProviderId } from "./types";
export { DeepSeekProvider } from "./deepseek";
export { TencentHyProvider, HunyuanProvider } from "./hunyuan";
export { QwenProvider } from "./qwen";

const PROVIDERS: Record<ProviderId, () => ModelProvider> = {
  deepseek: () => new DeepSeekProvider(),
  "tencent-hy": () => new TencentHyProvider(),
  qwen: () => new QwenProvider(),
};

export function getProvider(id: ProviderId): ModelProvider {
  return PROVIDERS[id]();
}

export function listScanProviders(): ModelProvider[] {
  return [new DeepSeekProvider(), new TencentHyProvider(), new QwenProvider()];
}

export function getUnconfiguredScanProviders(): ProviderId[] {
  return listScanProviders()
    .filter((p) => !p.isConfigured())
    .map((p) => p.provider);
}
