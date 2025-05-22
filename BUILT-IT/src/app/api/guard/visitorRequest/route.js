import { query } from "../../../../lib/db";
import { NextResponse } from "next/server";

// GET: Fetch all visitor requests, ordered by requested_on_time descending.
export async function GET(request) {
  try {
    const result = await query("SELECT * FROM visitor_requests ORDER BY requested_on_time DESC");
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching visitor requests:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Update a visitor request – check in or check out
// Expects JSON payload: { request_id, action }
// action: "check_in" or "check_out"
export async function POST(request) {
  try {
    const { request_id, action } = await request.json();
    if (!request_id || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const now = new Date().toISOString();
    let updateQuery = "";
    let params = [];
    if (action === "check_in") {
      // Only update if arrival_time is not already set
      updateQuery = "UPDATE visitor_requests SET arrival_time = $1 WHERE request_id = $2 RETURNING *";
      params = [now, request_id];
    } else if (action === "check_out") {
      // Only update if arrival_time is set and departure_time is not yet set
      updateQuery = "UPDATE visitor_requests SET departure_time = $1 WHERE request_id = $2 RETURNING *";
      params = [now, request_id];
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    const result = await query(updateQuery, params);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, request: result.rows[0] });
  } catch (error) {
    console.error("Error updating visitor request:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
