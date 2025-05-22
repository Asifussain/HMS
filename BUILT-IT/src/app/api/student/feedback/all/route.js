import { query } from "../../../../../lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    if (!studentId) {
      return NextResponse.json({ error: "Missing studentId parameter" }, { status: 400 });
    }
    const result = await query(
      "SELECT * FROM feedbacks WHERE student_id = $1 ORDER BY feedback_week DESC, created_at DESC",
      [studentId]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
