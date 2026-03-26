export function generateToken(phone: string){
 return Buffer.from(phone).toString("base64")
}

export function verifyToken(token: string){
 try{
  const phone = Buffer.from(token, "base64").toString("utf8")
  return phone
 }catch{
  return null
 }
}