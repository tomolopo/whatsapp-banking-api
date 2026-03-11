declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    UPSTASH_REDIS_REST_URL: string;
    UPSTASH_REDIS_REST_TOKEN: string;
    JWT_SECRET: string;
  }
}