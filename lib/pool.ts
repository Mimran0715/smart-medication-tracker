import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST || "db",
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
};

if (!dbConfig.user || !dbConfig.database || !dbConfig.password) {
  throw new Error("Missing required database environment variables");
}

export const pool = new Pool(dbConfig);