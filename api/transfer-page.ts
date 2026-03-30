import { VercelRequest, VercelResponse } from "@vercel/node"

export default function handler(req: VercelRequest, res: VercelResponse){

 const { token } = req.query

 if(!token){
  return res.status(400).send("Invalid link")
 }

 let data:any

 try{
  data = JSON.parse(Buffer.from(token as string, "base64").toString())
 }catch{
  return res.status(400).send("Invalid token")
 }

 const { phone, fromAccount, toAccount, amount } = data

 res.setHeader("Content-Type","text/html")

 res.send(`
  <html>
   <body style="font-family:sans-serif; padding:20px;">

    <h2>Confirm Transfer</h2>

    <p><b>From:</b> ${fromAccount}</p>
    <p><b>To:</b> ${toAccount}</p>
    <p><b>Amount:</b> ₦${amount}</p>

    <input id="pin" type="password" placeholder="Enter PIN" />
    <br/><br/>

    <button onclick="submitTransfer()">Confirm</button>

    <p id="msg"></p>

    <script>
     async function submitTransfer(){

      const pin = document.getElementById("pin").value

      const res = await fetch("/api/whatsapp?action=transfer",{
       method:"POST",
       headers:{
        "Content-Type":"application/json",
        "idempotency-key": Date.now().toString()
       },
       body: JSON.stringify({
        phone: "${phone}",
        fromAccount: "${fromAccount}",
        toAccount: "${toAccount}",
        amount: "${amount}",
        pin
       })
      })

      const data = await res.json()

      if(data.success){
        document.getElementById("msg").innerText = "✅ Transfer successful"

        setTimeout(()=>{
         window.location.href = "https://wa.me/${phone}"
        },2000)

      }else{
        document.getElementById("msg").innerText = data.error
      }
     }
    </script>

   </body>
  </html>
 `)

}