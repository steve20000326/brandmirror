# BrandMirror

AI品牌认知与GEO诊断工具。

## 当前阶段

```text
MVP / Day 2
```

## 技术栈

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma ORM + SQLite
- Zod（服务端表单校验）
- Vitest（问题生成器单元测试）

## 本地启动

```bash
npm install
npx prisma migrate dev
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

## 测试

```bash
npm test
```

## Prisma Studio

```bash
npx prisma studio
```

## Day 2完成能力

```text
Fashion Industry Pack（fashion-v0.1）
120条女装标准母题
确定性30题生成器
Question表保存
测试方案页面 /brands/[id]/questions
幂等生成（不重复写60条）
```

## Day 1完成能力

```text
品牌创建
竞品保存
品牌列表
品牌详情
SQLite
Prisma
ModelProvider基础接口
Health Check
```

## 尚未开发

```text
模型扫描
GEO评分
AI品牌画像
GEO处方
会员
支付
```

## AI Provider 规则

详见 [`src/ai/README.md`](src/ai/README.md)。Day 1～2 不调用真实模型 API。
