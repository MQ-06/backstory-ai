import { SignIn } from "@clerk/nextjs";

import { AuthPanel } from "@/components/auth-panel";

export default function SignInPage() {
  return (
    <AuthPanel>
      <SignIn />
    </AuthPanel>
  );
}
