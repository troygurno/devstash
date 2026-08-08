import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SIGN_IN_PATH } from "@/lib/auth-routes";
import { getCurrentUser } from "@/lib/db/user";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // `proxy.ts` has already established that a session cookie exists, so a null user
  // here means the session names a row that no longer exists. Sessions are JWTs and
  // outlive the rows they name — deleting a user does not invalidate their cookie.
  //
  // Without this the page renders every empty state *and* drops the sidebar footer,
  // which is where sign-out lives: the account would be stuck on a blank dashboard
  // with no way out. `getCurrentUser` is `cache`d, so this costs no extra query.
  const user = await getCurrentUser();
  if (!user) {
    redirect(SIGN_IN_PATH);
  }

  // The sidebar writes this cookie on every toggle. Reading it here means a reload
  // renders the collapsed state directly instead of flashing open first.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset>
          <TopBar />
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
