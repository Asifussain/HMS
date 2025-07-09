# Hostel Management System (HMS) - IIT Indore

## Overview
The Hostel Management System (HMS) for IIT Indore is a comprehensive digital solution designed to streamline various hostel-related operations for students, administration, and staff. Built with Next.js, this application aims to enhance communication, improve efficiency in managing student data, maintenance, and other essential services within the hostel environment.

## Features

This system provides distinct dashboards and functionalities tailored to different user roles:

### Student Module
* **Personal Profile Management**: Students can view and update their personal information.
* **Complaint Management**: Submit and track various types of complaints (technical, electrical, plumbing, carpentry, cleanliness, other) with detailed descriptions and optional photo uploads.
* **Room Change Requests**: Apply for room changes, check preferred room availability, and track request status.
* **Visitor Management**: Request and manage visitor entries, including tracking their arrival and departure.
* **Feedback Submission**: Provide weekly feedback on infrastructure, technical services, cleanliness, and overall hostel experience.
* **Counseling Support**: Request confidential mental health support, triggering an email notification to the counseling team.
* **Academic & Dining Portals**: Quick access links to external academic and dining platforms.
* **QR Code for Gate Entry/Exit**: Dynamically generated QR code for seamless check-in/check-out at hostel gates.

### Admin Module
* **Student Management**: View, filter, and manage student data, including academic and hostel details. Export student data to PDF format.
* **Data Integration**: Upload student data via CSV files for bulk updates and new entries.
* **Maintenance Tracking**: Oversee all maintenance complaints, track their status (pending, in progress, completed), and view resolution information. Filter complaints by hostel.
* **Room Request Tracking**: Review and manage student room change requests, including approving or rejecting them and updating student room assignments.
* **Notification Management**: Compose and send notifications to specific groups of students based on various filters (batch, department, hostel, room, floor, unit).
* **Analytics Dashboard**: Gain insights into hostel occupancy rates and complaint resolution trends through interactive charts and summaries.
* **Feedback Review**: Access and analyze student feedback on various services, filterable by month, year, and hostel.
* **User Role Management**: Assign and manage roles for different staff members (admin, technician, plumber, carpenter, cleaner, etc.) within the system.

### Guard Module
* **Check-In/Check-Out**: Utilize QR code scanning to efficiently manage student entry and exit from the hostel.
* **Visitor Management**: Track and update the status of visitor requests (check-in, check-out, cancel).
* **Emergency Announcements**: Send urgent notifications to specific groups of students or the entire campus.
* **Student Status Info**: View real-time student presence status within the hostel.

### Staff Modules (Technician, Plumber, Carpenter, Cleaner, Other)
* **Maintenance Tracking**: Dedicated dashboards for various staff roles to view and update the status of complaints relevant to their trade.

## Technologies Used

