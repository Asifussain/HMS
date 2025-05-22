// app/api/admin/add-user/route.js
import { query } from "../../../../lib/db"; // Adjust path to your db connection utility
import { NextResponse } from "next/server";

// Define allowed roles on the backend as well for validation
const ALLOWED_ROLES = [
    "admin", "technician", "plumber", "carpenter", "cleaner",
    "manager", "supervisor", "staff", "user", "guest",
];

export async function POST(request) {
  console.log("API Route Hit: /api/admin/add-user");
  try {
    const { email, role, phone_number } = await request.json();
    console.log("Received data:", { email, role, phone_number });

    // --- Backend Validation ---
    if (!email || !role) {
      console.error("Validation failed: Email and Role are required.");
      return NextResponse.json({ error: "Email and Role are required." }, { status: 400 });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        console.error("Validation failed: Invalid email format.");
        return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
    }
    if (!ALLOWED_ROLES.includes(role)) {
        console.error(`Validation failed: Role '${role}' is not allowed.`);
       return NextResponse.json({ error: `Role '${role}' is not an assignable role.` }, { status: 400 });
    }
    // Optional: Add validation for phone number format if needed

    // --- Insert into Database ---
    const sql = `
      INSERT INTO public.app_users (email, role, phone_number)
      VALUES ($1, $2, $3)
      RETURNING id, email, role; -- Return the newly created user data
    `;
    const params = [email, role, phone_number || null]; // Ensure null is sent if phone_number is empty/undefined

    console.log("Executing SQL query to add user...");
    const result = await query(sql, params);
    console.log("SQL query completed. Rows affected:", result?.rowCount);


    if (result.rowCount === 1) {
      console.log("User added successfully:", result.rows[0]);
      return NextResponse.json(
          { message: "User added successfully!", user: result.rows[0] },
          { status: 201 } // 201 Created status
      );
    } else {
        console.error("Insert query succeeded but did not return expected row count:", result);
        throw new Error("Failed to insert user, unexpected database response.");
    }

  } catch (error) {
    console.error("Error adding user:", error);

    // Check for unique constraint violation (PostgreSQL error code 23505)
    if (error.code === '23505' && (error.constraint === 'app_users_email_key' || error.constraint === 'unique_email')) {
        console.warn(`Attempted to add duplicate email: ${error.detail || email}`);
        return NextResponse.json({ error: `Email '${email}' already exists in the system.` }, { status: 409 }); // 409 Conflict
    }

    // Generic server error
    return NextResponse.json(
      { error: "Failed to add user due to a server error.", details: error.message },
      { status: 500 }
    );
  }
}