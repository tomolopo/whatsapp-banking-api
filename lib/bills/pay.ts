export async function payBill(provider:string, amount:number){

 await new Promise(res => setTimeout(res,1000))

 return {
  success:true,
  provider,
  amount,
  status:"paid",
  reference:"BILL-" + Date.now()
 }

}