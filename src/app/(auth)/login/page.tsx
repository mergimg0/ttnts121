import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your TTNTS121 account to manage bookings and view your sessions.",
};

export default function LoginPage() {
  return <LoginForm />;
}
