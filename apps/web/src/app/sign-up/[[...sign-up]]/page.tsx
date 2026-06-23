"use client";

import { SignUp } from "@clerk/nextjs";

import { AuthPanel } from "@/components/auth-panel";
import { ClerkAuthForm, useClerkAppearance } from "@/components/clerk-auth-form";

function SignUpForm() {
  const appearance = useClerkAppearance();
  return (
    <ClerkAuthForm>
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" appearance={appearance} />
    </ClerkAuthForm>
  );
}

export default function SignUpPage() {
  return (
    <AuthPanel
      title="Create your account"
      description="Start capturing why — one engagement at a time."
    >
      <SignUpForm />
    </AuthPanel>
  );
}
