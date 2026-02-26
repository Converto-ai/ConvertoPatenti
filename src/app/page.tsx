import { redirect } from "next/navigation";
import { auth } from "@/src/lib/auth/config";

export default async function Home() {
  const session = await auth();
  if (session) {
    redirect("/pratiche");
  }
  redirect("/login");
}
