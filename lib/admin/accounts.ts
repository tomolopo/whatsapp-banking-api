import { pool } from "../db"



/*
====================================
CUSTOMERS (SEARCH + PAGINATION)
====================================
*/

export async function getCustomers(
 search: string = "",
 limit: number = 10,
 offset: number = 0
){

 const result = await pool.query(

 `
 SELECT
  users.id,
  users.first_name,
  users.last_name,
  users.phone,
  users.address,
  users.created_at,

  accounts.account_number,
  accounts.balance,

  COUNT(transactions.id) AS transaction_count

 FROM users

 LEFT JOIN accounts
 ON accounts.user_id = users.id

 LEFT JOIN ledger_entries
 ON ledger_entries.account_id = accounts.id

 LEFT JOIN transactions
 ON transactions.id = ledger_entries.transaction_id

 WHERE
  users.first_name ILIKE $1
  OR users.last_name ILIKE $1
  OR users.phone ILIKE $1

 GROUP BY
  users.id,
  accounts.account_number,
  accounts.balance

 ORDER BY users.created_at DESC

 LIMIT $2
 OFFSET $3
 `,

 [`%${search}%`,limit,offset]

 )

 return result.rows

}




/*
====================================
ACCOUNTS
====================================
*/

export async function getAccounts(){

 const result = await pool.query(
 `
 SELECT
  accounts.id,
  accounts.account_number,
  accounts.balance,
  users.first_name,
  users.last_name,
  users.phone,
  accounts.created_at

 FROM accounts

 INNER JOIN users
  ON users.id = accounts.user_id

 ORDER BY accounts.created_at DESC
 LIMIT 100
 `
 )

 return result.rows

}




/*
====================================
BANKS
====================================
*/

export async function getBanks(){

 const result = await pool.query(
 `
 SELECT
  code,
  name
 FROM banks
 ORDER BY name
 `
 )

 return result.rows

}