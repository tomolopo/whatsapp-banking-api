import { pool } from "./db"
import { v4 as uuid } from "uuid"

export async function logEvent(
 type:string,
 payload:any
){

 await pool.query(
 `
 INSERT INTO events(id,type,payload,status)
 VALUES($1,$2,$3,$4)
 `,
 [
  uuid(),
  type,
  JSON.stringify(payload),
  "pending"
 ]
 )

}