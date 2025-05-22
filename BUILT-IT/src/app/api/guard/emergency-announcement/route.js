import { query } from "../../../../lib/db"; // Assuming this path is correct
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// GET: Fetch recipients OR notification history
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view'); // Check for the 'view' query parameter

  try {
    let result;
    // --- Check if requesting history ---
    if (view === 'history') {
      result = await query(
        `SELECT notification_id, subject, message, recipients, sent_at
         FROM emergency_notifications
         ORDER BY sent_at DESC` // Fetch history, newest first
      );
    // --- Otherwise, fetch recipients (existing logic) ---
    } else {
      result = await query(
        `SELECT
           s.student_id, s.roll_no, s.full_name, s.department, s.batch,
           s.room_number, s.hostel_block, s.fees_paid, s.emergency_contact,
           s.email, s.in_status, s.unit_no, s."Floor_no", s."Degree", s.gender,
           u.role
         FROM students s
         JOIN app_users u ON s.email = u.email
         ORDER BY s.student_id ASC`
      );
    }

    // Check if rows exist before returning
    if (!result.rows) {
        console.warn(`No ${view === 'history' ? 'history' : 'recipients'} found.`);
        return NextResponse.json([]); // Return empty array if no rows
    }

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error(`Error fetching ${view === 'history' ? 'history' : 'recipients'}:`, error);
    return NextResponse.json({ error: `Database query failed: ${error.message}` }, { status: 500 });
  }
}

// POST: Send emergency announcement and store notification record
// (No changes needed here unless you want to return the newly created history item differently)
export async function POST(request) {
   try {
    const { subject, message, recipients } = await request.json();

    // --- Basic validation (keep as is) ---
    if (!subject || !message || !Array.isArray(recipients) || recipients.length === 0) { /* ... */ }
    const invalidEmails = recipients.filter(email => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    if (invalidEmails.length > 0) { /* ... */ }
    // --- End validation ---


    // --- Configure nodemailer (keep as is) ---
    if (!process.env.NOTI_EMAIL || !process.env.NOTI_EMAIL_PASS) { /* ... */ }
    const transporter = nodemailer.createTransport({ /* ... */ });
    const mailOptions = { /* ... */ };
    // --- End nodemailer config ---


    // --- Send the email (keep as is) ---
    const info = await transporter.sendMail(mailOptions);
    console.log("Announcement email sent: %s", info.messageId);
    // --- End send email ---


    // --- Insert notification record (keep as is) ---
    // Ensure the 'recipients' column can handle comma-separated emails.
    const result = await query(
      `INSERT INTO emergency_notifications (subject, message, recipients, sent_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [subject, message, recipients.join(", ")] // Store emails as comma-separated string
    );

    if (!result.rows || result.rows.length === 0) {
        console.error("Failed to insert emergency notification record after sending email.");
        // Keep existing behavior: return success but log DB issue.
        return NextResponse.json({ success: true, warning: "Email sent, but failed to log notification." });
    }
    // --- End insert record ---

    // Return success with the created notification object
    return NextResponse.json({ success: true, notification: result.rows[0] });

  } catch (error) {
    console.error("Error sending announcement or logging notification:", error);
    if (error.code === 'EAUTH') { /* ... */ }
    return NextResponse.json({ error: `Processing failed: ${error.message}` }, { status: 500 });
  }
}