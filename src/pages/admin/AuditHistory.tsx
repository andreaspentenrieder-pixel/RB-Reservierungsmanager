import { useState, useEffect } from 'react';

export default function AuditHistory() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/audit').then(r => r.json()).then(d => { if(d.logs) setLogs(d.logs) });
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4 text-vr-blue">Änderungshistorie</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs text-gray-500">Datum</th>
            <th className="px-4 py-2 text-left text-xs text-gray-500">Aktion</th>
            <th className="px-4 py-2 text-left text-xs text-gray-500">Von</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {logs.map(l => (
            <tr key={l.id}>
              <td className="px-4 py-2 text-sm">{new Date(l.created_at).toLocaleString('de')}</td>
              <td className="px-4 py-2 text-sm">{l.description}</td>
              <td className="px-4 py-2 text-sm">{l.actor_yh_identifier}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
