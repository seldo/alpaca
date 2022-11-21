const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");
require('dotenv').config()

let accountValues = Array(3)

// Wrapper for a transaction.  This automatically re-calls the operation with
// the client as an argument as long as the database server asks for
// the transaction to be retried.
async function retryTxn(n, max, client, operation, callback) {
  const backoffInterval = 100; // millis
  const maxTries = 5;
  let tries = 0;

  while (true) {
    await client.query('BEGIN;');

    tries++;

    try {
      const result = await operation(client, callback);
      await client.query('COMMIT;');
      return result;
    } catch (err) {
      await client.query('ROLLBACK;');

      if (err.code !== '40001' || tries == maxTries) {
        throw err;
      } else {
        console.log('Transaction failed. Retrying.');
        console.log(err.message);
        await new Promise(r => setTimeout(r, tries * backoffInterval));
      }
    }
  }
}

// This function is called within the first transaction. It inserts some initial values into the "accounts" table.
async function initTable(client, callback) {
  let i = 0;
  while (i < 3) {
    accountValues[i] = await uuidv4();
    i++;
  }

  const insertStatement =
    "INSERT INTO accounts (id, balance) VALUES ($1, 1000), ($2, 250), ($3, 0);";
  await client.query(insertStatement, accountValues, callback);

  const selectBalanceStatement = "SELECT id, balance FROM accounts;";
  await client.query(selectBalanceStatement, callback);
}

// Run the transactions in the connection pool
(async () => {
  const connectionString = process.env.CDB_URL;
  const pool = new Pool({
    connectionString,
    application_name: "alpaca",
  });

  // Connect to database
  const client = await pool.connect();

  // Callback
  function cb(err, res) {
    if (err) throw err;

    if (res.rows.length > 0) {
      console.log("New account balances:");
      res.rows.forEach((row) => {
        console.log(row);
      });
    }
  }

  // Initialize table in transaction retry wrapper
  console.log("Initializing accounts table...");
  await retryTxn(0, 15, client, initTable, cb);

  // Exit program
  process.exit();
})().catch((err) => console.log(err.stack))
