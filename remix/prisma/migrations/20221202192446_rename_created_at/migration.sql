/*
  Warnings:

  - You are about to drop the column `created_at` on the `Tweet` table. All the data in the column will be lost.
  - Added the required column `createdAt` to the `Tweet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Tweet" DROP COLUMN "created_at";
ALTER TABLE "Tweet" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL;
