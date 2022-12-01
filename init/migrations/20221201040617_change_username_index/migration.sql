-- DropIndex
DROP INDEX "usernames";

-- CreateIndex
CREATE INDEX "usernames" ON "User"("username", "instance");
