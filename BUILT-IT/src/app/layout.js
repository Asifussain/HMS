import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./globals.css";

export const metadata = {
  title: "Hostel Management System - IIT Indore",
  description: "Hostel Management System for IIT Indore",
};

export default function RootLayout({ children }) {
  return (
      <html lang="en">
        <body>
          <Navbar /> 
          {children}
          <Footer/>
        </body>
      </html>
  );
}

