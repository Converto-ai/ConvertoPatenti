"use server";

import { signIn } from "@/src/lib/auth/config";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/pratiche",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=1");
    }
    // Re-throw NEXT_REDIRECT so Next.js handles navigation
    throw error;
  }
}
