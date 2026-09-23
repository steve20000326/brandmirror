import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(
    (val) => !val || /^https?:\/\/.+/i.test(val),
    "请输入合法的网址（以 http:// 或 https:// 开头）",
  );

export const createBrandSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "品牌名称不能为空")
    .max(80, "品牌名称请控制在80字以内"),
  industry: z
    .string()
    .trim()
    .min(1, "所属行业不能为空")
    .max(60, "所属行业请控制在60字以内"),
  websiteUrl: optionalUrl,
  officialStoreUrl: optionalUrl,
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  coreProducts: z.string().trim().max(1000).optional().or(z.literal("")),
  targetAudience: z.string().trim().max(500).optional().or(z.literal("")),
  priceTier: z.string().trim().max(100).optional().or(z.literal("")),
  desiredPositioning: z.string().trim().max(1000).optional().or(z.literal("")),
  desiredKeywords: z.string().trim().max(1000).optional().or(z.literal("")),
  competitors: z
    .array(z.string().trim())
    .max(3, "竞品最多填写3个")
    .default([]),
});

export type CreateBrandPayload = z.infer<typeof createBrandSchema>;

/** Parse FormData from the brand create form into a validated payload. */
export function parseBrandFormData(formData: FormData): CreateBrandPayload {
  const competitors = [1, 2, 3]
    .map((n) => String(formData.get(`competitor${n}`) ?? "").trim())
    .filter(Boolean);

  const raw = {
    name: String(formData.get("name") ?? ""),
    industry: String(formData.get("industry") ?? ""),
    websiteUrl: String(formData.get("websiteUrl") ?? ""),
    officialStoreUrl: String(formData.get("officialStoreUrl") ?? ""),
    description: String(formData.get("description") ?? ""),
    coreProducts: String(formData.get("coreProducts") ?? ""),
    targetAudience: String(formData.get("targetAudience") ?? ""),
    priceTier: String(formData.get("priceTier") ?? ""),
    desiredPositioning: String(formData.get("desiredPositioning") ?? ""),
    desiredKeywords: String(formData.get("desiredKeywords") ?? ""),
    competitors,
  };

  return createBrandSchema.parse(raw);
}

export function emptyToNull(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
