-- CreateTable
CREATE TABLE "User" (
    "id" STRING NOT NULL,
    "username" STRING NOT NULL,
    "display_name" STRING,
    "avatar" STRING,
    "avatar_static" STRING,
    "header" STRING,
    "header_static" STRING,
    "followers_count" INT4 NOT NULL,
    "following_count" INT4 NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tweet" (
    "id" STRING NOT NULL,
    "permalink" STRING NOT NULL,
    "text" STRING NOT NULL,
    "authorId" STRING NOT NULL,

    CONSTRAINT "Tweet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_ids" ON "User"("id");

-- CreateIndex
CREATE INDEX "usernames" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Tweet" ADD CONSTRAINT "Tweet_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
