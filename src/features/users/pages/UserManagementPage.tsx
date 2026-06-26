import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { supabase } from "@/lib/supabaseClient";

export function UserManagementPage() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email, phone_number, role, created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <h1 className="page-title">User Management</h1>
      <p className="page-description">Administrators can view and manage registered system users.</p>

      <Card className="mt-6 overflow-x-auto">
        {isLoading ? <p>Loading users...</p> : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="py-3">Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{user.full_name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone_number ?? "-"}</td>
                  <td>{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
