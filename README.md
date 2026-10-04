# BrandMirror

AI品牌认知与GEO诊断工具。

## 当前阶段

```text
MVP / Day 3
```

## 技术栈

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma ORM + SQLite
- Zod（服务端表单校验）
- Vitest

## 本地启动

```bash
npm install
npx prisma migrate dev
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

在 `.env` 填写 DeepSeek / Tencent TokenHub / 阿里云百炼（Qwen）密钥后，可到 `/admin/models` 测试连接。

## 测试

```bash
npm test
```

## Prisma Studio

```bash
npx prisma studio
```

## Day 3完成能力

```text
模型基线扫描（DeepSeek Flash / Hy3 / Qwen3.8 Flash）
90条 Observation 分批执行
原始回答 + Token 记录
扫描进度页 / 结果页
```

## Day 2完成能力

```text
Fashion Industry Pack（fashion-v0.1）
120条女装标准母题
确定性30题生成器
Question表保存
测试方案页面 /brands/[id]/questions
```

## 尚未开发

```text
GEO评分
AI品牌画像
GEO处方
会员
支付
```

## AI Provider 规则

详见 [`src/ai/README.md`](src/ai/README.md)。Day 3 结果为模型 API 基线，不等同于消费者 App 回答。
