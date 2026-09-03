import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");

function readDb() {
  const data = fs.readFileSync(dbPath, "utf-8");
  return JSON.parse(data);
}

function writeDb(data: any) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  try {
    const db = readDb();
    return NextResponse.json(db.filterOptions || {});
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch filters" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const db = readDb();
    db.filterOptions = { ...db.filterOptions, ...body };
    writeDb(db);
    return NextResponse.json(db.filterOptions);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update filters" }, { status: 500 });
  }
}
