// app/api/admin/users-by-roles/route.js
import { query } from "../../../../lib/db"; // Adjust path if your db utility is elsewhere
import { NextResponse } from "next/server";

export async function GET(request) {
  console.log("API Route Hit: /api/admin/users-by-roles"); // Add log
  try {
    // SQL to get users by role with email and phone number details
    const sql = `
      SELECT
        role,
        COUNT(*) as count,
        jsonb_agg(
          jsonb_build_object(
            'email', email,
            'phone_number', phone_number
          )
          ORDER BY email -- Optional: order users within each role
        ) as user_details
      FROM
        public.app_users -- Ensure schema name 'public.' is correct if needed
      WHERE
        role IS NOT NULL
        -- AND role != 'student' -- Example filter, uncomment/modify if needed
      GROUP BY
        role
      ORDER BY
        role ASC; -- Order roles alphabetically
    `;

    console.log("Executing SQL query for users-by-roles...");
    const result = await query(sql, []);
    console.log("SQL query completed. Rows found:", result?.rowCount);

    // Make sure we're returning valid JSON (specifically an array)
    if (!result || !result.rows) {
      console.error("Database query returned invalid result:", result);
      throw new Error("Database query returned invalid result");
    }

    return NextResponse.json(result.rows); // Removed extra headers, Next.js handles content-type

  } catch (error) {
    console.error("Error fetching users by role:", error);
    // Return a JSON error response
    return NextResponse.json(
      { error: "Failed to fetch user roles.", details: error.message },
      { status: 500 }
    );
  }
}