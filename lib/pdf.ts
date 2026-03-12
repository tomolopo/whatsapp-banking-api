import PDFDocument from "pdfkit";

export function generateStatement(account:string,transactions:any[]){

 const doc = new PDFDocument();

 doc.fontSize(18).text("Taiwo Digital Bank");

 doc.moveDown();

 doc.text(`Account Number: ${account}`);

 doc.moveDown();

 doc.text("Transactions");

 doc.moveDown();

 transactions.forEach(tx=>{

  doc.text(
  `${tx.created_at}  ${tx.type}  ₦${tx.amount}`
  );

 });

 doc.end();

 return doc;

}