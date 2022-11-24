import { PrismaClient } from "@prisma/client";

let prisma;
var __db__;

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// in production we'll have a single connection to the DB.
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!__db__) {
    __db__ = new PrismaClient();
  }
  prisma = __db__;
  prisma.$connect();
}

export { prisma };