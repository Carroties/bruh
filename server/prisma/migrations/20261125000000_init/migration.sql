CREATE TYPE "ReportType" AS ENUM ('LOST', 'FOUND');
CREATE TYPE "Category" AS ENUM ('ELECTRONICS', 'ID_CARD', 'BOTTLE', 'CLOTHING', 'ACCESSORIES', 'OTHER');
CREATE TYPE "ContactMethod" AS ENUM ('EMAIL', 'WHATSAPP');
CREATE TABLE "Report" (
  "id" UUID NOT NULL,
  "type" "ReportType" NOT NULL,
  "itemName" VARCHAR(100) NOT NULL,
  "description" VARCHAR(2000) NOT NULL,
  "category" "Category" NOT NULL,
  "location" VARCHAR(100) NOT NULL,
  "occurredAt" DATE NOT NULL,
  "contactMethod" "ContactMethod" NOT NULL,
  "contactValue" VARCHAR(254) NOT NULL,
  "imageUrl" TEXT,
  "imagePublicId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Report_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Report_nonempty" CHECK (length(trim("itemName")) >= 3 AND length(trim("description")) >= 10 AND length(trim("location")) >= 2),
  CONSTRAINT "Report_image_pair" CHECK (("imageUrl" IS NULL) = ("imagePublicId" IS NULL))
);
CREATE UNIQUE INDEX "Report_imagePublicId_key" ON "Report"("imagePublicId");
CREATE INDEX "Report_createdAt_id_idx" ON "Report"("createdAt", "id");
CREATE INDEX "Report_type_category_location_idx" ON "Report"("type", "category", "location");
