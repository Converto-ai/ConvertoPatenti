import { auth } from "@/src/lib/auth/config";
import { redirect } from "next/navigation";
import { Sidebar } from "@/src/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        autoscuolaNome={session.user.autoscuolaNome}
        operatoreNome={session.user.name}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
