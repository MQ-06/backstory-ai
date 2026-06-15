import { SignUp } from "@clerk/nextjs";

import { AuthPanel } from "@/components/auth-panel";

export default function SignUpPage() {
  return (
    <AuthPanel
      title="Create your account"
      description="Start capturing why — one engagement at a time."
    >
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </AuthPanel>
  );
}
