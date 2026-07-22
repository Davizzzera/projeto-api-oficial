import { AppShell } from "@/components/layout/app-shell";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const cookieHeader = headersList.get('cookie') || '';

  const res = await fetch(`${process.env.INTERNAL_API_URL}/auth/me`, {
    headers: {
      'Cookie': cookieHeader
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    redirect('/login');
  }

  return <AppShell>{children}</AppShell>;
}
