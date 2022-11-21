import { Handler } from '@netlify/functions'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const handler = async (event, context) => {
  await prisma.accounts.create({
    data: {
      id: uuidv4(),
      balance: Math.round(Math.random() * 1000)
    },
  });

  return {
    statusCode: 200,
    body: "Yes"
  };
}

export { handler }
