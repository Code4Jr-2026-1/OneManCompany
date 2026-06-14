-- AlterTable
ALTER TABLE "GroupClass" ADD COLUMN "meetingLink" TEXT;
ALTER TABLE "GroupClass" ADD COLUMN "whatsappGroupLink" TEXT;

-- AlterTable
ALTER TABLE "ScheduledSession" ADD COLUMN "meetingLink" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN "phone" TEXT;
