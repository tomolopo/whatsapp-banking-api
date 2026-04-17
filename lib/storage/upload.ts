import fs from "fs"
import { supabase } from "../supabase/client"

export async function uploadToSupabase(
 filePath: string,
 fileName: string
){

 const fileBuffer = fs.readFileSync(filePath)

 const { data, error } = await supabase.storage
  .from(process.env.SUPABASE_BUCKET!)
  .upload(fileName, fileBuffer, {
    contentType: "application/pdf",
    upsert: true
  })

 if(error){
  throw new Error(error.message)
 }

 // ✅ GET PUBLIC URL
 const { data: publicUrl } = supabase.storage
  .from(process.env.SUPABASE_BUCKET!)
  .getPublicUrl(fileName)

 return publicUrl.publicUrl
}