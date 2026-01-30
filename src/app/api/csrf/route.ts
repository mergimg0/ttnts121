import { NextResponse } from "next/server";
import { getCsrfToken, setCsrfCookie } from "@/lib/csrf";

export async function GET() {
  const token = await getCsrfToken();

  const response = NextResponse.json({
    success: true,
    token,
  });

  setCsrfCookie(response, token);

  return response;
}
