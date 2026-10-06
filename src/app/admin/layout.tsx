import { AdminShell } from "@/components/admin/shell";

export const metadata = { title: "Reef HQ" };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
