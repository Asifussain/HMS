// app/components/GoogleSignInButton.jsx
"use client";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function GoogleSignInButton() {
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      console.error("Error signing in with Google:", error.message);
    }
    // Supabase will redirect to the OAuth provider,
    // and after signing in, the user is redirected back to your callback URL.
  };

  return (
    <button onClick={handleGoogleSignIn} style={buttonStyle}>
      Sign in with Google
    </button>
  );
}

const buttonStyle = {
  padding: "0.75rem 1.5rem",
  backgroundColor: "#db4437", // Google red
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};
