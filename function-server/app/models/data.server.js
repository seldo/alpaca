import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export const getThings = async () => {
    return await prisma.things.findMany()
}
