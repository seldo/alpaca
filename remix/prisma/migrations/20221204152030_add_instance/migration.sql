-- CreateTable
CREATE TABLE "Instance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "domain" STRING NOT NULL,
    "clientKey" STRING NOT NULL,
    "clientSecret" STRING NOT NULL,

    CONSTRAINT "Instance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "domains" ON "Instance"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "Instance_domain_key" ON "Instance"("domain");
