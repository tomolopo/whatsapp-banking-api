import type { VercelRequest, VercelResponse } from "@vercel/node"
import fs from "fs"
import path from "path"
import { v4 as uuid } from "uuid"
import { recordQrRegistrationCheckIn, recordQrRegistrationScan } from "../lib/qr/registrations"
import { AppError } from "../lib/utils/errors"
import { escapeHtml } from "../lib/utils/escape"
import { sendError, sendSuccess } from "../lib/utils/response"

function renderMessage(res: VercelResponse, statusCode: number, title: string, message: string){
 res.setHeader("Content-Type", "text/html; charset=utf-8")
 res.setHeader("Cache-Control", "no-store")
 res.status(statusCode).send(`<!doctype html><html><body style="font-family:system-ui,sans-serif;padding:24px;max-width:640px;margin:0 auto;"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p></body></html>`)
}

function formatTimestamp(value: string | null): string {
 if(!value){
  return "Pending"
 }

 const date = new Date(value)
 if(Number.isNaN(date.getTime())){
  return "Pending"
 }

 return new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
 }).format(date) + " UTC"
}

function booleanText(value: boolean): string {
 return value ? "Yes" : "No"
}

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

 if(req.method === "POST"){
  try{
   const body = req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {}
   const token = readToken(body.token ?? req.query.token)
   const record = await recordQrRegistrationCheckIn(token)

   if(!record){
    throw new AppError("QR_PROFILE_NOT_FOUND", "Invalid or expired QR link", 404)
   }

   return sendSuccess(res, requestId, record)
  }catch(err){
   return sendError(res, requestId, err)
  }
 }

 if(req.method !== "GET"){
  return sendError(res, requestId, new AppError("METHOD_NOT_ALLOWED", "Method not allowed", 405))
 }

 try{
  const token = req.query.token

  if(typeof token !== "string" || !token.trim()){
   return renderMessage(res, 404, "Profile unavailable", "Invalid or expired QR link")
  }

  const record = await recordQrRegistrationScan(token.trim())
  if(!record){
   return renderMessage(res, 404, "Profile unavailable", "Invalid or expired QR link")
  }

  const filePath = path.join(process.cwd(), "frontend", "qr-profile.html")
  let html = fs.readFileSync(filePath, "utf8")
  const fullName = `${record.firstName} ${record.lastName}`.trim()
  const checkedInText = booleanText(record.checkedIn)
  const checkInButtonDisabled = record.checkedIn ? "disabled aria-disabled=\"true\"" : ""
  const checkInButtonText = record.checkedIn ? "Checked in" : "Check in"

  html = html
   .split("{{TOKEN}}")
   .join(escapeHtml(record.qrToken))
   .split("{{CHECKED_IN_BOOL}}")
   .join(record.checkedIn ? "true" : "false")
   .split("{{FULL_NAME}}")
   .join(escapeHtml(fullName))
   .split("{{ATTENDEE_ID}}")
   .join(escapeHtml(record.attendeeId || ""))
   .split("{{EMAIL}}")
   .join(escapeHtml(record.email || ""))
   .split("{{CONFIRMATION_STATUS}}")
   .join(escapeHtml(record.confirmationStatus || ""))
   .split("{{FIRST_NAME}}")
   .join(escapeHtml(record.firstName))
   .split("{{LAST_NAME}}")
   .join(escapeHtml(record.lastName))
   .split("{{JOB_TITLE}}")
   .join(escapeHtml(record.jobTitle))
   .split("{{MDA_SECTOR}}")
   .join(escapeHtml(record.mdaSector))
   .split("{{REGISTRATION_STATUS}}")
   .join(escapeHtml(record.registrationStatus))
   .split("{{ORGANIZATION}}")
   .join(escapeHtml(record.organization))
   .split("{{CHECKED_IN}}")
   .join(escapeHtml(checkedInText))
   .split("{{CHECK_IN_TIME}}")
   .join(escapeHtml(formatTimestamp(record.checkInTime)))
   .split("{{CHECK_IN_STATUS_TEXT}}")
   .join(escapeHtml(record.checkedIn ? "Checked in" : "Pending check-in"))
   .split("{{CHECK_IN_BUTTON_DISABLED}}")
   .join(checkInButtonDisabled)
   .split("{{CHECK_IN_BUTTON_TEXT}}")
   .join(escapeHtml(checkInButtonText))

  res.setHeader("Content-Type", "text/html; charset=utf-8")
  res.setHeader("Cache-Control", "no-store")
  res.status(200).send(html)
 }catch{
  return renderMessage(res, 500, "Profile unavailable", "Profile temporarily unavailable")
 }
}
