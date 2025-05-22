import nodemailer from "nodemailer";
import { query } from "../../../lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'all';
    
    let queryString = 'SELECT * FROM notifications';
    const params = [];
    
    if (statusFilter !== 'all') {
      queryString += ' WHERE status = $1';
      params.push(statusFilter);
    }
    
    queryString += ' ORDER BY sent_at DESC';
    
    const result = await query(queryString, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching notifications history:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.NOTIFICATION_EMAIL,
      pass: process.env.NOTIFICATION_EMAIL_PASS,
    },
  });

  try {
    const { subject, message, recipients } = await request.json();
    
    if (!subject || !message || !recipients?.length) {
      return NextResponse.json(
        { error: "Missing required fields" }, 
        { status: 400 }
      );
    }

    let status = 'success';
    let errorMessage = null;

    try {
      await transporter.sendMail({
        from: process.env.NOTIFICATION_EMAIL,
        to: recipients.join(", "),
        subject,
        text: message,
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      status = 'failed';
      errorMessage = emailError.message;
    }

    const result = await query(
      `INSERT INTO notifications 
        (subject, message, recipients, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [subject, message, recipients, status]
    );

    const responseData = {
      success: status === 'success',
      notification: result.rows[0]
    };

    if (errorMessage) {
      responseData.error = errorMessage;
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Error processing notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}