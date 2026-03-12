export function generateBaseAccount(): string {

 return Math.floor(
 100000000 + Math.random() * 900000000
 ).toString();

}

function checksum(account: string): number {

 const digits = account.split("").map(Number);

 const weights = [3,7,3,3,7,3,3,7,3];

 let sum = 0;

 for(let i=0;i<9;i++){
  sum += digits[i] * weights[i];
 }

 return (10 - (sum % 10)) % 10;

}

export function generateNUBAN(): string {

 const base = generateBaseAccount();

 const check = checksum(base);

 return base + check;

}