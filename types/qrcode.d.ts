declare module "qrcode" {
 export interface QRCodeToDataURLOptions {
  errorCorrectionLevel?: "L" | "M" | "Q" | "H"
  margin?: number
  width?: number
 }

 export function toDataURL(
  text: string,
  options?: QRCodeToDataURLOptions
 ): Promise<string>

 export function toBuffer(
  text: string,
  options?: QRCodeToDataURLOptions
 ): Promise<Buffer>

 const QRCode: {
  toDataURL: typeof toDataURL
  toBuffer: typeof toBuffer
 }

 export default QRCode
}
