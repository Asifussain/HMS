import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      {/* Redirect to /role-redirect after sign-up */}
      <SignUp afterSignUpUrl="/role-redirect" />
    </div>
  );
}
