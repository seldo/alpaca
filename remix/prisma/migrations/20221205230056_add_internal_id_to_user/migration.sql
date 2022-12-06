/*
  Warnings:

  - You are about to drop the column `dataVerified` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "dataVerified";
ALTER TABLE "User" ADD COLUMN     "internalId" STRING;
