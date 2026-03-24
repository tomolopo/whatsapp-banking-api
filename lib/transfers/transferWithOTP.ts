import { generateOTP, verifyOTP } from "../otp"
import { internalTransfer } from "./internal"

export async function initiateTransfer(data:any){

 // STEP 1 → send OTP
 await generateOTP(data.phone)

 return {
  requiresOTP: true,
  message: "OTP sent"
 }

}

export async function confirmTransfer(data:any){

 // STEP 2 → verify OTP
 await verifyOTP(data.phone, data.otp)

 // STEP 3 → execute transfer
 return await internalTransfer(
  data.fromAccount,
  data.toAccount,
  data.amount,
  data.phone,
  data.pin,
  data.idempotencyKey
 )

}