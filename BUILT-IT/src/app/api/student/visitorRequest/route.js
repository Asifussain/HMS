import { query } from "../../../../lib/db";
import { NextResponse } from "next/server";

// POST: Create a new visitor request
export async function POST(request) {
  try {
    const {
      roll_no,
      hostel_block,
      room_number,
      emergency_contact,
      visitor_name,
      info,
    } = await request.json();

    // Validate required fields
    if (!roll_no || !hostel_block || !visitor_name || !info) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO visitor_requests 
        (roll_no, hostel_block, room_number, emergency_contact, visitor_name, info, requested_on_time)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [roll_no, hostel_block, room_number || null, emergency_contact || null, visitor_name, info]
    );
    return NextResponse.json({ success: true, request: result.rows[0] });
  } catch (error) {
    console.error("Error inserting visitor request:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: Fetch all visitor requests for a student (using roll_no query parameter)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rollNo = searchParams.get("rollNo");

    if (!rollNo) {
      return NextResponse.json({ error: "Missing rollNo parameter" }, { status: 400 });
    }

    const result = await query(
      `SELECT roll_no, hostel_block, room_number, emergency_contact, visitor_name, info, 
              requested_on_time, arrival_time, departure_time
       FROM visitor_requests 
       WHERE roll_no = $1 
       ORDER BY requested_on_time DESC`,
      [rollNo]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching visitor requests:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Cancel a visitor request (expects requestId as a query parameter)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("requestId");

    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId parameter" }, { status: 400 });
    }

    const result = await query(
      "DELETE FROM visitor_requests WHERE request_id = $1 RETURNING *",
      [requestId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    console.error("Error deleting visitor request:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
