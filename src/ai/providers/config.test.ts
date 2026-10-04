import { afterEach, describe, expect, it } from "vitest";
import {
  isDeepSeekConfigured,
  isQwenConfigured,
  isTencentHyConfigured,
} from "@/lib/env";
import { DeepSeekProvider } from "@/ai/providers/deepseek";
import { QwenProvider } from "@/ai/providers/qwen";
import { TencentHyProvider } from "@/ai/providers/hunyuan";

const KEYS = [
  "DEEPSEEK_API_KEY",
  "TENCENT_TOKENHUB_API_KEY",
  "QWEN_API_KEY",
  "QWEN_BASE_URL",
] as const;

const snapshot: Record<string, string | undefined> = {};

describe("provider configuration", () => {
  afterEach(() => {
    for (const key of KEYS) {
      if (snapshot[key] === undefined) delete process.env[key];
      else process.env[key] = snapshot[key];
    }
  });

  it("returns Not Configured when keys are missing", () => {
    for (const key of KEYS) {
      snapshot[key] = process.env[key];
      delete process.env[key];
    }
    expect(isDeepSeekConfigured()).toBe(false);
    expect(isTencentHyConfigured()).toBe(false);
    expect(isQwenConfigured()).toBe(false);
    expect(new DeepSeekProvider().isConfigured()).toBe(false);
    expect(new TencentHyProvider().isConfigured()).toBe(false);
    expect(new QwenProvider().isConfigured()).toBe(false);
  });
});
