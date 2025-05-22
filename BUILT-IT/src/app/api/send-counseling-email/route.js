// File: src/app/api/send-counseling-email/route.js
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
  try {
    // Parse the request body
    const data = await request.json();
    const { rollNo } = data;

    // Fetch student details from the students table
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('*')
      .eq('roll_no', rollNo)
      .single();

    if (fetchError) {
      console.error('Failed to fetch student details:', fetchError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch student details'
        },
        { status: 500 }
      );
    }

    // Create a transporter using the existing credentials in .env.local
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NOTIFICATION_EMAIL,
        pass: process.env.NOTIFICATION_EMAIL_PASS
      }
    });

    // Email content
    const mailOptions = {
      from: process.env.NOTIFICATION_EMAIL,
      to: 'saisathwikneelam@gmail.com', // Counselor's email as specified
      subject: `Counseling Support Request - ${student.full_name} (${student.roll_no})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #3730a3; border-bottom: 2px solid #3730a3; padding-bottom: 10px;">Counseling Support Request</h2>
          
          <p>A student has requested mental health counseling support. Please contact them at your earliest convenience.</p>
          
          <h3 style="margin-top: 20px; color: #333;">Student Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-weight: bold; width: 150px;">Name:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${student.full_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Roll Number:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${student.roll_no}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Email:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${student.email || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Department:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${student.department}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Batch:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${student.batch}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Hostel Block:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${student.hostel_block || 'Not Assigned'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Room Number:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${student.room_number || 'Not Assigned'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Emergency Contact:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${student.emergency_contact || 'Not provided'}</td>
            </tr>
          </table>
          
          <div style="margin-top: 30px; padding: 15px; background-color: #f8f9ff; border-left: 4px solid #3730a3; border-radius: 4px;">
            <p style="margin: 0; color: #333;"><strong>Important:</strong> Please respond to this request within 24 hours, as per the institute guidelines for mental health support.</p>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #777;">
            This is an automated email sent from the Hostel Management System. Please do not reply to this email.
          </p>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
            &copy; ${new Date().getFullYear()} Hostel Management System - Built-IT
          </div>
        </div>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Send confirmation email to student (if student email is available)
    if (student.email) {
      const studentMailOptions = {
        from: process.env.NOTIFICATION_EMAIL,
        to: student.email,
        subject: 'Your Counseling Support Request - Confirmation',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #3730a3; border-bottom: 2px solid #3730a3; padding-bottom: 10px;">Counseling Support Request - Confirmation</h2>
            
            <p>Dear ${student.full_name},</p>
            
            <p>We have received your request for counseling support. Our counseling team has been notified and someone will reach out to you shortly.</p>
            
            <div style="margin: 25px 0; padding: 15px; background-color: #f2f6ff; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #3730a3;">What to expect next:</h3>
              <ul style="padding-left: 20px; margin-bottom: 0;">
                <li>A counselor will contact you within 24 hours via email or phone.</li>
                <li>All conversations are strictly confidential.</li>
                <li>Initial sessions are typically 30-45 minutes.</li>
              </ul>
            </div>
            
            <p>If you need immediate assistance, please contact our emergency helpline at the Student Affairs Office.</p>
            
            <div style="margin-top: 30px; padding: 15px; background-color: #f8f9ff; border-left: 4px solid #3730a3; border-radius: 4px;">
              <h4 style="margin-top: 0; color: #3730a3;">Mental Health Resources</h4>
              <p style="margin-bottom: 10px;">While you wait to hear from a counselor, you might find these resources helpful:</p>
              <ul style="padding-left: 20px; margin-bottom: 0;">
                <li>Institute Wellness Center</li>
                <li>Meditation Sessions: Every weekday at 6 PM in the Student Activity Center</li>
                <li>Anonymous Peer Support: Available via the Institute App</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px;">Wishing you well,<br>The Counseling Team</p>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
              &copy; ${new Date().getFullYear()} Hostel Management System - Built-IT
            </div>
          </div>
        `,
      };

      await transporter.sendMail(studentMailOptions);
    }

    // Log the counseling request (optional)
    // Using a try-catch to ensure the API call succeeds even if logging fails
    try {
      // Create a counseling_requests table if you want to track these requests
      const { error: logError } = await supabase
        .from('counseling_requests')
        .insert({
          student_id: student.student_id,
          request_date: new Date().toISOString(),
          status: 'pending'
        });

      if (logError) {
        console.error('Failed to log counseling request:', logError);
      }
    } catch (logErr) {
      console.error('Error logging counseling request:', logErr);
      // Continue execution, don't return an error
    }

    return NextResponse.json({ 
      success: true,
      message: 'Counseling request sent successfully'
    });
  } catch (error) {
    console.error('Failed to send counseling request:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send counseling request'
      },
      { status: 500 }
    );
  }
}