import type { VercelRequest, VercelResponse } from "@vercel/node"
import fs from "fs"
import path from "path"
import QRCode from "qrcode"
import { getQrRegistrationByToken } from "../lib/qr/registrations"
import { AppError } from "../lib/utils/errors"
import { escapeHtml } from "../lib/utils/escape"
import { sendError } from "../lib/utils/response"

function wantsImage(req: VercelRequest): boolean {
 const output = req.query.output
 if(typeof output === "string" && output.toLowerCase() === "image"){
  return true
 }

 const pathname = (() => {
  try{
   return new URL(req.url || "", "http://localhost").pathname.toLowerCase()
  }catch{
   return ""
  }
 })()

 if(pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")){
  return true
 }

 const accept = String(req.headers.accept || "").toLowerCase()
 const fetchDest = String(req.headers["sec-fetch-dest"] || "").toLowerCase()

 return fetchDest === "image" || accept.includes("image/")
}

function renderMessage(res: VercelResponse, statusCode: number, title: string, message: string){
 res.setHeader("Content-Type", "text/html; charset=utf-8")
 res.setHeader("Cache-Control", "no-store")
 res.status(statusCode).send(`<!doctype html><html><body style="font-family:system-ui,sans-serif;padding:24px;max-width:640px;margin:0 auto;"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p></body></html>`)
}

function booleanText(value: boolean): string {
 return value ? "Yes" : "No"
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

function loadPassTemplate(): string {
 return fs.readFileSync(path.join(process.cwd(), "frontend", "qr-access-pass.html"), "utf8")
}

type QrRegistrationRecord = NonNullable<Awaited<ReturnType<typeof getQrRegistrationByToken>>>

function renderAccessPass(record: QrRegistrationRecord){
 const fullName = `${record.firstName} ${record.lastName}`.trim()
 const checkedInText = booleanText(record.checkedIn)
 const checkInButtonDisabled = record.checkedIn ? "disabled aria-disabled=\"true\"" : ""
 const checkInButtonText = record.checkedIn ? "Checked in" : "Check in"

 return loadPassTemplate()
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
  .split("{{REGISTRATION_STATUS}}")
  .join(escapeHtml(record.registrationStatus || ""))
  .split("{{FIRST_NAME}}")
  .join(escapeHtml(record.firstName))
  .split("{{LAST_NAME}}")
  .join(escapeHtml(record.lastName))
  .split("{{JOB_TITLE}}")
  .join(escapeHtml(record.jobTitle))
  .split("{{MDA_SECTOR}}")
  .join(escapeHtml(record.mdaSector))
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
}

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

  if(wantsImage(req)){
   const profileUrl = `${(process.env.PUBLIC_BASE_URL || "https://whatsapp-banking-api.vercel.app").replace(/\/$/, "")}/api/qr-profile-page?token=${encodeURIComponent(record.qrToken)}`
   const qrBuffer = await QRCode.toBuffer(profileUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 360,
    color: {
     dark: "#1e7b44",
     light: "#f7f1df"
    }
   })

   res.setHeader("Content-Type", "image/png")
   res.setHeader("Cache-Control", "no-store")
   return res.status(200).send(qrBuffer)
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8")
  res.setHeader("Cache-Control", "no-store")
  return res.status(200).send(renderAccessPass(record))
 }catch(error){
  const status = error instanceof AppError ? error.statusCode : 500
  if(status === 404){
   return renderMessage(res, 404, "Pass unavailable", "Invalid or expired QR link")
  }

  if(error instanceof AppError && error.code === "NOT_FOUND"){
   return renderMessage(res, 404, "Pass unavailable", "Invalid or expired QR link")
  }

  const message = error instanceof AppError ? error.message : "Something went wrong"
  if(wantsImage(req)){
   return res.status(status).json({
    success: false,
    error: { code: error instanceof AppError ? error.code : "INTERNAL_ERROR", message }
   })
  }

  return renderMessage(res, status, "Pass unavailable", message)
 }
}
