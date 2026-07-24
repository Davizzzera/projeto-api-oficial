import { AppShell } from "@/components/layout/app-shell";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getInternalApiUrl } from "@/lib/internal-api-url";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const cookieHeader = headersList.get('cookie') || '';

  const internalApiUrl = getInternalApiUrl();

  const res = await fetch(new URL("/auth/me", internalApiUrl), {
    headers: {
      'Cookie': cookieHeader
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    redirect('/login');
  }

  const { user, organization } = await res.json();

  return <AppShell user={user} organization={organization}>{children}</AppShell>;
}
