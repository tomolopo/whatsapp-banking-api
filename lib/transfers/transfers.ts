import { internalTransfer } from "./internal"

export async function executeTransfer(
 fromAccountNumber: string,
 toAccountNumber: string,
 amount: number,
 phone: string,
 pin: string,
 idempotencyKey: string
){

 return await internalTransfer(
  fromAccountNumber,
  toAccountNumber,
  amount,
  phone,
  pin,
  idempotencyKey
 )

}