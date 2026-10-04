import { DeepSeekProvider } from "../src/ai/providers/deepseek";
import { TencentHyProvider } from "../src/ai/providers/hunyuan";
import { QwenProvider } from "../src/ai/providers/qwen";
import { CONSUMER_BASELINE_SYSTEM_PROMPT } from "../src/ai/prompts/consumer-baseline";
import type { ModelProvider } from "../src/ai/providers/types";

const STEP = process.argv[2] ?? "A";

function providers(): ModelProvider[] {
  return [new DeepSeekProvider(), new TencentHyProvider(), new QwenProvider()];
}

async function stepA() {
  for (const p of providers()) {
    const configured = p.isConfigured();
    if (!configured) {
      console.log(`${p.provider}\t${p.model}\tNot Configured`);
      continue;
    }
    const result = await p.testConnection();
    console.log(
      `${p.provider}\t${p.model}\t${result.ok ? "Connected" : "Failed"}\t${result.latencyMs}ms${result.error ? `\t${result.error}` : ""}`,
    );
  }
}

async function stepQuestion(text: string) {
  for (const p of providers()) {
    console.log(`\n--- ${p.provider} ---`);
    const result = await p.chat({
      messages: [
        { role: "system", content: CONSUMER_BASELINE_SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      temperature: 0.3,
      maxTokens: 800,
    });
    console.log(result.content);
    console.log(
      `[tokens prompt=${result.usage?.promptTokens ?? "?"} completion=${result.usage?.completionTokens ?? "?"} total=${result.usage?.totalTokens ?? "?"} latency=${result.latencyMs}ms]`,
    );
  }
}

async function main() {
  if (STEP === "A") await stepA();
  else if (STEP === "B") await stepQuestion("国内中高端职业女装有哪些选择？");
  else if (STEP === "C") await stepQuestion("澜序女装属于什么价格档次？");
  else throw new Error("unknown step");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : "failed");
  process.exit(1);
});
