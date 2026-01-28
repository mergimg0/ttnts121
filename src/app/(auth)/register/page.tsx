import { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a TTNTS121 account to book sessions and manage your children's football activities.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
