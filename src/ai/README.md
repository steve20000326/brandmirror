# AI Provider Layer

BrandMirror 的模型调用必须走统一接口，避免业务层绑定某一厂商。

## 规则（不可破坏）

1. 业务层不能直接调用某个 AI 厂商 SDK。
2. 所有模型必须通过 `ModelProvider` 接口。
3. API 模型结果必须标记 `provider` 和 `model`。
4. 不得把 API 结果冒充为豆包 / 元宝 / Kimi 消费者客户端真实结果。
5. Consumer Surface 测试未来单独处理。
6. 每一次正式模型调用必须记录 token usage。

## Day 1 状态

- 已定义 `ModelProvider` 接口
- DeepSeek / Hunyuan 仅为占位 Stub，**不会**真实调用 API
