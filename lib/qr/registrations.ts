import { randomUUID } from "crypto"
import { supabase } from "../supabase/client"
import { AppError } from "../utils/errors"

const TABLE = "qr_registrations"
const DEFAULT_BASE_URL = "https://whatsapp-banking-api.vercel.app"
const MAX_TOKEN_ATTEMPTS = 5

export interface QrRegistrationInput {
 phoneNumber: string
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
 scannedAt: string | null
 lastScannedAt: string | null
 scanCount: number
 createdAt: string
 updatedAt: string
}

type QrRegistrationRow = {
 id: string
 qr_token: string
 phone_number: string
 first_name: string
 last_name: string
 job_title: string
 mda_sector: string
 registration_status: string
 organization: string
 scanned_at: string | null
 last_scanned_at: string | null
 scan_count: number
 created_at: string
 updated_at: string
}

function normalizeBaseUrl(){
 return (process.env.PUBLIC_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "")
}

export function buildQrProfileUrl(qrToken: string){
 return `${normalizeBaseUrl()}/api/qr-profile-page?token=${encodeURIComponent(qrToken)}`
}

export function buildQrCodeUrl(qrToken: string){
 return `${normalizeBaseUrl()}/api/qr-code?token=${encodeURIComponent(qrToken)}`
}

function createQrToken(){
 return `qr_${randomUUID().replace(/-/g, "")}`
}

function mapRow(row: QrRegistrationRow): QrRegistrationRecord {
 return {
  id: row.id,
  qrToken: row.qr_token,
  phoneNumber: row.phone_number,
  firstName: row.first_name,
  lastName: row.last_name,
  jobTitle: row.job_title,
  mdaSector: row.mda_sector,
  registrationStatus: row.registration_status,
  organization: row.organization,
  scannedAt: row.scanned_at,
  lastScannedAt: row.last_scanned_at,
  scanCount: row.scan_count,
  createdAt: row.created_at,
  updatedAt: row.updated_at
 }
}

function toDbRow(input: QrRegistrationInput, qrToken: string){
 return {
  qr_token: qrToken,
  phone_number: input.phoneNumber,
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
  .select("id, qr_token, phone_number, first_name, last_name, job_title, mda_sector, registration_status, organization, scanned_at, last_scanned_at, scan_count, created_at, updated_at")
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
   const err = error as { code?: string; constraint?: string; message?: string }
   if(err.code === "23505"){
    if(err.constraint === "qr_registrations_phone_number_key" || (err.message || "").includes("phone_number")){
     throw new AppError("QR_ALREADY_GENERATED", "A QR code has already been generated for this phone number", 409)
    }

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
  .select("id, qr_token, phone_number, first_name, last_name, job_title, mda_sector, registration_status, organization, scanned_at, last_scanned_at, scan_count, created_at, updated_at")
  .eq("qr_token", qrToken)
  .maybeSingle()

 if(error){
  throw new AppError("QR_REGISTRATION_LOOKUP_FAILED", error.message, 500)
 }

 return data ? mapRow(data as QrRegistrationRow) : null
}

export async function recordQrRegistrationScan(qrToken: string): Promise<QrRegistrationRecord | null> {
 const { data, error } = await supabase.rpc("record_qr_registration_scan", {
  p_qr_token: qrToken
 })

 if(error){
  throw new AppError("QR_REGISTRATION_SCAN_FAILED", error.message, 500)
 }

 return data ? mapRow(data as QrRegistrationRow) : null
}
