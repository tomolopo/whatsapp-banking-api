import type { VercelRequest, VercelResponse } from "@vercel/node"
import { v4 as uuid } from "uuid"
import { recordQrRegistrationCheckIn } from "../lib/qr/registrations"
import { AppError } from "../lib/utils/errors"
import { sendError, sendSuccess } from "../lib/utils/response"

function readToken(value: unknown): string {
 if(typeof value !== "string"){
  throw new AppError("BAD_REQUEST", "token is required", 400)
 }

 const trimmed = value.trim()
 if(!trimmed){
  throw new AppError("BAD_REQUEST", "token is required", 400)
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
  const token = readToken(body.token)
  const record = await recordQrRegistrationCheckIn(token)

  if(!record){
   throw new AppError("QR_PROFILE_NOT_FOUND", "Invalid or expired QR link", 404)
  }

  return sendSuccess(res, requestId, record)
 }catch(err){
  return sendError(res, requestId, err)
 }
}
