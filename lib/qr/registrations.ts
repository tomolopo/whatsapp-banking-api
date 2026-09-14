import { randomUUID } from "crypto"
import { supabase } from "../supabase/client"
import { AppError } from "../utils/errors"

const TABLE = "qr_registrations"
const DEFAULT_BASE_URL = "https://whatsapp-banking-api.vercel.app"
const MAX_TOKEN_ATTEMPTS = 5

export interface QrRegistrationInput {
 phoneNumber: string
 email?: string
 firstName?: string
 lastName?: string
 jobTitle?: string
 mdaSector?: string
 confirmationStatus?: string
 registrationStatus?: string
 organization?: string
}

export interface QrRegistrationRecord {
 id: string
 qrToken: string
 phoneNumber: string
 attendeeId: string
 email: string
 firstName: string
 lastName: string
 jobTitle: string
 mdaSector: string
 confirmationStatus: string
 registrationStatus: string
 organization: string
 checkedIn: boolean
 checkInTime: string | null
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
 attendee_id: string | null
 email: string | null
 first_name: string
 last_name: string
 job_title: string
 mda_sector: string
 confirmation_status: string | null
 registration_status: string
 organization: string
 checked_in: boolean
 check_in_time: string | null
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
 return `${normalizeBaseUrl()}/api/qr-code.jpg?token=${encodeURIComponent(qrToken)}`
}

function createQrToken(){
 return `qr_${randomUUID().replace(/-/g, "")}`
}

function cleanText(value: string | undefined, fallback = ""): string {
 const trimmed = typeof value === "string" ? value.trim() : ""
 return trimmed || fallback
}

function mapRow(row: QrRegistrationRow): QrRegistrationRecord {
 return {
  id: row.id,
  qrToken: row.qr_token,
  phoneNumber: row.phone_number,
  attendeeId: row.attendee_id || "",
  email: row.email || "",
  firstName: row.first_name,
  lastName: row.last_name,
  jobTitle: row.job_title,
  mdaSector: row.mda_sector,
  confirmationStatus: row.confirmation_status || "",
  registrationStatus: row.registration_status || "Pending",
  organization: row.organization,
  checkedIn: row.checked_in,
  checkInTime: row.check_in_time,
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
  email: cleanText(input.email),
  first_name: cleanText(input.firstName),
  last_name: cleanText(input.lastName),
  job_title: cleanText(input.jobTitle),
  mda_sector: cleanText(input.mdaSector),
  confirmation_status: cleanText(input.confirmationStatus),
  registration_status: cleanText(input.registrationStatus, "Pending"),
  organization: cleanText(input.organization)
 }
}

const SELECT_COLUMNS = "id, qr_token, phone_number, attendee_id, email, first_name, last_name, job_title, mda_sector, confirmation_status, registration_status, organization, checked_in, check_in_time, scanned_at, last_scanned_at, scan_count, created_at, updated_at"

async function insertQrRegistration(input: QrRegistrationInput, qrToken: string): Promise<QrRegistrationRecord> {
 const { data, error } = await supabase
  .from(TABLE)
  .insert([toDbRow(input, qrToken)])
  .select(SELECT_COLUMNS)
  .single()

 if(error){
  const message = error.message || ""
  if(error.code === "23505" && message.toLowerCase().includes("qr_registrations_phone_number_key")){
   throw new AppError("QR_ALREADY_GENERATED", "A QR code has already been generated for this phone number. Only one QR code per phone number is allowed.", 409)
  }

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
   const err = error as { code?: string; message?: string }
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
  .select(SELECT_COLUMNS)
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

export async function recordQrRegistrationCheckIn(qrToken: string): Promise<QrRegistrationRecord | null> {
 const { data, error } = await supabase.rpc("record_qr_registration_check_in", {
  p_qr_token: qrToken
 })

 if(error){
  throw new AppError("QR_REGISTRATION_CHECK_IN_FAILED", error.message, 500)
 }

 return data ? mapRow(data as QrRegistrationRow) : null
}
