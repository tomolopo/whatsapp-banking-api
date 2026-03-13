import { pool } from "../db"

export async function initSession(phone: string){

 // CHECK USER
 const userResult = await pool.query(
 `
 SELECT id, first_name, last_name, address, email
 FROM users
 WHERE phone=$1
 `,
 [phone]
 )

 // USER DOES NOT EXIST
 if(userResult.rows.length === 0){

  return {
   userExists:false,
   firstName:null,
   lastName:null,
   address:null,
   email:null,
   hasAccount:false,
   accounts:[],
   balance:0,
   lastTransactions:[]
  }

 }

 const user = userResult.rows[0]
 const userId = user.id

 // GET ACCOUNTS
 const accountsResult = await pool.query(
 `
 SELECT account_number, balance
 FROM accounts
 WHERE user_id=$1
 `,
 [userId]
 )

 const accounts = accountsResult.rows

 // USER HAS NO ACCOUNT
 if(accounts.length === 0){

  return {
   userExists:true,
   firstName:user.first_name,
   lastName:user.last_name,
   address:user.address,
   email:user.email,
   hasAccount:false,
   accounts:[],
   balance:0,
   lastTransactions:[]
  }

 }

 const primaryAccount = accounts[0].account_number

 // LAST TRANSACTIONS
 const txResult = await pool.query(
 `
 SELECT amount, type, created_at
 FROM transactions
 WHERE account_number=$1
 ORDER BY created_at DESC
 LIMIT 5
 `,
 [primaryAccount]
 )

 return {

  userExists:true,

  firstName:user.first_name,
  lastName:user.last_name,
  address:user.address,
  email:user.email,

  hasAccount:true,

  accounts,

  balance:accounts[0].balance,

  lastTransactions:txResult.rows

 }

}