import * as dotenv from "dotenv";
dotenv.config();

export const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;
export const SESSION_SECRET = process.env.SESSION_SECRET as string;
