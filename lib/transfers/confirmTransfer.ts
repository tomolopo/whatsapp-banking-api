import { resolveAccount } from "./resolveAccount"

export async function confirmTransferDetails(
 accountNumber: string,
 amount: number
){

 const resolved = await resolveAccount(accountNumber)

 return {
  accountNumber,
  accountName: resolved.accountName,
  bankName: resolved.bankName,
  amount,
  confirmationMessage:
   `Send ₦${amount} to ${resolved.accountName} (${resolved.bankName})?`
 }

}