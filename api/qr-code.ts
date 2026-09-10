import type { VercelRequest, VercelResponse } from "@vercel/node"
import QRCode from "qrcode"
import { getQrRegistrationByToken } from "../lib/qr/registrations"
import { AppError } from "../lib/utils/errors"

export default async function handler(req: VercelRequest, res: VercelResponse){
 try{
  const token = req.query.token
  if(typeof token !== "string" || !token.trim()){
   throw new AppError("BAD_REQUEST", "token required", 400)
  }

  const record = await getQrRegistrationByToken(token.trim())
  if(!record){
   throw new AppError("NOT_FOUND", "QR code not found", 404)
  }

  const profileUrl = `${(process.env.PUBLIC_BASE_URL || "https://whatsapp-banking-api.vercel.app").replace(/\/$/, "")}/api/qr-profile-page?token=${encodeURIComponent(record.qrToken)}`
  const qrBuffer = await QRCode.toBuffer(profileUrl, {
   errorCorrectionLevel: "M",
   margin: 1,
   width: 360
  })

  res.setHeader("Content-Type", "image/png")
  res.setHeader("Cache-Control", "no-store")
  return res.status(200).send(qrBuffer)
 }catch(error){
  const status = error instanceof AppError ? error.statusCode : 500
  const message = error instanceof AppError ? error.message : "Something went wrong"
  return res.status(status).json({
   success: false,
   error: { code: error instanceof AppError ? error.code : "INTERNAL_ERROR", message }
  })
 }
}
