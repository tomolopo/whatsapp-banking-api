import { generatePDF } from "./generatePdf"
import path from "path"

// 🎨 HELPERS
function formatCurrency(amount: number){
 return `₦${amount.toLocaleString()}`
}

function formatDate(date: string){
 const d = new Date(date)
 return d.toLocaleDateString()
}

function formatTime(date: string){
 const d = new Date(date)
 return d.toLocaleTimeString()
}

export async function generateReceiptPDF(transaction: any){

 const { doc, stream, filePath } = generatePDF(
  `receipt-${transaction.id}.pdf`
 )

 // 📁 LOGO PATHS (SAFE FOR VERCEL)
 const logoPath = path.join(process.cwd(), "assets", "logo.png")
 const logoIconPath = path.join(process.cwd(), "assets", "logo-icon.png")

 // 🎨 COLORS
 const primaryColor = "#0A2E5C"   // navy
 const accentColor = "#C89B3C"    // gold
 const successColor = "#16A34A"
 const textColor = "#333333"

 // 🏦 HEADER (FULL LOGO)
 try{
  doc.image(logoPath, 170, 40, { width: 200 })
 }catch(e){
  console.warn("Logo not found, skipping header logo")
 }

 doc.moveDown(4)

 // TITLE
 doc
  .fillColor("#000")
  .fontSize(14)
  .text("Transfer Receipt", { align: "center" })

 doc.moveDown()

 // DIVIDER
 doc
  .moveTo(50, doc.y)
  .lineTo(550, doc.y)
  .strokeColor(accentColor)
  .stroke()

 doc.moveDown()

 // ✅ STATUS
 doc
  .fillColor(successColor)
  .fontSize(12)
  .text("● SUCCESSFUL", { align: "center" })

 doc.moveDown()

 // 💰 AMOUNT (HIGHLIGHT)
 doc
  .fillColor(primaryColor)
  .fontSize(30)
  .text(formatCurrency(transaction.amount), {
   align: "center"
  })

 doc.moveDown(2)

 // 📊 DETAILS SECTION
 doc.fillColor(textColor).fontSize(11)

 const leftX = 70
 const rightX = 320

 function row(label: string, value: string){
  const y = doc.y

  doc
   .fillColor("#666")
   .text(label, leftX, y)

  doc
   .fillColor("#000")
   .text(value, rightX, y)

  doc.moveDown()
 }

 row("From Account:", transaction.from_account)
 row("To Account:", transaction.to_account)
 row("Date:", formatDate(transaction.created_at))
 row("Time:", formatTime(transaction.created_at))
 row("Transaction ID:", transaction.id)

 doc.moveDown()

 // DIVIDER
 doc
  .moveTo(50, doc.y)
  .lineTo(550, doc.y)
  .strokeColor("#E5E7EB")
  .stroke()

 doc.moveDown()

 // 🧾 OPTIONAL SMALL ICON (BOTTOM BRANDING)
 try{
  doc.image(logoIconPath, 260, doc.y, { width: 40 })
  doc.moveDown(2)
 }catch(e){
  console.warn("Logo icon not found, skipping")
 }

 // 💬 FOOTER
 doc
  .fontSize(10)
  .fillColor("#666")
  .text("Thank you for banking with us.", {
   align: "center"
  })

 doc.moveDown(0.5)

 doc
  .fontSize(9)
  .fillColor("#999")
  .text("This is a digitally generated receipt and does not require a signature.", {
   align: "center"
  })

 doc.end()

 return new Promise((resolve)=>{
  stream.on("finish", ()=>{
   resolve(filePath)
  })
 })
}