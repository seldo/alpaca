/*
  Warnings:

  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_authorId_fkey";

-- DropTable
DROP TABLE "Account";

-- DropTable
DROP TABLE "Post";

-- CreateTable
CREATE TABLE "Notification" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "type" STRING NOT NULL,
    "json" JSONB NOT NULL,
    "userId" STRING NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
