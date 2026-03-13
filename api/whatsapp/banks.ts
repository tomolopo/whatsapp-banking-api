import { VercelRequest, VercelResponse } from "@vercel/node"

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 const banks = [

  {code:"058",name:"Access Bank"},
  {code:"044",name:"Access Diamond"},
  {code:"214",name:"FCMB"},
  {code:"070",name:"Fidelity Bank"},
  {code:"011",name:"First Bank"},
  {code:"215",name:"Stanbic IBTC"},
  {code:"033",name:"UBA"},
  {code:"032",name:"Union Bank"},
  {code:"057",name:"Zenith Bank"}

 ]

 res.json({banks})

}