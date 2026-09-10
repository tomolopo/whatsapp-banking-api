import type { VercelRequest, VercelResponse } from "@vercel/node"
import fs from "fs"
import path from "path"
import { getQrRegistrationByToken } from "../lib/qr/registrations"
import { escapeHtml } from "../lib/utils/escape"

function renderMessage(res: VercelResponse, statusCode: number, title: string, message: string){
 res.setHeader("Content-Type", "text/html; charset=utf-8")
 res.setHeader("Cache-Control", "no-store")
 res.status(statusCode).send(`<!doctype html><html><body style="font-family:system-ui,sans-serif;padding:24px;max-width:640px;margin:0 auto;"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p></body></html>`)
}

export default async function handler(req: VercelRequest, res: VercelResponse){
 try{
  const token = req.query.token

  if(typeof token !== "string" || !token.trim()){
   return renderMessage(res, 404, "Profile unavailable", "Invalid or expired QR link")
  }

  const record = await getQrRegistrationByToken(token.trim())
  if(!record){
   return renderMessage(res, 404, "Profile unavailable", "Invalid or expired QR link")
  }

  const filePath = path.join(process.cwd(), "frontend", "qr-profile.html")
  let html = fs.readFileSync(filePath, "utf8")

  html = html
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

  res.setHeader("Content-Type", "text/html; charset=utf-8")
  res.setHeader("Cache-Control", "no-store")
  res.status(200).send(html)
 }catch{
  return renderMessage(res, 500, "Profile unavailable", "Profile temporarily unavailable")
 }
}
