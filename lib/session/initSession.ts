import { pool } from "../db"

export async function initSession(phone: string){

 try{

  // 🛑 INPUT VALIDATION
  if(!phone){
   throw new Error("Phone is required")
  }

  // 👤 CHECK USER
  const userResult = await pool.query(
  `
  SELECT id, first_name, last_name, address, email
  FROM users
  WHERE phone=$1
  `,
  [phone]
  )

  // ❌ USER DOES NOT EXIST
  if(userResult.rows.length === 0){

   return {
    userExists: false,
    user: null,
    hasAccount: false,
    accounts: [],
    balance: 0,
    lastTransactions: []
   }

  }

  const user = userResult.rows[0]
  const userId = user.id

  // 🏦 GET ACCOUNTS
  const accountsResult = await pool.query(
  `
  SELECT id, account_number, balance
  FROM accounts
  WHERE user_id=$1
  ORDER BY created_at ASC
  `,
  [userId]
  )

  const accounts = accountsResult.rows

  // ❌ NO ACCOUNT
  if(accounts.length === 0){

   return {
    userExists: true,
    user: {
     id: user.id,
     firstName: user.first_name,
     lastName: user.last_name,
     address: user.address,
     email: user.email
    },
    hasAccount: false,
    accounts: [],
    balance: 0,
    lastTransactions: []
   }

  }

  const primaryAccount = accounts[0]

  // 📜 GET LAST TRANSACTIONS (FIXED JOIN)
  const txResult = await pool.query(
  `
  SELECT 
   t.id,
   t.amount,
   t.type,
   t.status,
   t.created_at
  FROM transactions t
  JOIN ledger_entries l
  ON t.id = l.transaction_id
  WHERE l.account_id=$1
  ORDER BY t.created_at DESC
  LIMIT 5
  `,
  [primaryAccount.id]
  )

  return {

   userExists: true,

   user: {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    address: user.address,
    email: user.email
   },

   hasAccount: true,

   accounts: accounts.map(acc => ({
    accountNumber: acc.account_number,
    balance: acc.balance
   })),

   balance: primaryAccount.balance,

   lastTransactions: txResult.rows

  }

 }catch(err:any){

  console.error("initSession error:", err)

  return {
   success: false,
   error: err.message || "Failed to initialize session"
  }

 }

}