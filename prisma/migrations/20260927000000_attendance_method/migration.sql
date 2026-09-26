-- CreateEnum
CREATE TYPE "AttendanceMethod" AS ENUM ('QR', 'DIRECT');

-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "allowDirectCheckin" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "checkInMethod" "AttendanceMethod",
ADD COLUMN     "checkOutMethod" "AttendanceMethod";


-- Everything recorded so far came from a QR scan.
UPDATE "Attendance" SET "checkInMethod" = 'QR' WHERE "checkInTime" IS NOT NULL;
UPDATE "Attendance" SET "checkOutMethod" = 'QR' WHERE "checkOutTime" IS NOT NULL;
