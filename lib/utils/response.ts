export function sendSuccess(
 res: any,
 requestId: string,
 data: any = null,
 meta: any = null,
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
 res: any,
 requestId: string,
 error: any,
 statusCode: number = 500
){
 return res.status(statusCode).json({
  success: false,
  requestId,
  error: {
   code: error?.code || "INTERNAL_ERROR",
   message: error?.message || "Something went wrong"
  }
 })
}