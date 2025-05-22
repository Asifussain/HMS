import { query } from "../../../../lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const preferredRoom = searchParams.get("room");
    const hostel = searchParams.get("hostel");
    if (!preferredRoom || !hostel) {
      return NextResponse.json({ error: "Missing room or hostel parameter" }, { status: 400 });
    }
    // Query to see if any student in the same hostel has this room assigned.
    const result = await query(
      "SELECT * FROM students WHERE room_number = $1 AND hostel_block = $2",
      [preferredRoom, hostel]
    );
    if (result.rowCount > 0) {
      return NextResponse.json({ available: false });
    } else {
      return NextResponse.json({ available: true });
    }
  } catch (error) {
    console.error("Error checking room availability:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
