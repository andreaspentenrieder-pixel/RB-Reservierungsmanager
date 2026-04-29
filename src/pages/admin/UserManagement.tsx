import { useState, useEffect } from 'react';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    if(data.users) setUsers(data.users);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-semibold mb-4 text-vr-blue">User Verwaltung</h2>
      <p className="text-gray-600 mb-6">Für diesen Prototyp können Sie neue Nutzer anlegen und verwalten.</p>
      
      {/* Basic table rendering */}
      <table className="min-w-full divide-y divide-gray-200 mt-4">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">YH-Kennung</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">E-Mail</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rolle</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map(u => (
            <tr key={u.id}>
              <td className="px-4 py-2 text-sm">{u.yh_identifier}</td>
              <td className="px-4 py-2 text-sm">{u.email}</td>
              <td className="px-4 py-2 text-sm">{u.role}</td>
              <td className="px-4 py-2 text-sm">{u.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
