import { createScanJobForBrand } from "../src/server/scans/actions";
import { getScanProgress } from "../src/server/scans/queries";
import { processScanBatch } from "../src/server/scans/runner";
import { prisma } from "../src/lib/prisma";

const brandId = "cmuct10de0000zgvzodr6dqnr";

async function main() {
  const created = await createScanJobForBrand(brandId);
  if (!created.ok) {
    console.error(created.error);
    process.exit(1);
  }
  console.log(`scanJobId=${created.scanJobId} created=${created.created}`);

  let pending = 1;
  let batches = 0;
  while (pending > 0) {
    const result = await processScanBatch(created.scanJobId);
    batches += 1;
    pending = result.pending;
    console.log(
      `batch=${batches} processed=${result.processed} completed=${result.completed} failed=${result.failed} pending=${result.pending} status=${result.status}`,
    );
  }

  const progress = await getScanProgress(created.scanJobId);
  console.log(JSON.stringify(progress, null, 2));
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err instanceof Error ? err.message : "scan failed");
  await prisma.$disconnect();
  process.exit(1);
});
