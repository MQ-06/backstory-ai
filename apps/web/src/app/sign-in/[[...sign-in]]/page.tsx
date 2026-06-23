"use client";

import { SignIn } from "@clerk/nextjs";

import { AuthPanel } from "@/components/auth-panel";
import { ClerkAuthForm, useClerkAppearance } from "@/components/clerk-auth-form";

function SignInForm() {
  const appearance = useClerkAppearance();
  return (
    <ClerkAuthForm>
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" appearance={appearance} />
    </ClerkAuthForm>
  );
}

export default function SignInPage() {
  return (
    <AuthPanel>
      <SignInForm />
    </AuthPanel>
  );
}
