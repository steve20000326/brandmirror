# BrandMirror pricing

Prices live only in `pricing-config.ts`.

| Provider | Status | Notes |
|---|---|---|
| DeepSeek Flash | Peak USD (conservative) | Official docs peak cache-miss $0.30 / $1.20 per 1M. UI marks “Estimated using peak pricing.” |
| Qwen3.8 Flash | CNY list | ¥0.8 input / ¥2.7 output per 1M, `effectiveFrom` 2026-10-05 |
| Tencent Hy3 | Unconfigured unless env | Set `HY3_INPUT_PER_1M` and `HY3_OUTPUT_PER_1M`. Do not invent TokenHub prices. |

USD and CNY are never converted or summed.
