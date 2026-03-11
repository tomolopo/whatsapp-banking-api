import PDFDocument from "pdfkit";

export function generateStatement(transactions:any[]){

 const doc = new PDFDocument();

 transactions.forEach(tx=>{
  doc.text(`${tx.created_at} - ${tx.amount} - ${tx.type}`);
 });

 doc.end();

 return doc;
}