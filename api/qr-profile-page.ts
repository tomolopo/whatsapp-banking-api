import type { VercelRequest, VercelResponse } from "@vercel/node"
import fs from "fs"
import path from "path"
import { recordQrRegistrationScan } from "../lib/qr/registrations"
import { escapeHtml } from "../lib/utils/escape"

function renderMessage(res: VercelResponse, statusCode: number, title: string, message: string){
 res.setHeader("Content-Type", "text/html; charset=utf-8")
 res.setHeader("Cache-Control", "no-store")
 res.status(statusCode).send(`<!doctype html><html><body style="font-family:system-ui,sans-serif;padding:24px;max-width:640px;margin:0 auto;"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p></body></html>`)
}

function formatTimestamp(value: string | null): string {
 if(!value){
  return "Pending first scan"
 }

 const date = new Date(value)
 if(Number.isNaN(date.getTime())){
  return "Pending first scan"
 }

 const formatted = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
 }).format(date)

 return `${formatted} UTC`
}

function buildInitials(firstName: string, lastName: string): string {
 const first = firstName.trim().charAt(0)
 const last = lastName.trim().charAt(0)
 return `${first}${last}`.toUpperCase() || "QR"
}

function buildScanSummary(scanCount: number): string {
 if(scanCount <= 0){
  return "Awaiting scan"
 }

 return scanCount === 1 ? "1 scan logged" : `${scanCount} scans logged`
}

export default async function handler(req: VercelRequest, res: VercelResponse){
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
  const scanSummary = buildScanSummary(record.scanCount)

  html = html
   .split("{{FULL_NAME}}")
   .join(escapeHtml(fullName))
   .split("{{INITIALS}}")
   .join(escapeHtml(buildInitials(record.firstName, record.lastName)))
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
   .split("{{SCANNED_AT}}")
   .join(escapeHtml(formatTimestamp(record.scannedAt)))
   .split("{{LAST_SCANNED_AT}}")
   .join(escapeHtml(formatTimestamp(record.lastScannedAt)))
   .split("{{SCAN_COUNT}}")
   .join(escapeHtml(String(record.scanCount)))
   .split("{{SCAN_SUMMARY}}")
   .join(escapeHtml(scanSummary))

  res.setHeader("Content-Type", "text/html; charset=utf-8")
  res.setHeader("Cache-Control", "no-store")
  res.status(200).send(html)
 }catch{
  return renderMessage(res, 500, "Profile unavailable", "Profile temporarily unavailable")
 }
}
