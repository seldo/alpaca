/*
  Warnings:

  - A unique constraint covering the columns `[viewerName,viewerInstance,authorName,authorInstance,postHash]` on the table `TimelineEntry` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "TimelineEntry_viewerName_viewerInstance_authorName_authorIn_key";

-- CreateIndex
CREATE UNIQUE INDEX "TimelineEntry_viewerName_viewerInstance_authorName_authorIn_key" ON "TimelineEntry"("viewerName", "viewerInstance", "authorName", "authorInstance", "postHash");
