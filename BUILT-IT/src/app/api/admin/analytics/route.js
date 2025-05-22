// app/api/admin/analytics/route.js
import { query } from "../../../../lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // Occupancy per hostel: group by hostel_block and count
    const hostelResult = await query(`
      SELECT 
        hostel_block,
        COUNT(*) AS occupied
      FROM complaints
      WHERE hostel_block IS NOT NULL
      GROUP BY hostel_block
      ORDER BY hostel_block ASC
    `);
    
    const hostels = hostelResult.rows;

    // Complaint resolution: count complaints by status
    const complaintResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'in progress') AS "in progress",
        COUNT(*) FILTER (WHERE status = 'completed') AS completed
      FROM complaints
    `);
    
    const complaints = complaintResult.rows[0];

    // Build the data object with occupancy per hostel and complaint status
    const data = {
      occupancy: {
        hostels: hostels.map((row) => ({
          hostel_block: row.hostel_block,
          occupied: parseInt(row.occupied, 10)
        }))
      },
      complaints: {
        pending: parseInt(complaints.pending, 10),
        "in progress": parseInt(complaints["in progress"], 10),
        completed: parseInt(complaints.completed, 10)
      }
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}