import { query } from "../../../../lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // Get roll_no from query parameters
    const { searchParams } = new URL(request.url);
    const roll_no = searchParams.get('roll_no');
    
    if (!roll_no) {
      return NextResponse.json({ error: "Roll number is required" }, { status: 400 });
    }
    
    // Query database for student with this roll number
    const result = await query(
      "SELECT student_id, roll_no, full_name, department, batch, in_status FROM students WHERE roll_no = $1",
      [roll_no]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ not_found: true, error: "Student not found" }, { status: 404 });
    }
    
    // Return student data
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching student status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}