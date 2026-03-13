import PDFDocument from "pdfkit"
import { PassThrough } from "stream"

export async function generatePdf(data:any){

 const doc = new PDFDocument()

 const stream = new PassThrough()

 const buffers:any[] = []

 doc.pipe(stream)

 stream.on("data",buffers.push.bind(buffers))

 doc.fontSize(20).text("Account Statement")

 doc.moveDown()

 doc.text(JSON.stringify(data,null,2))

 doc.end()

 return new Promise((resolve)=>{

  stream.on("end",()=>{
   resolve(Buffer.concat(buffers))
  })

 })

}