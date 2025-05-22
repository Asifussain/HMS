import { query } from "../../../../lib/db";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // Modified to use roll_no instead of rollNo to match the client
    const { roll_no, in_status } = await request.json();
    
    if (!roll_no || in_status === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Update the student's in_status (true = checked in, false = checked out)
    const result = await query(
      "UPDATE students SET in_status = $1 WHERE roll_no = $2 RETURNING *",
      [in_status, roll_no]
    );
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, student: result.rows[0] });
  } catch (error) {
    console.error("Error updating student check in/out:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}