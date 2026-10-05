/**
 * Env helpers. Missing provider keys must not crash the app.
 * Keys are never logged.
 */

function read(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export const env = {
  get databaseUrl() {
    return read("DATABASE_URL") || "file:./dev.db";
  },
  get appName() {
    return read("APP_NAME") || "BrandMirror";
  },
  get appEnv() {
    return read("APP_ENV") || "development";
  },
};

export function isDeepSeekConfigured(): boolean {
  return Boolean(read("DEEPSEEK_API_KEY"));
}

export function isTencentHyConfigured(): boolean {
  return Boolean(read("TENCENT_TOKENHUB_API_KEY"));
}

export function isQwenConfigured(): boolean {
  return Boolean(read("QWEN_API_KEY") && read("QWEN_BASE_URL"));
}

export function getDeepSeekConfig() {
  return {
    apiKey: read("DEEPSEEK_API_KEY"),
    baseURL: read("DEEPSEEK_BASE_URL") || "https://api.deepseek.com",
    model: read("DEEPSEEK_MODEL") || "deepseek-flash",
  };
}

export function getTencentHyConfig() {
  return {
    apiKey: read("TENCENT_TOKENHUB_API_KEY"),
    baseURL: read("TENCENT_TOKENHUB_BASE_URL") || "https://tokenhub.tencentmaas.com/v1",
    model: read("TENCENT_HY_MODEL") || "hy3",
  };
}

export function getQwenConfig() {
  return {
    apiKey: read("QWEN_API_KEY"),
    baseURL: read("QWEN_BASE_URL"),
    model: read("QWEN_MODEL") || "qwen3.8-flash",
  };
}

export function getAnalyzerConfig() {
  return {
    provider: read("ANALYZER_PROVIDER") || "deepseek",
    model: read("ANALYZER_MODEL") || "deepseek-flash",
    promptVersion: read("ANALYZER_PROMPT_VERSION") || "observation-analyzer-v0.1",
  };
}
