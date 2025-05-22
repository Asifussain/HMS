import { query } from "../../../../lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const hostel = searchParams.get("hostel");
    let sql = "SELECT * FROM feedbacks";
    let params = [];
    if (hostel) {
      sql += " WHERE hostel_block = $1";
      params.push(hostel);
    }
    sql += " ORDER BY feedback_week DESC, created_at DESC";
    const result = await query(sql, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
