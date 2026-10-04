import type { ProviderId } from "@/ai/providers/types";

export const SCAN_BATCH_SIZE = 6;
export const SCAN_CONCURRENCY = 3;
export const SCAN_MAX_ATTEMPTS = 3;
export const SCAN_SURFACE_TYPE = "model_api";
export const SCAN_SEARCH_ENABLED = false;

export const SCAN_PROVIDER_IDS: ProviderId[] = ["deepseek", "tencent-hy", "qwen"];

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  deepseek: "DeepSeek",
  "tencent-hy": "Tencent HY",
  qwen: "Qwen",
};

export const PROVIDER_MODEL_LABELS: Record<ProviderId, string> = {
  deepseek: "DeepSeek V4.1 Flash",
  "tencent-hy": "Tencent Hy3",
  qwen: "Qwen3.8 Flash",
};

export type ScanJobStatus = "pending" | "running" | "completed" | "partial" | "failed";

export type ObservationStatus = "pending" | "running" | "completed" | "failed";

export type ProviderProgress = {
  provider: ProviderId;
  completed: number;
  failed: number;
  pending: number;
  running: number;
  total: number;
};

export type ScanProgress = {
  scanJobId: string;
  brandId: string;
  status: string;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  pendingTasks: number;
  byProvider: ProviderProgress[];
  startedAt: Date | null;
  completedAt: Date | null;
};
