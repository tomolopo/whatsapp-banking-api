import type { VercelRequest, VercelResponse } from "@vercel/node"
import fs from "fs"
import path from "path"
import { escapeHtml } from "../lib/utils/escape"

export default function handler(req: VercelRequest, res: VercelResponse){
 const filePath = path.join(process.cwd(), "frontend", "qr-register.html")
 let html = fs.readFileSync(filePath, "utf8")
 const apiBase = process.env.PUBLIC_BASE_URL || "https://whatsapp-banking-api.vercel.app"

 html = html.replace("{{API_BASE_URL}}", escapeHtml(apiBase))

 res.setHeader("Content-Type", "text/html; charset=utf-8")
 res.setHeader("Cache-Control", "no-store")
 res.status(200).send(html)
}
