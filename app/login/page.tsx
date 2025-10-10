import { Suspense } from "react";
import LoginClient from "./rcc/login-client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginClient />
    </Suspense>
  );
}
