import { generatePdf } from "../pdf"

export async function createStatement(data:any){

 const pdf = await generatePdf(data)

 return pdf

}