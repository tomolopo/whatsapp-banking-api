import bcrypt from "bcryptjs"
import { pool } from "./lib/db"

async function resetPin(){

 const phone = "2349034702192" // 👈 your number
 const newPin = "1234"         // 👈 your new PIN

 try{

  const hash = await bcrypt.hash(newPin, 10)

  await pool.query(
   `
   UPDATE users
   SET pin_hash=$1,
       pin_attempts=0,
       pin_locked_until=NULL
   WHERE phone=$2
   `,
   [hash, phone]
  )

  console.log("✅ PIN reset successful")

 }catch(err){
  console.error("❌ Error resetting PIN:", err)
 }

 process.exit()
}

resetPin()