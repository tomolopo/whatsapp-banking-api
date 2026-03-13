import { pool } from "../db"
import { v4 as uuid } from "uuid"

export async function internalTransfer(
 fromAccount:string,
 toAccount:string,
 amount:number
){

 const client = await pool.connect()

 try{

 await client.query("BEGIN")

 await client.query(`
  UPDATE accounts
  SET balance = balance - $1
  WHERE account_number=$2
 `,
 [amount,fromAccount])

 await client.query(`
  UPDATE accounts
  SET balance = balance + $1
  WHERE account_number=$2
 `,
 [amount,toAccount])

 const txId = uuid()

 await client.query(`
  INSERT INTO transactions(id,amount,status)
  VALUES($1,$2,$3)
 `,
 [txId,amount,"completed"])

 await client.query("COMMIT")

 return { txId }

 }catch(err){

 await client.query("ROLLBACK")
 throw err

 }finally{

 client.release()

 }

}