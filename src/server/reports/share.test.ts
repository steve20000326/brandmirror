import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getOrCreateReportShare, loadPublicReport, setReportShareEnabled } from "./share";

describe("report share disable", () => {
  let scanJobId = "";
  let brandId = "";
  let token = "";

  beforeAll(async () => {
    const brand = await prisma.brand.create({
      data: {
        name: "分享测试品牌",
        industry: "品牌女装",
        isCalibration: false,
      },
    });
    brandId = brand.id;
    const job = await prisma.scanJob.create({
      data: { brandId: brand.id, status: "completed", analysisStatus: "completed" },
    });
    scanJobId = job.id;
    await prisma.brandProfile.create({
      data: {
        brandId,
        scanJobId,
        portraitJson: JSON.stringify({
          audience: { summary: "暂无稳定认知", confidence: 0, evidenceCount: 0, providers: [] },
          priceTier: { summary: "暂无稳定认知", confidence: 0, evidenceCount: 0, providers: [] },
          style: { primary: [], secondary: [], confidence: 0 },
          scenarios: { strong: [], weak: [] },
          productAssociations: [],
          competitorAssociations: [],
          positiveAssociations: [],
          weakAssociations: [],
          recognitionGaps: [],
          modelDisagreements: [],
          executiveSummary: "暂无稳定认知",
          hasStableCognition: false,
          engineVersion: "brand-profile-v0.1",
        }),
        profileJson: JSON.stringify({
          awareness: 1,
          recommendation: 0,
          discovery: 0,
          alignment: 0,
          competitor: 0,
          aiBrandScore: 0.4,
          hallucinationRisk: 0,
          byProvider: {},
          competitorPoints: { brand: 0, competitors: {}, leader: null, leaderPoints: 0 },
          recognitionCounts: {},
        }),
      },
    });
    await prisma.diagnosis.create({
      data: {
        brandId,
        scanJobId,
        code: "LOW_DISCOVERY",
        severity: "high",
        title: "t",
      },
    });
    await prisma.prescription.createMany({
      data: Array.from({ length: 5 }, (_, i) => ({
        brandId,
        scanJobId,
        priority: i + 1,
        title: `p${i}`,
        evidence: "e",
        diagnosis: "d",
        action: "a",
      })),
    });
    const share = await getOrCreateReportShare(scanJobId);
    token = share.shareToken;
  });

  afterAll(async () => {
    if (brandId) await prisma.brand.delete({ where: { id: brandId } }).catch(() => undefined);
  });

  it("serves then disables the public link", async () => {
    const open = await loadPublicReport(token);
    expect(open.ok).toBe(true);
    await setReportShareEnabled(scanJobId, false);
    const closed = await loadPublicReport(token);
    expect(closed.ok).toBe(false);
    if (!closed.ok) expect(closed.reason).toBe("disabled");
  });
});
