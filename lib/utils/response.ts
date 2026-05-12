import type { VercelResponse } from "@vercel/node"
import { AppError } from "./errors"

export function sendSuccess(
 res: VercelResponse,
 requestId: string,
 data: unknown = null,
 meta: unknown = null,
 statusCode: number = 200
){
 return res.status(statusCode).json({
  success: true,
  requestId,
  data,
  meta
 })
}

export function sendError(
 res: VercelResponse,
 requestId: string,
 error: unknown,
 statusCode?: number
){
 let code = "INTERNAL_ERROR"
 let message = "Something went wrong"
 let status = statusCode ?? 500

 if(error instanceof AppError){
  code = error.code
  message = error.message
  status = statusCode ?? error.statusCode
 } else if(error && typeof error === "object"){
  const e = error as { code?: string; message?: string }
  if(e.code) code = e.code
  if(e.message) message = e.message
 }

 return res.status(status).json({
  success: false,
  requestId,
  error: { code, message }
 })
}
