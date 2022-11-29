/*
  Warnings:

  - You are about to alter the column `id` on the `TimelineEntry` table. The data in that column will be cast from `Uuid` to `String`. This cast may fail. Please make sure the data in the column can be cast.

*/
-- RedefineTables
CREATE TABLE "_prisma_new_TimelineEntry" (
    "id" STRING NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewerId" STRING NOT NULL,
    "tweetId" STRING NOT NULL,

    CONSTRAINT "TimelineEntry_pkey" PRIMARY KEY ("id")
);
INSERT INTO "_prisma_new_TimelineEntry" ("id","seenAt","tweetId","viewerId") SELECT "id","seenAt","tweetId","viewerId" FROM "TimelineEntry";
DROP TABLE "TimelineEntry" CASCADE;
ALTER TABLE "_prisma_new_TimelineEntry" RENAME TO "TimelineEntry";
ALTER TABLE "TimelineEntry" ADD CONSTRAINT "TimelineEntry_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TimelineEntry" ADD CONSTRAINT "TimelineEntry_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "Tweet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
