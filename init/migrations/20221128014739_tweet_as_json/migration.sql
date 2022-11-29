/*
  Warnings:

  - Changed the type of `json` on the `Tweet` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Tweet" DROP COLUMN "json";
ALTER TABLE "Tweet" ADD COLUMN     "json" JSONB NOT NULL;
