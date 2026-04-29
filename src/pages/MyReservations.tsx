import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function MyReservations() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await fetch('/api/reservations/my');
      const data = await res.json();
      if (data.reservations) {
        setReservations(data.reservations);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancel = async (id: number) => {
    if (!confirm('Möchten Sie diese Reservierung wirklich stornieren?')) return;
    try {
      const res = await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      } else {
        alert('Fehler beim Stornieren.');
      }
    } catch {
      alert('Fehler beim Stornieren.');
    }
  };

  return (
    <div className="vr-card overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Meine Buchungen</h2>
      </div>
      
      <div>
        {loading ? (
          <p>Laden...</p>
        ) : reservations.length === 0 ? (
          <p className="text-gray-500">Keine aktiven Reservierungen gefunden.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-gray-100">
                <tr className="text-xs text-gray-400 uppercase tracking-wider">
                  <th className="pb-4">Typ</th>
                  <th className="pb-4">Start</th>
                  <th className="pb-4">Ende</th>
                  <th className="pb-4">Beschreibung</th>
                  <th className="pb-4 text-right">Aktion</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700 divide-y divide-gray-50">
                {reservations.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 font-semibold">
                      {r.resource_type === 'room' ? 'Raum' : 'Fahrzeug'} (ID: {r.resource_id})
                    </td>
                    <td className="py-4">
                      {new Date(r.start_at).toLocaleString('de-DE')}
                    </td>
                    <td className="py-4">
                      {new Date(r.end_at).toLocaleString('de-DE')}
                    </td>
                    <td className="py-4">
                      {r.description || '-'}
                    </td>
                    <td className="py-4 text-right">
                      <button onClick={() => handleCancel(r.id)} className="text-red-500 hover:text-red-700 font-semibold text-xs uppercase tracking-wider">
                        Stornieren
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
