import { Pool, PoolConfig } from "pg"

const config: PoolConfig = {
 connectionString: process.env.DATABASE_URL
}

if(process.env.DATABASE_CA_CERT){
 config.ssl = {
  rejectUnauthorized: true,
  ca: process.env.DATABASE_CA_CERT
 }
} else if(process.env.DATABASE_SSL === "true"){
 config.ssl = { rejectUnauthorized: true }
}

export const pool = new Pool(config)
