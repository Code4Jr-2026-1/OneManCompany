-- CreateTable
CREATE TABLE "GroupClass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coachId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "skillLevel" TEXT NOT NULL DEFAULT 'all',
    "capacity" INTEGER NOT NULL DEFAULT 10,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "groupRate" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GroupClass_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupEnrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupClassId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GroupEnrollment_groupClassId_fkey" FOREIGN KEY ("groupClassId") REFERENCES "GroupClass" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupClassId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "topicsCovered" TEXT,
    "coachNotes" TEXT,
    "aiSummary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupSession_groupClassId_fkey" FOREIGN KEY ("groupClassId") REFERENCES "GroupClass" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BillingEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "groupClassId" TEXT,
    "month" DATETIME NOT NULL,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "hours" REAL NOT NULL DEFAULT 0,
    "rateUsed" REAL NOT NULL DEFAULT 0,
    "amount" REAL NOT NULL DEFAULT 0,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BillingEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BillingEntry_groupClassId_fkey" FOREIGN KEY ("groupClassId") REFERENCES "GroupClass" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BillingEntry" ("amount", "createdAt", "hours", "id", "month", "paid", "paidAt", "rateUsed", "sessions", "studentId") SELECT "amount", "createdAt", "hours", "id", "month", "paid", "paidAt", "rateUsed", "sessions", "studentId" FROM "BillingEntry";
DROP TABLE "BillingEntry";
ALTER TABLE "new_BillingEntry" RENAME TO "BillingEntry";
CREATE TABLE "new_Homework" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "groupClassId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "resourceUrl" TEXT,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" DATETIME,
    "studentNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Homework_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Homework_groupClassId_fkey" FOREIGN KEY ("groupClassId") REFERENCES "GroupClass" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Homework" ("completedAt", "createdAt", "description", "dueDate", "id", "resourceUrl", "status", "studentId", "studentNote", "title") SELECT "completedAt", "createdAt", "description", "dueDate", "id", "resourceUrl", "status", "studentId", "studentNote", "title" FROM "Homework";
DROP TABLE "Homework";
ALTER TABLE "new_Homework" RENAME TO "Homework";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "GroupEnrollment_groupClassId_studentId_key" ON "GroupEnrollment"("groupClassId", "studentId");
