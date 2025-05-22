import { query } from "../../../../lib/db";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { csv } = await request.json();
    if (!csv) {
      return NextResponse.json({ success: false, error: "CSV data missing" }, { status: 400 });
    }

    // Split CSV into lines, ignoring empty lines.
    const lines = csv.split("\n").filter((line) => line.trim() !== "");
    if (lines.length < 2) {
      return NextResponse.json({ success: false, error: "CSV must have at least one data row" }, { status: 400 });
    }

    // Expected header fields (order matters):
    const header = lines[0].split(",").map((h) => h.trim());
    const expected = [
      "roll_no",
      "full_name",
      "department",
      "batch",
      "room_number",
      "hostel_block",
      "fees_paid",
      "emergency_contact",
      "email",
      "in_status",
      "unit_no",
      "Floor_no",
      "Degree",
      "gender"
    ];

    // Validate the header against expected
    const missingHeaders = expected.filter(field => !header.includes(field));
    if (missingHeaders.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Missing required headers: ${missingHeaders.join(", ")}` 
      }, { status: 400 });
    }

    let errors = [];
    let successCount = 0;
    
    // Process each data row (starting from index 1)
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(",").map((cell) => cell.trim());
      
      // Create an object to store values by header name for better readability
      const rowData = {};
      header.forEach((colName, index) => {
        rowData[colName] = index < row.length ? row[index] : '';
      });

      // Check for any missing fields from the expected list
      const missingFields = expected.filter(field => 
          !rowData[field] && rowData[field] !== 0 && rowData[field] !== false
      );
      
      if (missingFields.length > 0) {
        errors.push(`Row ${i + 1} (${rowData.roll_no || 'Unknown roll_no'}): Missing fields: ${missingFields.join(", ")}`);
        continue;
      }

      try {
        // Convert specific fields to appropriate types
        const convertedData = {
          roll_no: rowData.roll_no,
          full_name: rowData.full_name,
          department: rowData.department,
          batch: parseInt(rowData.batch, 10),
          room_number: rowData.room_number || null,
          hostel_block: rowData.hostel_block || null,
          fees_paid: rowData.fees_paid?.toLowerCase() === "true",
          emergency_contact: rowData.emergency_contact || null,
          email: rowData.email || null,
          in_status: rowData.in_status?.toLowerCase() === "true",
          unit_no: rowData.unit_no ? parseInt(rowData.unit_no, 10) : null,
          Floor_no: rowData.Floor_no ? parseInt(rowData.Floor_no, 10) : null,
          Degree: rowData.Degree || null,
          gender: rowData.gender || null
        };

        // Validate data types
        if (isNaN(convertedData.batch)) {
          errors.push(`Row ${i + 1} (${rowData.roll_no}): Invalid batch value, must be a number.`);
          continue;
        }
        
        if (rowData.unit_no && isNaN(convertedData.unit_no)) {
          errors.push(`Row ${i + 1} (${rowData.roll_no}): Invalid unit_no value, must be a number.`);
          continue;
        }
        
        if (rowData.Floor_no && isNaN(convertedData.Floor_no)) {
          errors.push(`Row ${i + 1} (${rowData.roll_no}): Invalid Floor_no value, must be a number.`);
          continue;
        }

        // Insert/update into students table
        await query(
          `INSERT INTO students (
            roll_no, full_name, department, batch, room_number, hostel_block, 
            fees_paid, emergency_contact, email, in_status, unit_no, 
            "Floor_no", "Degree", gender
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (roll_no) DO UPDATE 
             SET full_name = EXCLUDED.full_name,
                 department = EXCLUDED.department,
                 batch = EXCLUDED.batch,
                 room_number = EXCLUDED.room_number,
                 hostel_block = EXCLUDED.hostel_block,
                 fees_paid = EXCLUDED.fees_paid,
                 emergency_contact = EXCLUDED.emergency_contact,
                 email = EXCLUDED.email,
                 in_status = EXCLUDED.in_status,
                 unit_no = EXCLUDED.unit_no,
                 "Floor_no" = EXCLUDED."Floor_no",
                 "Degree" = EXCLUDED."Degree",
                 gender = EXCLUDED.gender;`,
          [
            convertedData.roll_no,
            convertedData.full_name,
            convertedData.department,
            convertedData.batch,
            convertedData.room_number,
            convertedData.hostel_block,
            convertedData.fees_paid,
            convertedData.emergency_contact,
            convertedData.email,
            convertedData.in_status,
            convertedData.unit_no,
            convertedData.Floor_no,
            convertedData.Degree,
            convertedData.gender
          ]
        );

        // Only insert into app_users if email is provided
        if (convertedData.email) {
          await query(
            `INSERT INTO app_users (email, role)
             VALUES ($1, $2)
             ON CONFLICT (email) DO UPDATE 
               SET role = EXCLUDED.role;`,
            [convertedData.email, "student"]
          );
        } else {
          // Log as a warning but don't stop processing
          errors.push(`Row ${i + 1} (${rowData.roll_no}): Student added but no email provided for app_user.`);
        }
        
        successCount++;
      } catch (err) {
        console.error(`Error processing row ${i + 1} (roll_no: ${rowData.roll_no || 'Unknown'}):`, err.message);
        errors.push(`Row ${i + 1} (roll_no: ${rowData.roll_no || 'Unknown'}): ${err.message}`);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      successCount, 
      errors,
      message: errors.length > 0 ? "Upload completed with some errors" : "Upload completed successfully" 
    });
  } catch (error) {
    console.error("Error processing CSV upload:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}