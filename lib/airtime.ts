export async function buyAirtime(phone:string, amount:number){

 return {
  success:true,
  phone,
  amount,
  network:"MTN",
  reference:"AIR-" + Date.now()
 }

}