import { Handler } from '@netlify/functions'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const handler = async (event, context) => {

  const accounts = await prisma.accounts.findMany()

  return {
    statusCode: 200,
    body: JSON.stringify(accounts.map( (account) => {
      return {
        id: account.id,
        balance: account.balance.toString()
      }
    }))
  };
}

export { handler }