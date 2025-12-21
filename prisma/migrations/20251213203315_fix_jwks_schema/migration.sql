/*
  Warnings:

  - Added the required column `privateKey` to the `jwks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "jwks" ADD COLUMN     "privateKey" TEXT NOT NULL,
ALTER COLUMN "algorithm" DROP NOT NULL;
