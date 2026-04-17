import { generatePDF } from "./generatePdf"
import path from "path"

// 🎨 HELPERS
function formatCurrency(amount: number){
 return `₦${Number(amount).toLocaleString()}`
}

function formatDate(date: string){
 return new Date(date).toLocaleDateString()
}

export async function generateStatementPDF(
 accountNumber: string,
 transactions: any[]
){

 const { doc, stream, filePath } = generatePDF(
  `statement-${accountNumber}.pdf`
 )

 // 📁 LOGO PATH
 const logoPath = path.join(process.cwd(), "assets", "logo.png")

 // 🎨 COLORS
 const primary = "#0A2E5C"
 const accent = "#C89B3C"
 const text = "#333"
 const lightGray = "#E5E7EB"

 // 🏦 HEADER LOGO
 try{
  doc.image(logoPath, 170, 30, { width: 200 })
 }catch(e){
  console.warn("Logo not found")
 }

 doc.moveDown(4)

 // TITLE
 doc
  .fillColor("#000")
  .fontSize(16)
  .text("Account Statement", { align: "center" })

 doc.moveDown()

 // DIVIDER
 doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor(accent).stroke()

 doc.moveDown()

 // 📊 SUMMARY SECTION
 const fromDate = transactions[transactions.length - 1]?.created_at
 const toDate = transactions[0]?.created_at

 doc.fontSize(11).fillColor(text)

 doc.text(`Account Number: ${accountNumber}`)
 doc.text(`Period: ${formatDate(fromDate)} - ${formatDate(toDate)}`)

 doc.moveDown()

 // 💰 CALCULATE TOTALS
 let totalCredit = 0
 let totalDebit = 0

 transactions.forEach((tx:any)=>{
  if(tx.type === "credit") totalCredit += Number(tx.amount)
  if(tx.type === "debit") totalDebit += Number(tx.amount)
 })

 doc
  .fillColor(primary)
  .text(`Total Credit: ${formatCurrency(totalCredit)}`)

 doc
  .fillColor("#B91C1C")
  .text(`Total Debit: ${formatCurrency(totalDebit)}`)

 doc.moveDown(1.5)

 // 📋 TABLE HEADER
 const tableTop = doc.y

 const colX = {
  date: 50,
  type: 150,
  amount: 300,
  status: 420
 }

 doc.fontSize(10).fillColor("#000")

 doc.text("Date", colX.date, tableTop)
 doc.text("Type", colX.type, tableTop)
 doc.text("Amount", colX.amount, tableTop)
 doc.text("Status", colX.status, tableTop)

 doc.moveDown()

 // HEADER LINE
 doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor(lightGray).stroke()

 doc.moveDown(0.5)

 // 📄 TABLE ROWS
 let y = doc.y

 transactions.forEach((tx:any, i:number)=>{

  // 🛑 Page break
  if(y > 750){
   doc.addPage()
   y = 50
  }

  const color =
   tx.type === "credit" ? "#16A34A" : "#DC2626"

  doc.fillColor(text).fontSize(9)

  doc.text(formatDate(tx.created_at), colX.date, y)
  doc.text(tx.type, colX.type, y)

  doc
   .fillColor(color)
   .text(formatCurrency(tx.amount), colX.amount, y)

  doc
   .fillColor(text)
   .text(tx.status || "completed", colX.status, y)

  y += 20
 })

 doc.moveDown()

 // FOOTER
 doc.moveDown(2)

 doc
  .fontSize(10)
  .fillColor("#666")
  .text("Thank you for banking with us.", {
   align: "center"
  })

 doc.moveDown(0.5)

 doc
  .fontSize(9)
  .text("This statement is system generated.", {
   align: "center"
  })

 doc.end()

 return new Promise((resolve)=>{
  stream.on("finish", ()=>{
   resolve(filePath)
  })
 })
}