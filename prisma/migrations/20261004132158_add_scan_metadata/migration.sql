-- AlterTable
ALTER TABLE "ModelUsage" ADD COLUMN "currency" TEXT;
ALTER TABLE "ModelUsage" ADD COLUMN "pricingVersion" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Observation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scanJobId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "rawResponse" TEXT,
    "brandMentioned" BOOLEAN,
    "brandRank" INTEGER,
    "recommended" BOOLEAN,
    "competitorsJson" TEXT,
    "attributesJson" TEXT,
    "analysisJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "surfaceType" TEXT NOT NULL DEFAULT 'model_api',
    "searchEnabled" BOOLEAN NOT NULL DEFAULT false,
    "latencyMs" INTEGER,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "responseId" TEXT,
    "promptVersion" TEXT NOT NULL DEFAULT 'consumer-baseline-v0.1',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Observation_scanJobId_fkey" FOREIGN KEY ("scanJobId") REFERENCES "ScanJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Observation_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Observation" ("analysisJson", "attributesJson", "brandMentioned", "brandRank", "competitorsJson", "createdAt", "errorMessage", "id", "model", "provider", "questionId", "rawResponse", "recommended", "scanJobId", "status", "updatedAt") SELECT "analysisJson", "attributesJson", "brandMentioned", "brandRank", "competitorsJson", "createdAt", "errorMessage", "id", "model", "provider", "questionId", "rawResponse", "recommended", "scanJobId", "status", "updatedAt" FROM "Observation";
DROP TABLE "Observation";
ALTER TABLE "new_Observation" RENAME TO "Observation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
