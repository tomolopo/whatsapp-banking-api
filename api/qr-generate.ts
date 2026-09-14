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

function readRequiredField(value: unknown, name: string): string {
 if(typeof value !== "string"){
  throw new AppError("BAD_REQUEST", `${name} is required`, 400)
 }

 const trimmed = value.trim()
 if(!trimmed){
  throw new AppError("BAD_REQUEST", `${name} is required`, 400)
 }

 return trimmed
}

function readOptionalField(value: unknown): string | undefined {
 if(typeof value !== "string"){
  return undefined
 }

 const trimmed = value.trim()
 return trimmed ? trimmed : undefined
}

export default async function handler(req: VercelRequest, res: VercelResponse){
 const requestId = uuid()

 try{
  if(req.method !== "POST"){
   throw new AppError("METHOD_NOT_ALLOWED", "Method not allowed", 405)
  }

  const body = req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {}

  const input: QrRegistrationInput = {
   phoneNumber: readRequiredField(body.phoneNumber, "phoneNumber"),
   email: readOptionalField(body.email),
   firstName: readOptionalField(body.firstName),
   lastName: readOptionalField(body.lastName),
   jobTitle: readOptionalField(body.jobTitle),
   mdaSector: readOptionalField(body.mdaSector),
   confirmationStatus: readOptionalField(body.confirmationStatus),
   registrationStatus: readOptionalField(body.registrationStatus),
   organization: readOptionalField(body.organization)
  }

  const record = await createQrRegistration(input)
  const profileUrl = buildQrProfileUrl(record.qrToken)
  const qrCodeUrl = buildQrCodeUrl(record.qrToken)
  const qrDataUrl = await QRCode.toDataURL(profileUrl, {
   errorCorrectionLevel: "M",
   margin: 2,
   width: 360,
   color: {
    dark: "#1e7b44",
    light: "#f7f1df"
   }
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