* **Frontend**: [Next.js](https://nextjs.org/), [React.js](https://react.dev/), HTML, CSS
* **Styling**: [Tailwind CSS](https://tailwindcss.com/), PostCSS
* **State Management/UI Libraries**: [Framer Motion](https://www.framer.com/motion/) (for animations), [Headless UI](https://headlessui.com/), [Lucide React](https://lucide.dev/) (for icons), [React Icons](https://react-icons.github.io/react-icons/)
* **Database**: PostgreSQL (via [Drizzle ORM](https://orm.drizzle.team/))
* **Authentication**: [Supabase Auth](https://supabase.com/auth)
* **API Routes**: Next.js API Routes
* **Charting**: [Chart.js](https://www.chartjs.org/), [React Chart.js 2](https://react-chartjs-2.js.org/), [Recharts](https://recharts.org/)
* **QR Code Generation**: [qrcode.react](https://www.npmjs.com/package/qrcode.react), [html5-qrcode](https://www.npmjs.com/package/html5-qrcode)
* **PDF Generation**: [jspdf](https://jspdf.org/), [jspdf-autotable](https://www.npmjs.com/package/jspdf-autotable)
* **Emailing**: [Nodemailer](https://nodemailer.com/)

## Getting Started

First, ensure you have Node.js (version 18.18.0 or later) installed on your system.

1.  **Clone the Repository**:
    ```bash
    git clone <repository_url>
    cd HMS
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    # or
    bun install
    ```

3.  **Set up Environment Variables**:
    Create a `.env.local` file in the `BUILT-IT/` directory (where `package.json` is located).
    Add your Supabase and Nodemailer credentials:
    ```dotenv
    DATABASE_URL="postgresql://[YOUR_SUPABASE_DB_CREDENTIALS]"
    NEXT_PUBLIC_SUPABASE_URL="https://[YOUR_SUPABASE_PROJECT_REF].supabase.co"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR_SUPABASE_ANON_KEY]"

    NOTIFICATION_EMAIL="your_notification_email@gmail.com"
    NOTIFICATION_EMAIL_PASS="your_notification_email_app_password"

    NOTI_EMAIL="your_guard_email@gmail.com"
    NOTI_EMAIL_PASS="your_guard_email_app_password"
    ```
    Replace the placeholder values with your actual Supabase project URL, Anon Key, and Nodemailer email credentials (using App Passwords for Gmail).

4.  **Run the Development Server**:
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    # or
    bun dev
    ```

5.  **Open in Browser**:
    Open [http://localhost:3000](http://localhost:3000) with your web browser to see the result. The page auto-updates as you edit the files.

## Project Structure Overview

The project follows a standard Next.js `app` router structure:

* `src/app/`: Contains all page routes and API routes.
    * `admin/`: Admin dashboard and related pages (e.g., `students-data`, `maintenance-tracking`).
    * `student/`: Student dashboard and related pages (e.g., `profile`, `complaints`).
    * `guard/`: Guard dashboard and related pages (e.g., `check-in-out`, `visitor-management`).
    * `api/`: Backend API routes for various functionalities (e.g., `api/admin/students`, `api/student/feedback`).
    * `components/`: Reusable React components (e.g., `Navbar`, `Footer`).
    * `sign-in/`, `sign-up/`: Authentication pages.
* `src/lib/`: Utility files for database connection (`db.js`), Supabase client (`supabaseClient.js`), and role management (`role.js`, `syncUser.js`).
* `public/`: Static assets like images and PDF documents (e.g., `academic_calendar.pdf`, `holidays.pdf`).
* `.env.local`: Environment variables (as described in "Set up Environment Variables").
* `package.json`: Project metadata and dependencies.

## Database Schema (Key Tables)

The application interacts with several PostgreSQL tables. Here are some of the critical ones inferred from the API routes:

* **`students`**: Stores student personal, academic, and hostel details (e.g., `roll_no`, `full_name`, `email`, `room_number`, `hostel_block`, `in_status`).
* **`app_users`**: Manages user roles and email addresses for system access (e.g., `email`, `role`, `phone_number`).
* **`complaints`**: Records maintenance complaints (e.g., `roll_no`, `type`, `description`, `status`, `resolution_info`).
* **`room_change_requests`**: Stores student requests for room changes (e.g., `student_id`, `current_room`, `preferred_room`, `reason`, `status`).
* **`visitor_requests`**: Manages visitor information and their entry/exit times (e.g., `roll_no`, `visitor_name`, `arrival_time`, `departure_time`).
* **`feedbacks`**: Collects student feedback ratings and text (e.g., `student_id`, `feedback_text`, `overall_rating`, `feedback_week`).
* **`emergency_notifications`**: Logs emergency announcements sent by guards or admins.

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

For more details on deploying a Next.js application, refer to the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

## Contributing

Contributions are welcome! If you'd like to contribute, please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add new feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

## License

This project is licensed under the MIT License - see the `LICENSE` file (if available in the original repository) for details.

## Contact

For any inquiries or support, please open an issue in the GitHub repository or contact the project maintainers.
