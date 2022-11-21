-- CreateTable
CREATE TABLE "accounts" (
    "id" STRING NOT NULL,
    "balance" INT8 NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_ids" ON "accounts"("id");
