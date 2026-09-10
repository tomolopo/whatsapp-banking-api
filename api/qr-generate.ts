import type { VercelRequest, VercelResponse } from "@vercel/node"
import QRCode from "qrcode"
import { v4 as uuid } from "uuid"
import { AppError } from "../lib/utils/errors"
import { sendError } from "../lib/utils/response"
import {
 createQrRegistration,
 buildQrProfileUrl,
 buildQrCodeUrl,
 type QrRegistrationInput
} from "../lib/qr/registrations"

function readField(value: unknown, name: string): string {
 if(typeof value !== "string"){
  throw new AppError("BAD_REQUEST", `${name} is required`, 400)
 }

 const trimmed = value.trim()
 if(!trimmed){
  throw new AppError("BAD_REQUEST", `${name} is required`, 400)
 }

 return trimmed
}

export default async function handler(req: VercelRequest, res: VercelResponse){
 const requestId = uuid()

 try{
  if(req.method !== "POST"){
   throw new AppError("METHOD_NOT_ALLOWED", "Method not allowed", 405)
  }

  const body = req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {}

  const input: QrRegistrationInput = {
   firstName: readField(body.firstName, "firstName"),
   lastName: readField(body.lastName, "lastName"),
   jobTitle: readField(body.jobTitle, "jobTitle"),
   mdaSector: readField(body.mdaSector, "mdaSector"),
   registrationStatus: readField(body.registrationStatus, "registrationStatus"),
   organization: readField(body.organization, "organization")
  }

  const record = await createQrRegistration(input)
  const profileUrl = buildQrProfileUrl(record.qrToken)
  const qrCodeUrl = buildQrCodeUrl(record.qrToken)
  const qrDataUrl = await QRCode.toDataURL(profileUrl, {
   errorCorrectionLevel: "M",
   margin: 1,
   width: 360
  })

  return res.status(200).json({
   success: true,
   requestId,
   data: {
    ...record,
    profileUrl,
    qrCodeUrl,
    qrDataUrl
   },
   meta: null
  })
 }catch(err){
  return sendError(res, requestId, err)
 }
}
