import { VercelRequest,VercelResponse } from "@vercel/node"

export default async function handler(
 req:VercelRequest,
 res:VercelResponse
){

 const { phone,amount,toAccount } = req.body

 const message = `
Transfer Successful

Amount: ₦${amount}
Recipient: ${toAccount}

Thank you for banking with us.
`

 res.json({
  message
 })

}