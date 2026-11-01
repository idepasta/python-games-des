import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { ClassFilterProvider } from "@/components/admin/class-filter";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <ClassFilterProvider>
      <AdminShell>
        <Outlet />
      </AdminShell>
    </ClassFilterProvider>
  );
}
