-- CreateTable
CREATE TABLE "community_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "source" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "caseSummary" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "redFlags" JSONB,
    "recommendedAction" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "community_requests_userId_createdAt_idx" ON "community_requests"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "community_requests_sessionId_createdAt_idx" ON "community_requests"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "community_requests" ADD CONSTRAINT "community_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
