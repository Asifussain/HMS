"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function RoleBasedRedirect() {
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchAndRedirect() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const email = session.user.email;
        // Restrict sign in to only @iiti.ac.in email addresses.
        if (!email.toLowerCase().endsWith("@iiti.ac.in")) {
          setError("Only iiti.ac.in emails are allowed to log in.");
          // Sign the user out if not allowed.
          await supabase.auth.signOut();
          router.push("/sign-in");
          return;
        }
        try {
          const res = await fetch(`/api/user/role?email=${encodeURIComponent(email)}`);
          const data = await res.json();
          if (data.error) {
            console.error("Error fetching role:", data.error);
            router.push("/student"); // fallback if role not found
          } else {
            // Redirect based on the role
            if (data.role === "admin") {
              router.push("/admin");
            } else if (data.role === "guard") {
              router.push("/guard");
            } else {
              router.push("/student");
            }
          }
        } catch (err) {
          console.error("Redirection error:", err);
          router.push("/student");
        }
      } else {
        // If there's no session, stay or redirect to sign in.
        router.push("/sign-in");
      }
    }
    fetchAndRedirect();
  }, [router]);

  return error ? <div>{error}</div> : <div>Redirecting based on your role...</div>;
}
