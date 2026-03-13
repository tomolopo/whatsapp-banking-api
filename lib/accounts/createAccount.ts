import { pool } from "../db"
import { generateNUBAN } from "../nuban"
import { v4 as uuid } from "uuid"

export async function createAccount(userId:string){

 const accountNumber = generateNUBAN()

 const id = uuid()

 await pool.query(
 `
 INSERT INTO accounts(
  id,
  user_id,
  account_number,
  balance
 )
 VALUES($1,$2,$3,0)
 `,
 [
  id,
  userId,
  accountNumber
 ]
 )

 return {
  accountNumber
 }

}