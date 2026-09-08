import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_zhlvHLFGVA76@ep-plain-mode-b2fq4008-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require";

export const sql = neon(DATABASE_URL);
