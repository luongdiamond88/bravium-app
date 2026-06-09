-- CreateEnum
CREATE TYPE "FixedExpenseStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "fixed_expenses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "dueDay" INTEGER NOT NULL,
    "recurrence" TEXT NOT NULL DEFAULT 'monthly',
    "sourceText" TEXT,
    "category" TEXT,
    "status" "FixedExpenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fixed_expenses_userId_status_idx" ON "fixed_expenses"("userId", "status");

-- CreateIndex
CREATE INDEX "fixed_expenses_userId_dueDay_idx" ON "fixed_expenses"("userId", "dueDay");

-- AddForeignKey
ALTER TABLE "fixed_expenses" ADD CONSTRAINT "fixed_expenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
