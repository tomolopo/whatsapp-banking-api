import { pool } from "../db"


export async function getCustomers() {
 try {

  const result = await pool.query(`
   SELECT
    id,
    first_name,
    last_name,
    address,
    phone,
    created_at
   FROM users
   ORDER BY created_at DESC
  `)

  return result.rows

 } catch (error) {
  console.error("getCustomers error:", error)
  throw error
 }
}

export async function getAccounts() {
 try {

  const result = await pool.query(`
   SELECT
    accounts.id,
    accounts.account_number,
    accounts.balance,
    users.first_name,
    users.last_name,
    users.phone
   FROM accounts
   INNER JOIN users
    ON users.id = accounts.user_id
   ORDER BY accounts.created_at DESC
  `)

  return result.rows

 } catch (error) {
  console.error("getAccounts error:", error)
  throw error
 }
}

export async function getBanks() {
 try {

  const result = await pool.query(`
   SELECT code,name
   FROM banks
   ORDER BY name
  `)

  return result.rows

 } catch (error) {
  console.error("getBanks error:", error)
  throw error
 }
}

