import { pool } from "../db"
import { v4 as uuid } from "uuid"
import bcrypt from "bcrypt"

export async function registerUser(
 phone: string,
 firstName: string,
 lastName: string,
 address: string,
 pin: string
){

 const id = uuid()

 // hash the pin
 const pinHash = await bcrypt.hash(pin,10)

 await pool.query(
 `
 INSERT INTO users(
  id,
  phone,
  first_name,
  last_name,
  address,
  pin_hash
 )
 VALUES($1,$2,$3,$4,$5,$6)
 `,
 [
  id,
  phone,
  firstName,
  lastName,
  address,
  pinHash
 ]
 )

 return {
  id,
  phone,
  firstName,
  lastName
 }

}