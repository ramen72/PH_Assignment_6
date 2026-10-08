/*
  Warnings:

  - Made the column `brand` on table `assets` required. This step will fail if there are existing NULL values in that column.
  - Made the column `model` on table `assets` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "assets" ALTER COLUMN "brand" SET NOT NULL,
ALTER COLUMN "model" SET NOT NULL;
