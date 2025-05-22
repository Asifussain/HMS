import { query } from "../../../../lib/db";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const {
      studentId,
      feedback_text,
      infra_rating,
      technical_rating,
      cleanliness_rating,
      overall_rating,
      feedback_week,
      hostel_block
    } = await request.json();
    if (
      !studentId ||
      !feedback_text ||
      infra_rating == null ||
      technical_rating == null ||
      cleanliness_rating == null ||
      overall_rating == null ||
      !feedback_week ||
      !hostel_block
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const result = await query(
      `INSERT INTO feedbacks (student_id, feedback_text, infra_rating, technical_rating, cleanliness_rating, overall_rating, feedback_week, hostel_block)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [studentId, feedback_text, infra_rating, technical_rating, cleanliness_rating, overall_rating, feedback_week, hostel_block]
    );
    return NextResponse.json({ success: true, feedback: result.rows[0] });
  } catch (error) {
    console.error("Error inserting feedback:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
