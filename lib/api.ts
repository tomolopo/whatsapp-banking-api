const API = process.env.NEXT_PUBLIC_API_URL

export async function fetchCustomers(
 search = "",
 page = 1
){

 const limit = 10
 const offset = (page - 1) * limit

 const res = await fetch(
  `${API}/api/admin?resource=customers&search=${search}&limit=${limit}&offset=${offset}`
 )

 if(!res.ok){
  throw new Error("Failed to fetch customers")
 }

 return res.json()
}



export async function fetchBanks(){

 const res = await fetch(
  `${API}/api/admin?resource=banks`
 )

 if(!res.ok){
  throw new Error("Failed to fetch banks")
 }

 return res.json()
}