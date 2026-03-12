import { pool } from "./db";

/*
Generate 9 digit base
*/
function generateBaseAccount(): string {

 return Math.floor(
 100000000 + Math.random() * 900000000
 ).toString();

}

/*
Checksum calculation
*/

function calculateCheckDigit(base: string): number {

 const weights = [3,7,3,3,7,3,3,7,3];

 let sum = 0;

 for(let i=0;i<9;i++){

  sum += parseInt(base[i]) * weights[i];

 }

 return (10 - (sum % 10)) % 10;

}

/*
Generate NUBAN
*/

function generateNUBAN(): string {

 const base = generateBaseAccount();

 const checkDigit = calculateCheckDigit(base);

 return base + checkDigit;

}

/*
Ensure uniqueness
*/

export async function generateUniqueNUBAN(){

 while(true){

  const account = generateNUBAN();

  const existing = await pool.query(
   "SELECT id FROM accounts WHERE account_number=$1",
   [account]
  );

  if(existing.rows.length === 0){

   return account;

  }

 }

}