import { randomUUID } from "crypto"
import { supabase } from "../supabase/client"
import { AppError } from "../utils/errors"

const TABLE = "qr_registrations"
const DEFAULT_BASE_URL = "https://whatsapp-banking-api.vercel.app"
const MAX_TOKEN_ATTEMPTS = 5

export interface QrRegistrationInput {
 firstName: string
 lastName: string
 jobTitle: string
 mdaSector: string
 registrationStatus: string
 organization: string
}

export interface QrRegistrationRecord extends QrRegistrationInput {
 id: string
 qrToken: string
 createdAt: string
 updatedAt: string
}

type QrRegistrationRow = {
 id: string
 qr_token: string
 first_name: string
 last_name: string
 job_title: string
 mda_sector: string
 registration_status: string
 organization: string
 created_at: string
 updated_at: string
}

function normalizeBaseUrl(){
 return (process.env.PUBLIC_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "")
}

export function buildQrProfileUrl(qrToken: string){
 return `${normalizeBaseUrl()}/api/qr-profile-page?token=${encodeURIComponent(qrToken)}`
}

function createQrToken(){
 return `qr_${randomUUID().replace(/-/g, "")}`
}

function mapRow(row: QrRegistrationRow): QrRegistrationRecord {
 return {
  id: row.id,
  qrToken: row.qr_token,
  firstName: row.first_name,
  lastName: row.last_name,
  jobTitle: row.job_title,
  mdaSector: row.mda_sector,
  registrationStatus: row.registration_status,
  organization: row.organization,
  createdAt: row.created_at,
  updatedAt: row.updated_at
 }
}

function toDbRow(input: QrRegistrationInput, qrToken: string){
 return {
  qr_token: qrToken,
  first_name: input.firstName,
  last_name: input.lastName,
  job_title: input.jobTitle,
  mda_sector: input.mdaSector,
  registration_status: input.registrationStatus,
  organization: input.organization
 }
}

async function insertQrRegistration(input: QrRegistrationInput, qrToken: string): Promise<QrRegistrationRecord> {
 const { data, error } = await supabase
  .from(TABLE)
  .insert([toDbRow(input, qrToken)])
  .select("id, qr_token, first_name, last_name, job_title, mda_sector, registration_status, organization, created_at, updated_at")
  .single()

 if(error){
  throw new AppError("QR_REGISTRATION_WRITE_FAILED", error.message, 500)
 }

 if(!data){
  throw new AppError("QR_REGISTRATION_WRITE_FAILED", "QR registration could not be saved", 500)
 }

 return mapRow(data as QrRegistrationRow)
}

export async function createQrRegistration(input: QrRegistrationInput): Promise<QrRegistrationRecord> {
 for(let attempt = 0; attempt < MAX_TOKEN_ATTEMPTS; attempt++){
  const qrToken = createQrToken()

  try{
   return await insertQrRegistration(input, qrToken)
  }catch(error){
   const err = error as { code?: string }
   if(err.code === "23505"){
    continue
   }
   throw error
  }
 }

 throw new AppError("QR_TOKEN_CONFLICT", "Unable to generate a unique QR token", 500)
}

export async function getQrRegistrationByToken(qrToken: string): Promise<QrRegistrationRecord | null> {
 const { data, error } = await supabase
  .from(TABLE)
  .select("id, qr_token, first_name, last_name, job_title, mda_sector, registration_status, organization, created_at, updated_at")
  .eq("qr_token", qrToken)
  .maybeSingle()

 if(error){
  throw new AppError("QR_REGISTRATION_LOOKUP_FAILED", error.message, 500)
 }

 return data ? mapRow(data as QrRegistrationRow) : null
}
