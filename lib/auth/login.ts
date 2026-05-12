import { generateOTP } from "../otp"

export async function login(phone: string){
 await generateOTP(phone)
 return { success: true, message: "OTP sent" }
}
