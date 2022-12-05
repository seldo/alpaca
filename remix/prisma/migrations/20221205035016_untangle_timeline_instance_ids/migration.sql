-- CreateTable
CREATE TABLE "Instance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" STRING NOT NULL,
    "url" STRING NOT NULL,
    "clientKey" STRING,
    "clientSecret" STRING,

    CONSTRAINT "Instance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "instanceId" UUID NOT NULL,
    "id" STRING NOT NULL,
    "username" STRING NOT NULL,
    "display_name" STRING,
    "avatar" STRING,
    "header" STRING,
    "json" JSONB NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("instanceId","id")
);

-- CreateTable
CREATE TABLE "Tweet" (
    "id" STRING NOT NULL,
    "permalink" STRING NOT NULL,
    "text" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "authorId" STRING NOT NULL,
    "instanceId" UUID NOT NULL,
    "json" JSONB NOT NULL,

    CONSTRAINT "Tweet_pkey" PRIMARY KEY ("id","instanceId")
);

-- CreateTable
CREATE TABLE "TimelineEntry" (
    "id" STRING NOT NULL,
    "instanceId" UUID NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewerId" STRING NOT NULL,
    "tweetId" STRING NOT NULL,
    "tweetInstanceId" UUID NOT NULL,

    CONSTRAINT "TimelineEntry_pkey" PRIMARY KEY ("id","instanceId")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" STRING NOT NULL,
    "instanceId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "type" STRING NOT NULL,
    "json" JSONB NOT NULL,
    "userId" STRING NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id","instanceId")
);

-- CreateIndex
CREATE INDEX "names" ON "Instance"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Instance_name_key" ON "Instance"("name");

-- CreateIndex
CREATE INDEX "user_ids" ON "User"("id");

-- CreateIndex
CREATE INDEX "usernames" ON "User"("username", "instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_instanceId_key" ON "User"("username", "instanceId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tweet" ADD CONSTRAINT "Tweet_authorId_instanceId_fkey" FOREIGN KEY ("authorId", "instanceId") REFERENCES "User"("id", "instanceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tweet" ADD CONSTRAINT "Tweet_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEntry" ADD CONSTRAINT "TimelineEntry_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEntry" ADD CONSTRAINT "TimelineEntry_viewerId_instanceId_fkey" FOREIGN KEY ("viewerId", "instanceId") REFERENCES "User"("id", "instanceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEntry" ADD CONSTRAINT "TimelineEntry_tweetId_tweetInstanceId_fkey" FOREIGN KEY ("tweetId", "tweetInstanceId") REFERENCES "Tweet"("id", "instanceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_instanceId_fkey" FOREIGN KEY ("userId", "instanceId") REFERENCES "User"("id", "instanceId") ON DELETE RESTRICT ON UPDATE CASCADE;
