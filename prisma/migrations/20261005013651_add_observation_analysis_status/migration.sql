-- AlterTable
ALTER TABLE "BrandProfile" ADD COLUMN "hallucinationRiskScore" REAL;
ALTER TABLE "BrandProfile" ADD COLUMN "providerMetricsJson" TEXT;

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
    "finishReason" TEXT,
    "analysisStatus" TEXT NOT NULL DEFAULT 'not_started',
    "analysisAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "analysisErrorMessage" TEXT,
    "analyzerVersion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Observation_scanJobId_fkey" FOREIGN KEY ("scanJobId") REFERENCES "ScanJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Observation_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Observation" ("analysisJson", "attemptCount", "attributesJson", "brandMentioned", "brandRank", "competitorsJson", "createdAt", "errorMessage", "id", "latencyMs", "model", "promptVersion", "provider", "questionId", "rawResponse", "recommended", "responseId", "scanJobId", "searchEnabled", "status", "surfaceType", "updatedAt") SELECT "analysisJson", "attemptCount", "attributesJson", "brandMentioned", "brandRank", "competitorsJson", "createdAt", "errorMessage", "id", "latencyMs", "model", "promptVersion", "provider", "questionId", "rawResponse", "recommended", "responseId", "scanJobId", "searchEnabled", "status", "surfaceType", "updatedAt" FROM "Observation";
DROP TABLE "Observation";
ALTER TABLE "new_Observation" RENAME TO "Observation";
CREATE TABLE "new_ScanJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brandId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalTasks" INTEGER NOT NULL DEFAULT 0,
    "completedTasks" INTEGER NOT NULL DEFAULT 0,
    "failedTasks" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "analysisStatus" TEXT NOT NULL DEFAULT 'not_started',
    "analyzedTasks" INTEGER NOT NULL DEFAULT 0,
    "analysisFailedTasks" INTEGER NOT NULL DEFAULT 0,
    "analysisStartedAt" DATETIME,
    "analysisCompletedAt" DATETIME,
    "analyzerVersion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScanJob_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ScanJob" ("brandId", "completedAt", "completedTasks", "createdAt", "failedTasks", "id", "startedAt", "status", "totalTasks", "updatedAt") SELECT "brandId", "completedAt", "completedTasks", "createdAt", "failedTasks", "id", "startedAt", "status", "totalTasks", "updatedAt" FROM "ScanJob";
DROP TABLE "ScanJob";
ALTER TABLE "new_ScanJob" RENAME TO "ScanJob";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
