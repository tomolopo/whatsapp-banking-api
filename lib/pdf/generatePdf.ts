import PDFDocument from "pdfkit"
import fs from "fs"
import path from "path"

export function generatePDF(fileName: string){

 const doc = new PDFDocument()

 const filePath = `/tmp/${fileName}` // Vercel temp storage

 const stream = fs.createWriteStream(filePath)

 doc.pipe(stream)

 return { doc, stream, filePath }
}