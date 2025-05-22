import { query } from "../../../lib/db";
import { NextResponse } from "next/server";

// GET: Fetch complaints by RollNo with student details (query parameter)
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const RollNo = searchParams.get("RollNo");
        if (!RollNo) {
            return NextResponse.json({ error: "Missing RollNo parameter" }, { status: 400 });
        }
        const result = await query(
            `
            SELECT
                c.complaint_id,
                c.roll_no,
                c.type,
                c.description,
                c.photo_url,
                c.status,
                c.resolution_info,
                c.closed_at,
                c.created_at,
                c.hostel_block AS complaint_hostel_block,
                c.room_number AS complaint_room_number,
                c.unit_no AS complaint_unit_no,
                s.full_name AS student_name,
                s.department,
                s.emergency_contact AS mobile,
                s.room_number AS student_room,
                s.hostel_block AS student_hostel_block,
                s."Floor_no" AS floor_no,
                s.unit_no AS student_unit_no,
                s.email
            FROM
                public.complaints c
            JOIN
                public.students s ON c.roll_no = s.roll_no
            WHERE
                c.roll_no = $1
            ORDER BY
                c.created_at DESC
            `,
            [RollNo]
        );
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("Error fetching complaints:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: File a new complaint (including hostel_block, room_number, and unit_no)
export async function POST(request) {
    try {
        const { RollNo, type, description, photo, hostel_block, room_number, unit_no } = await request.json();
        if (!RollNo || !type || !description || !hostel_block || !room_number) {
            return NextResponse.json({ error: "Missing required fields (RollNo, type, description, hostel_block, room_number)" }, { status: 400 });
        }
        const result = await query(
            `
            INSERT INTO complaints (roll_no, type, description, photo_url, hostel_block, room_number, unit_no)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            `,
            [RollNo, type, description, photo || null, hostel_block, room_number, unit_no || null]
        );
        return NextResponse.json({ success: true, complaint: result.rows[0] });
    } catch (error) {
        console.error("Error filing complaint:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}