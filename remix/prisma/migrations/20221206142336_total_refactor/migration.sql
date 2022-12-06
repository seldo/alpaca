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
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" STRING NOT NULL,
    "userInstance" STRING NOT NULL,
    "display_name" STRING,
    "json" JSONB NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "permalink" STRING NOT NULL,
    "text" STRING NOT NULL,
    "hash" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "json" JSONB NOT NULL,
    "authorName" STRING NOT NULL,
    "authorInstance" STRING NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEntry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorName" STRING NOT NULL,
    "authorInstance" STRING NOT NULL,
    "postHash" STRING NOT NULL,
    "viewerName" STRING NOT NULL,
    "viewerInstance" STRING NOT NULL,

    CONSTRAINT "TimelineEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "type" STRING NOT NULL,
    "json" JSONB NOT NULL,
    "hash" STRING NOT NULL,
    "viewerName" STRING NOT NULL,
    "viewerInstance" STRING NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "names" ON "Instance"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Instance_name_key" ON "Instance"("name");

-- CreateIndex
CREATE INDEX "external_accounts" ON "User"("username", "userInstance");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_userInstance_key" ON "User"("username", "userInstance");

-- CreateIndex
CREATE INDEX "posts_by_author" ON "Post"("authorName", "authorInstance");

-- CreateIndex
CREATE INDEX "post_by_author" ON "Post"("authorName", "authorInstance", "hash");

-- CreateIndex
CREATE UNIQUE INDEX "Post_authorName_authorInstance_hash_key" ON "Post"("authorName", "authorInstance", "hash");

-- CreateIndex
CREATE INDEX "entries_for_viewer" ON "TimelineEntry"("viewerName", "viewerInstance");

-- CreateIndex
CREATE INDEX "entries_for_viewer_by_time" ON "TimelineEntry"("viewerName", "viewerInstance", "seenAt");

-- CreateIndex
CREATE UNIQUE INDEX "TimelineEntry_viewerName_viewerInstance_authorName_authorIn_key" ON "TimelineEntry"("viewerName", "viewerInstance", "authorName", "authorInstance", "seenAt");

-- CreateIndex
CREATE INDEX "notifications_for_viewer" ON "Notification"("viewerName", "viewerInstance");

-- CreateIndex
CREATE INDEX "notifications_for_viewer_by_time" ON "Notification"("viewerName", "viewerInstance", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_viewerName_viewerInstance_hash_key" ON "Notification"("viewerName", "viewerInstance", "hash");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_userInstance_fkey" FOREIGN KEY ("userInstance") REFERENCES "Instance"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorName_authorInstance_fkey" FOREIGN KEY ("authorName", "authorInstance") REFERENCES "User"("username", "userInstance") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorInstance_fkey" FOREIGN KEY ("authorInstance") REFERENCES "Instance"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEntry" ADD CONSTRAINT "TimelineEntry_authorName_authorInstance_postHash_fkey" FOREIGN KEY ("authorName", "authorInstance", "postHash") REFERENCES "Post"("authorName", "authorInstance", "hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEntry" ADD CONSTRAINT "TimelineEntry_viewerName_viewerInstance_fkey" FOREIGN KEY ("viewerName", "viewerInstance") REFERENCES "User"("username", "userInstance") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEntry" ADD CONSTRAINT "TimelineEntry_viewerInstance_fkey" FOREIGN KEY ("viewerInstance") REFERENCES "Instance"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_viewerName_viewerInstance_fkey" FOREIGN KEY ("viewerName", "viewerInstance") REFERENCES "User"("username", "userInstance") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_viewerInstance_fkey" FOREIGN KEY ("viewerInstance") REFERENCES "Instance"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
