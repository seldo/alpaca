/*
  Warnings:

  - You are about to drop the column `avatar_static` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `followers_count` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `following_count` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `header_static` on the `User` table. All the data in the column will be lost.
  - Added the required column `json` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatar_static";
ALTER TABLE "User" DROP COLUMN "followers_count";
ALTER TABLE "User" DROP COLUMN "following_count";
ALTER TABLE "User" DROP COLUMN "header_static";
ALTER TABLE "User" ADD COLUMN     "json" JSONB NOT NULL;
