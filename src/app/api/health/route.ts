import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { sql } from "drizzle-orm";
import countriesData from "@/data/countries.json";

export async function GET() {
  let dbStatus = "ok";
  try {
    await db.execute(sql`SELECT 1`);
  } catch {
    dbStatus = "error";
  }

  return NextResponse.json({
    status: dbStatus === "ok" ? "ok" : "degraded",
    db: dbStatus,
    version: process.env.npm_package_version ?? "0.1.0",
    dataset_version: countriesData.version,
    timestamp: new Date().toISOString(),
  });
}
