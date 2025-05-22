"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  YoutubeIcon, 
  FacebookIcon, 
  TwitterIcon, 
  InstagramIcon, 
  LinkedinIcon 
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { 
      icon: YoutubeIcon, 
      url: 'https://www.youtube.com/channel/UCRnqhv7p9bU1B2eHO7IFfPw/videos', 
      alt: 'YouTube',
      color: 'text-red-500 hover:text-red-600',
      bgHover: 'hover:bg-red-100'
    },
    { 
      icon: FacebookIcon, 
      url: 'https://www.facebook.com/profile.php?id=100064798209779', 
      alt: 'Facebook',
      color: 'text-blue-600 hover:text-blue-700',
      bgHover: 'hover:bg-blue-100'
    },
    { 
      icon: TwitterIcon, 
      url: 'https://x.com/iitiofficial?lang=en', 
      alt: 'X',
      color: 'text-sky-500 hover:text-sky-600',
      bgHover: 'hover:bg-sky-100'
    },
    { 
      icon: InstagramIcon, 
      url: 'https://www.instagram.com/iitindoreofficial/', 
      alt: 'Instagram',
      color: 'text-pink-500 hover:text-pink-600',
      bgHover: 'hover:bg-pink-100'
    },
    { 
      icon: LinkedinIcon, 
      url: 'https://www.linkedin.com/school/iit-indore/', 
      alt: 'LinkedIn',
      color: 'text-blue-700 hover:text-blue-800',
      bgHover: 'hover:bg-blue-100'
    },
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-50 to-gray-100 border-t border-gray-200 shadow-md">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            {
              title: "Academic Links",
              links: [
                { label: "Academics", href: "https://academic.iiti.ac.in/" },
                { label: "Academic Calendar", href: "/academic_calendar.pdf" },
                { label: "Holidays", href: "/holidays.pdf" },
                { label: "E-Payments", href: "https://www.iiti.ac.in/page/e-payments" }
              ]
            },
            {
              title: "Campus Facilities",
              links: [
                { label: "Health Centre", href: "https://healthcenter.iiti.ac.in/" },
                { label: "Counselling Services", href: "http://iiti.ac.in/page/counselling-cell" },
                { label: "Central Dining Facility", href: "https://diningfee.iiti.ac.in/" },
                { label: "Campus Facilities", href: "http://iiti.ac.in/page/campus-facilities" }
              ]
            },
            {
              title: "Services",
              links: [
                { label: "Transport Booking", href: "http://vbs.iiti.ac.in/" },
                { label: "Green Vehicle Schedule", href: "https://www.iiti.ac.in/public/storage/Green%20vehicle%20schedule-%202022-23.pdf" },
                { label: "Campus Safety", href: "http://safety.iiti.ac.in/" },
                { label: "Internal Complaints", href: "http://icc.iiti.ac.in/" }
              ]
            },
            {
              title: "Connect With Us",
              isSpecial: true
            }
          ].map((section, sectionIndex) => (
            <div 
              key={section.title} 
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 border-gray-300">
                {section.title}
              </h3>
              
              {section.isSpecial ? (
                <div className="flex space-x-4">
                  {socialLinks.map((social, index) => (
                    <Link
                      key={index}
                      href={social.url}
                      className={`
                        p-3 rounded-full transition-all duration-300
                        ${social.color} ${social.bgHover}
                        bg-white shadow-md hover:shadow-lg
                        flex items-center justify-center
                        group
                      `}
                    >
                      <social.icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      <span className="sr-only">{social.alt}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link 
                        href={link.href} 
                        className="
                          text-gray-600 hover:text-blue-600 
                          transition-colors duration-300
                          flex items-center group
                        "
                      >
                        <span className="mr-2 group-hover:translate-x-1 transition-transform">
                          →
                        </span>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="border-t mt-12 pt-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-gray-600">
            © {currentYear} Dashboard. All rights reserved.
          </p>
          <div className="flex space-x-4">
            <Link 
              href="#" 
              className="
                text-sm text-gray-600 hover:text-blue-600
                transition-colors duration-300
              "
            >
              Privacy Policy
            </Link>
            <Link 
              href="#" 
              className="
                text-sm text-gray-600 hover:text-blue-600
                transition-colors duration-300
              "
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;